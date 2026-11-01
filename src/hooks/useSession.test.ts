import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSession } from './useSession';

vi.mock('../useLiveAPI', () => ({
  useLiveAPI: () => ({
    isConnected: false,
    isConnecting: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    userTranscript: '',
    aiTranscript: '',
    requestFeedback: vi.fn(),
    hasMicrophone: true,
    sendTextMessage: vi.fn(),
  }),
}));

vi.mock('../utils/audio', () => ({
  playStart: vi.fn(),
  playClick: vi.fn(),
}));

describe('useSession - SpeechRecognition handling', () => {
  const originalSpeechRecognition = window.SpeechRecognition;
  const originalWebkitSpeechRecognition = window.webkitSpeechRecognition;

  beforeEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  afterEach(() => {
    window.SpeechRecognition = originalSpeechRecognition;
    window.webkitSpeechRecognition = originalWebkitSpeechRecognition;
    vi.restoreAllMocks();
  });

  it('sets warning when SpeechRecognition is not supported on window', () => {
    const { result } = renderHook(() =>
      useSession('student', { id: 'role1', name: 'Role 1', voice: 'Puck' }, 'Alice', {}, {}, null)
    );

    act(() => {
      result.current.startVoiceInput();
    });

    expect(result.current.elevenWarning).toBe(
      "Browser doesn't support basic speech recognition. Please type your message."
    );
    expect(result.current.isRecording).toBe(false);
  });

  it('initializes speech recognition and starts recording when SpeechRecognition is available', () => {
    let instance: any = null;
    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onresult: ((ev: any) => void) | null = null;
      start = vi.fn(() => {
        if (this.onstart) this.onstart();
      });
      stop = vi.fn(() => {
        if (this.onend) this.onend();
      });
      constructor() {
        instance = this;
      }
    }

    window.SpeechRecognition = MockSpeechRecognition as any;

    const { result } = renderHook(() =>
      useSession('student', { id: 'role1', name: 'Role 1', voice: 'Puck' }, 'Alice', {}, {}, null)
    );

    act(() => {
      result.current.startVoiceInput();
    });

    expect(instance).not.toBeNull();
    expect(instance.start).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.stopVoiceInput();
    });

    expect(instance.stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  it('falls back to webkitSpeechRecognition when SpeechRecognition is absent', () => {
    let instance: any = null;
    class MockWebkitSpeechRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onresult: ((ev: any) => void) | null = null;
      start = vi.fn(() => {
        if (this.onstart) this.onstart();
      });
      stop = vi.fn();
      constructor() {
        instance = this;
      }
    }

    window.webkitSpeechRecognition = MockWebkitSpeechRecognition as any;

    const { result } = renderHook(() =>
      useSession('student', { id: 'role1', name: 'Role 1', voice: 'Puck' }, 'Alice', {}, {}, null)
    );

    act(() => {
      result.current.startVoiceInput();
    });

    expect(instance).not.toBeNull();
    expect(instance.start).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });
});
