import { renderHook, act, waitFor } from '@testing-library/react';
import { useLiveAPI } from './useLiveAPI';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mocks ---

// Mock GoogleGenAI
const mockSendRealtimeInput = vi.fn();
const mockClose = vi.fn();
let mockSessionOnMessage: any = null;

vi.mock('@google/genai', () => {
  return {
    Modality: {
      TEXT: 'TEXT',
      AUDIO: 'AUDIO',
      IMAGE: 'IMAGE'
    },
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: vi.fn(),
      };
      live = {
        connect: vi.fn((config) => {
          // It's under config.callbacks in the hook
          if (config.callbacks && config.callbacks.onmessage) {
             (global as any).mockSessionOnMessage = config.callbacks.onmessage;
          } else if (config.onmessage) {
             (global as any).mockSessionOnMessage = config.onmessage;
          }
          const session = {
            sendRealtimeInput: vi.fn(),
            close: vi.fn()
          };
          if (config.callbacks && config.callbacks.onopen) {
             setTimeout(() => config.callbacks.onopen(), 0);
          }
          return Promise.resolve(session);
        })
      };
    }
  };
});

// Mock AudioContext and nodes
const mockCreateMediaStreamSource = vi.fn();
const mockCreateScriptProcessor = vi.fn();
const mockCreateGain = vi.fn();
const mockAudioDestination = {};
const mockScriptProcessorNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  onaudioprocess: null
};
const mockGainNode = {
  gain: { value: 1 },
  connect: vi.fn(),
  disconnect: vi.fn()
};
const mockMediaStreamSource = {
  connect: vi.fn(),
  disconnect: vi.fn()
};

class MockAudioContext {
  createMediaStreamSource = mockCreateMediaStreamSource.mockReturnValue(mockMediaStreamSource);
  createScriptProcessor = mockCreateScriptProcessor.mockReturnValue(mockScriptProcessorNode);
  createGain = mockCreateGain.mockReturnValue(mockGainNode);
  destination = mockAudioDestination;
  close = vi.fn();
  currentTime = 0;
  createBuffer = vi.fn(() => ({
    getChannelData: vi.fn(() => new Float32Array(0)),
    duration: 1
  }));
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn()
  }));
}
(window as any).AudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
});

describe('useLiveAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionOnMessage = null;
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    });
    // Set env var required by useLiveAPI
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLiveAPI());
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.userTranscript).toBe('');
    expect(result.current.aiTranscript).toBe('');
    expect(result.current.hasMicrophone).toBe(true);
  });

  it('should handle successful connection with microphone', async () => {
    const { result } = renderHook(() => useLiveAPI());

    act(() => {
      result.current.connect('John', { name: 'Teacher', description: 'desc' }, { title: 'Tenses', description: 'desc', grammar: 'grammar', vocabulary: [] }, 'student');
    });

    expect(result.current.isConnecting).toBe(true);

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(result.current.isConnecting).toBe(false);
    expect(result.current.hasMicrophone).toBe(true);
    expect(mockGetUserMedia).toHaveBeenCalled();
  });

  it('should handle successful connection without microphone (fallback to text mode)', async () => {
    // Mock getUserMedia to fail
    mockGetUserMedia.mockRejectedValueOnce(new Error('Microphone not found'));

    const { result } = renderHook(() => useLiveAPI());

    act(() => {
      result.current.connect('John', { name: 'Teacher', description: 'desc' }, { title: 'Tenses', description: 'desc', grammar: 'grammar', vocabulary: [] }, 'student');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(result.current.hasMicrophone).toBe(false);
    // Connection still succeeds, just no mic
    expect(result.current.error).toBeNull();
  });
});

  it('should be able to send text messages', async () => {
    const { result } = renderHook(() => useLiveAPI());

    act(() => {
      result.current.connect('John', { name: 'Teacher', description: 'desc' }, { title: 'Tenses', description: 'desc', grammar: 'grammar', vocabulary: [] }, 'student');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const testMessage = "Hello from test";

    // We need to wait for the sessionPromise inside connect to resolve before sendTextMessage can work.
    // In our mock, onopen is triggered, which resolves things, but the internal sessionRef.current is set AFTER await sessionPromise.
    // Our mock resolves sessionPromise synchronously essentially because of setTimeout, but we should make sure.
    await waitFor(() => {
        expect((result.current as any).error).toBeNull();
    });

    act(() => {
      result.current.sendTextMessage(testMessage);
    });

    // Check if user transcript was updated
    expect(result.current.userTranscript.trim()).toBe(testMessage);
  });

  it('should update aiTranscript when receiving messages', async () => {
    const { result } = renderHook(() => useLiveAPI());

    act(() => {
      result.current.connect('John', { name: 'Teacher', description: 'desc' }, { title: 'Tenses', description: 'desc', grammar: 'grammar', vocabulary: [] }, 'student');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate incoming message
    act(() => {
      if ((global as any).mockSessionOnMessage) {
        (global as any).mockSessionOnMessage({
          serverContent: {
            modelTurn: {
              parts: [{ text: "Hello there!" }]
            }
          }
        });
      }
    });

    expect(result.current.aiTranscript).toContain("Hello there!");
  });

  it('should clean up on disconnect', async () => {
    const { result } = renderHook(() => useLiveAPI());

    act(() => {
      result.current.connect('John', { name: 'Teacher', description: 'desc' }, { title: 'Tenses', description: 'desc', grammar: 'grammar', vocabulary: [] }, 'student');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Mock tracks stop
    const mockStop = vi.fn();
    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: () => [{ stop: mockStop }]
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
  });
