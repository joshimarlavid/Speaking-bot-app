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

describe("useSession - handleElevenMessage", () => {
  const originalFetch = global.fetch;
  const originalAudio = global.Audio;
  const originalSpeechSynthesis = window.speechSynthesis;
  const originalSpeechSynthesisUtterance = (window as any).SpeechSynthesisUtterance;
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.Audio = originalAudio;
    window.speechSynthesis = originalSpeechSynthesis;
    (window as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    URL.createObjectURL = originalCreateObjectURL;
  });

  it("returns early without making a fetch call or updating loading state when text is empty", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const { result } = renderHook(() =>
      useSession(
        "student",
        { id: "role1", name: "Role 1", voice: "Puck", description: "A friendly partner" },
        "Alice",
        {},
        {},
        null
      )
    );

    await act(async () => {
      await result.current.handleElevenMessage("");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.elevenLabsLoading).toBe(false);
    expect(result.current.elevenMessages).toEqual([]);
  });

  it("returns early without making a fetch call when text contains only whitespace", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const { result } = renderHook(() =>
      useSession(
        "student",
        { id: "role1", name: "Role 1", voice: "Puck", description: "A friendly partner" },
        "Alice",
        {},
        {},
        null
      )
    );

    await act(async () => {
      await result.current.handleElevenMessage("   \t\n  ");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.elevenLabsLoading).toBe(false);
    expect(result.current.elevenMessages).toEqual([]);
  });

  it("successfully processes non-empty text message with audio playback", async () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    class MockAudio {
      src: string;
      constructor(src: string) {
        this.src = src;
      }
      play = playMock;
    }
    global.Audio = MockAudio as any;
    URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-audio-url");

    const mockBlob = new Blob(["mock-audio"], { type: "audio/mpeg" });
    const mockHeaders = new Headers({
      "x-response-text": encodeURIComponent("Hello Alice! Nice to meet you."),
    });

    global.fetch = vi.fn().mockResolvedValue({
      headers: mockHeaders,
      blob: vi.fn().mockResolvedValue(mockBlob),
    });

    const { result } = renderHook(() =>
      useSession(
        "student",
        { id: "role1", name: "Sarah", voice: "Puck", description: "A helpful guide" },
        "Alice",
        {},
        {},
        null
      )
    );

    await act(async () => {
      await result.current.handleElevenMessage("Hi there!");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/chat-roleplay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_input: "Hi there!",
        persona_prompt:
          "You are playing the role of Sarah. A helpful guide. The user is the student Alice. Have a conversation with them and naturally encourage them to win. Maintain this character deeply. Keep your responses short, natural, and friendly (1-2 sentences).",
        voice_id: "EXAVITQu4vr4xnSDxMaL",
      }),
    });

    expect(result.current.elevenMessages).toEqual([
      { role: "model", text: "Hello Alice! Nice to meet you." },
    ]);
    expect(result.current.elevenLabsLoading).toBe(false);
    expect(playMock).toHaveBeenCalled();
  });

  it("handles speech synthesis fallback when elevenlabs is missing or error", async () => {
    const mockSpeak = vi.fn();
    window.speechSynthesis = {
      speak: mockSpeak,
    } as any;
    class MockSpeechSynthesisUtterance {
      text: string;
      lang = "";
      constructor(text: string) {
        this.text = text;
      }
    }
    (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;

    const mockHeaders = new Headers({
      "x-elevenlabs-missing": "true",
    });

    global.fetch = vi.fn().mockResolvedValue({
      headers: mockHeaders,
      json: vi.fn().mockResolvedValue({ text: "Fallback synthesized text" }),
    });

    const { result } = renderHook(() =>
      useSession(
        "student",
        { id: "role1", name: "Sarah", voice: "Puck", description: "A helpful guide" },
        "Alice",
        {},
        {},
        null
      )
    );

    await act(async () => {
      await result.current.handleElevenMessage("Test fallback");
    });

    expect(result.current.elevenWarning).toBe(
      "Neural Voice fallback: Please configure ELEVEN_API_KEY to hear realistic characters."
    );
    expect(mockSpeak).toHaveBeenCalled();
    expect(result.current.elevenMessages).toEqual([
      { role: "model", text: "Fallback synthesized text" },
    ]);
    expect(result.current.elevenLabsLoading).toBe(false);
  });
});
