import { renderHook, act } from '@testing-library/react';
import { useLiveAPI } from './useLiveAPI';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create the mock connect function in outer scope so we can access it
const mockConnectFn = vi.fn();

// We need to mock the GoogleGenAI module correctly as an ES6 class module
vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    live = {
      connect: mockConnectFn
    };
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
    Modality: {
      AUDIO: 'AUDIO',
    },
  };
});

describe('useLiveAPI', () => {
  let mockSession: any;
  let mockAudioContext: any;
  let mockMediaStream: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockSession = {
      sendRealtimeInput: vi.fn(),
      close: vi.fn(),
    };

    // Clear calls and set resolved value
    mockConnectFn.mockClear();
    mockConnectFn.mockResolvedValue(mockSession);

    // Mute console.error/warn to avoid spam in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock global AudioContext
    mockAudioContext = {
      createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn() }),
      createScriptProcessor: vi.fn().mockReturnValue({
        connect: vi.fn(),
        disconnect: vi.fn(),
        onaudioprocess: null
      }),
      createGain: vi.fn().mockReturnValue({ connect: vi.fn(), gain: { value: 1 } }),
      createBuffer: vi.fn().mockReturnValue({
        getChannelData: vi.fn().mockReturnValue(new Float32Array(0)),
        duration: 1
      }),
      createBufferSource: vi.fn().mockReturnValue({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn()
      }),
      close: vi.fn(),
      destination: {},
      currentTime: 0
    };
    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext) as any;

    // Mock global navigator
    mockMediaStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
    };
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockMediaStream);
    Object.defineProperty(global, 'navigator', {
      value: {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      },
      writable: true,
    });

    // Mock global fetch/window if needed
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          protocol: 'http:',
          host: 'localhost:3000'
        }
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useLiveAPI());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.userTranscript).toBe("");
    expect(result.current.aiTranscript).toBe("");
    expect(result.current.hasMicrophone).toBe(true);
  });

  it('should handle successful connection and disconnect', async () => {
    const { result } = renderHook(() => useLiveAPI());

    const mockTopic = { title: "Test", description: "Desc", grammar: "Grammar", vocabulary: ["word1"] };
    const mockRole = { name: "Role", description: "Desc", winCondition: "Win", loseCondition: "Lose" };

    // Start connecting
    act(() => {
      result.current.connect("John", mockRole, mockTopic, 'student');
    });

    expect(result.current.isConnecting).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockConnectFn).toHaveBeenCalled();

    // Calling disconnect
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(mockSession.close).toHaveBeenCalled();
  });

  it('should handle connection error', async () => {
    mockConnectFn.mockRejectedValueOnce(new Error("Connection failed"));

    const { result } = renderHook(() => useLiveAPI());
    const mockTopic = { title: "Test", description: "Desc", grammar: "Grammar", vocabulary: ["word1"] };

    act(() => {
      result.current.connect("John", {}, mockTopic, 'student');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe("Connection failed");
    expect(result.current.isConnecting).toBe(false);
  });

  it('should send text message successfully', async () => {
    const { result } = renderHook(() => useLiveAPI());
    const mockTopic = { title: "Test", description: "Desc", grammar: "Grammar", vocabulary: ["word1"] };

    act(() => {
      result.current.connect("John", {}, mockTopic, 'student');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockConnectFn).toHaveBeenCalled();

    act(() => {
      result.current.sendTextMessage("Hello there");
    });

    expect(mockSession.sendRealtimeInput).toHaveBeenCalledWith({ text: "Hello there" });
    expect(result.current.userTranscript).toBe(" Hello there");
  });

  it('should request feedback successfully', async () => {
    const { result } = renderHook(() => useLiveAPI());
    const mockTopic = { title: "Test", description: "Desc", grammar: "Grammar", vocabulary: ["word1"] };

    act(() => {
      result.current.connect("John", {}, mockTopic, 'student');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockConnectFn).toHaveBeenCalled();

    act(() => {
      result.current.requestFeedback();
    });

    expect(mockSession.sendRealtimeInput).toHaveBeenCalledWith({
      text: expect.stringContaining("Please break character and provide friendly, empathetic, and constructive feedback")
    });
    expect(result.current.aiTranscript).toContain("--- FEEDBACK ---");
  });
});
