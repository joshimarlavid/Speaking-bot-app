import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLiveAPI } from './useLiveAPI';

// Mock the Live API Client dependency
const mockSendRealtimeInput = vi.fn();
const mockLiveSession = {
  sendRealtimeInput: mockSendRealtimeInput,
  close: vi.fn(),
};

// Properly mock the GoogleGenAI and ai.live.connect structure
const mockLiveConnect = vi.fn().mockResolvedValue(mockLiveSession);
const mockAiInstance = {
  live: {
    connect: mockLiveConnect
  }
};

vi.mock('@google/genai', () => {
  return {
    Modality: { AUDIO: 'AUDIO' },
    GoogleGenAI: class {
      constructor() {
        return mockAiInstance;
      }
    }
  };
});

describe('useLiveAPI', () => {
  let originalMediaDevices: any;
  let originalAudioContext: any;
  let originalConsoleWarn: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalMediaDevices = navigator.mediaDevices;
    originalAudioContext = window.AudioContext;
    originalConsoleWarn = console.warn;
    // Suppress console.warn about microphone not found during test run
    console.warn = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      writable: true,
      configurable: true,
    });
    window.AudioContext = originalAudioContext;
    console.warn = originalConsoleWarn;
  });

  it('should fall back to text mode and set hasMicrophone to false when microphone is unavailable', async () => {
    // Setup the mock to reject the getUserMedia promise
    const getUserMediaMock = vi.fn().mockRejectedValue(new Error('Microphone not found or permission denied'));

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      writable: true,
      configurable: true,
    });

    // Provide a class for AudioContext to avoid "is not a constructor"
    class AudioContextMock {
      createMediaStreamSource = vi.fn();
      createScriptProcessor = vi.fn();
      createGain = vi.fn();
      destination = {};
      currentTime = 0;
      close = vi.fn();
    }
    window.AudioContext = AudioContextMock as any;

    const { result } = renderHook(() => useLiveAPI());

    // Check initial state
    expect(result.current.hasMicrophone).toBe(true);

    const mockRole = {
      description: 'Test Role',
      winCondition: 'Win',
      loseCondition: 'Lose',
      voice: 'Test Voice'
    };
    const mockTopic = {
      grammar: 'Test Grammar',
      vocabulary: ['word1', 'word2']
    };

    // Call connect()
    await act(async () => {
      await result.current.connect('Test Student', mockRole as any, mockTopic as any, null);
    });

    // We need to simulate the `onopen` callback since the mock won't automatically call it
    const connectArgs = mockLiveConnect.mock.calls[0][0];
    await act(async () => {
      if (connectArgs.callbacks && connectArgs.callbacks.onopen) {
        await connectArgs.callbacks.onopen();
      }
    });

    // Check that getUserMedia was called
    expect(getUserMediaMock).toHaveBeenCalled();

    // Verify fallback to text mode: hasMicrophone should be set to false
    expect(result.current.hasMicrophone).toBe(false);
  });
});
