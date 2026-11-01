import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLiveAPI } from "./useLiveAPI";
import { Role, Topic } from "./types";

const mockConnect = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn(function() {
      return {
        live: {
          connect: mockConnect,
        },
      };
    }),
    Modality: {
      AUDIO: "AUDIO",
    },
  };
});

describe("useLiveAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useLiveAPI());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.userTranscript).toBe("");
    expect(result.current.aiTranscript).toBe("");
    expect(result.current.hasMicrophone).toBe(true);
  });

  it("should handle connection error with Error instance (unknown type narrowing)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockConnect.mockRejectedValueOnce(new Error("Network connection failure"));

    const { result } = renderHook(() => useLiveAPI());

    await act(async () => {
      await result.current.connect(
        "Alice",
        { name: "Guide", description: "A tour guide", winCondition: "Win", loseCondition: "Lose", voice: "Puck" },
        { title: "Past Tense", description: "Practice past tense", grammar: "Past Simple", vocabulary: ["walked", "talked"] },
        "student"
      );
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBe("Network connection failure");
    expect(consoleSpy).toHaveBeenCalledWith("Failed to connect:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("should handle non-Error connection rejection gracefully (unknown type narrowing)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockConnect.mockRejectedValueOnce("String error message");

    const { result } = renderHook(() => useLiveAPI());

    await act(async () => {
      await result.current.connect(
        "Bob",
        { name: "Teacher", description: "Teacher desc", winCondition: "Win", loseCondition: "Lose", voice: "Puck" },
        { title: "Verbs", description: "Practice verbs", grammar: "Action verbs", vocabulary: ["run", "jump"] },
        "teacher"
      );
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBe("String error message");
    consoleSpy.mockRestore();
  });

  it("should handle microphone failure gracefully and fallback to text mode", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockSession = {
      sendRealtimeInput: vi.fn(),
      close: vi.fn(),
    };

    let capturedCallbacks: any;
    mockConnect.mockImplementation(async (options: any) => {
      capturedCallbacks = options.callbacks;
      return mockSession;
    });

    // Mock navigator.mediaDevices.getUserMedia failure
    const origMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied or not found")),
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useLiveAPI());

    await act(async () => {
      await result.current.connect(
        "Charlie",
        { name: "Interviewer", description: "Job interviewer", winCondition: "Hired", loseCondition: "Rejected", voice: "Puck" },
        { title: "Interviews", description: "Job interview", grammar: "Conditionals", vocabulary: ["experience", "team"] },
        "student"
      );
    });

    expect(capturedCallbacks).toBeDefined();

    // Trigger onopen to trigger microphone setup
    await act(async () => {
      await capturedCallbacks.onopen();
    });

    expect(result.current.hasMicrophone).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      "Microphone not found, falling back to text mode:",
      expect.any(Error)
    );

    // Test text message sending works in text mode
    act(() => {
      result.current.sendTextMessage("Hello there");
    });
    expect(mockSession.sendRealtimeInput).toHaveBeenCalledWith({ text: "Hello there" });
    expect(result.current.userTranscript).toContain("Hello there");

    // Test disconnect
    act(() => {
      result.current.disconnect();
    });
    expect(result.current.isConnected).toBe(false);

    warnSpy.mockRestore();
    Object.defineProperty(navigator, "mediaDevices", {
      value: origMediaDevices,
      writable: true,
      configurable: true,
    });
  });
  it("should connect properly with typed Role and Topic", async () => {
    const mockSession = {
      sendRealtimeInput: vi.fn(),
      close: vi.fn(),
    };

    let capturedOptions: any;
    mockConnect.mockImplementation(async (options: any) => {
      capturedOptions = options;
      return mockSession;
    });

    const role: Role = {
      id: "role_1",
      name: "Barista",
      description: "A friendly cafe barista",
      winCondition: "Order coffee",
      loseCondition: "Leave without coffee",
      voice: "Zephyr",
    };

    const topic: Topic = {
      id: "topic_1",
      title: "Ordering Coffee",
      description: "How to order in a cafe",
      grammar: "Polite requests",
      vocabulary: ["latte", "espresso"],
    };

    const { result } = renderHook(() => useLiveAPI());

    await act(async () => {
      await result.current.connect("Diana", role, topic, "student");
    });

    expect(mockConnect).toHaveBeenCalled();
    expect(capturedOptions.config.systemInstruction).toContain("You are playing the role of Barista");
    expect(capturedOptions.config.systemInstruction).toContain("Diana");
    expect(capturedOptions.config.systemInstruction).toContain("Polite requests");
    expect(capturedOptions.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Zephyr");
  });

  it("should connect properly in teacher mode with null role and typed Topic", async () => {
    const mockSession = {
      sendRealtimeInput: vi.fn(),
      close: vi.fn(),
    };

    let capturedOptions: any;
    mockConnect.mockImplementation(async (options: any) => {
      capturedOptions = options;
      return mockSession;
    });

    const topic: Topic = {
      id: "topic_2",
      title: "Conditionals",
      description: "Practice conditionals",
      grammar: "If clauses",
      vocabulary: ["would", "could"],
    };

    const { result } = renderHook(() => useLiveAPI());

    await act(async () => {
      await result.current.connect("Evan", null, topic, "teacher");
    });

    expect(mockConnect).toHaveBeenCalled();
    expect(capturedOptions.config.systemInstruction).toContain("You are an expert English Grammar Teacher");
    expect(capturedOptions.config.systemInstruction).toContain("Evan");
    expect(capturedOptions.config.systemInstruction).toContain("Conditionals");
    expect(capturedOptions.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Puck");
  });
});
