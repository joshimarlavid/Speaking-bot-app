import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('playStart', () => {
  let mockAudioContext: any;
  let mockOscillator1: any;
  let mockOscillator2: any;
  let mockGainNode: any;
  let mockBiquadFilter: any;
  let oscillatorCount = 0;

  beforeEach(() => {
    oscillatorCount = 0;

    mockOscillator1 = {
      type: '',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockOscillator2 = {
      type: '',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockBiquadFilter = {
      type: '',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      resume: vi.fn(),
      createOscillator: vi.fn(() => {
        oscillatorCount++;
        return oscillatorCount === 1 ? mockOscillator1 : mockOscillator2;
      }),
      createGain: vi.fn(() => mockGainNode),
      createBiquadFilter: vi.fn(() => mockBiquadFilter),
      destination: {},
    };

    vi.stubGlobal('window', {
      AudioContext: vi.fn().mockImplementation(function() {
        return mockAudioContext;
      }),
    });

    // Reset modules before importing to ensure a fresh environment for each test,
    // particularly to clear the cached `audioCtx` let variable.
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets up audio nodes and plays sound correctly', async () => {
    const { playStart } = await import('./audio');

    playStart();

    expect(window.AudioContext).toHaveBeenCalled();
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(1);

    // Assert connections
    expect(mockOscillator1.connect).toHaveBeenCalledWith(mockBiquadFilter);
    expect(mockOscillator2.connect).toHaveBeenCalledWith(mockBiquadFilter);
    expect(mockBiquadFilter.connect).toHaveBeenCalledWith(mockGainNode);
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);

    // Assert starts and stops
    expect(mockOscillator1.start).toHaveBeenCalledWith(0);
    expect(mockOscillator2.start).toHaveBeenCalledWith(0);
    expect(mockOscillator1.stop).toHaveBeenCalledWith(0.95);
    expect(mockOscillator2.stop).toHaveBeenCalledWith(0.95);
  });

  it('handles errors gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Make AudioContext throw to trigger catch block
    vi.stubGlobal('window', {
      AudioContext: vi.fn().mockImplementation(function() {
        throw new Error('AudioContext not supported');
      }),
    });

    // Re-import after setting the failing global window
    const { playStart } = await import('./audio');

    playStart();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Audio start failed to play:',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });
});
