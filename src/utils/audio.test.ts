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
    mockFilterNode = {
      type: 'lowpass',
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
      currentTime: 100,
      resume: vi.fn(),
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGainNode),
      createBiquadFilter: vi.fn().mockReturnValue(mockFilterNode),
      destination: {}, // Dummy object
    };

    class MockAudioContext {
      constructor() {
        return mockAudioContext;
      }
    }

    // Make global AudioContext return our mock
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('webkitAudioContext', undefined);
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
    vi.unstubAllGlobals();
    // Reset the internal audioCtx to null so it recreates for each test
    // Since it's a let variable, we can't easily reset it from outside.
    // However, if we do vi.resetModules(), the next dynamic import will have a fresh state.
    vi.resetModules();
  });

  describe('Happy path', () => {
    it('playClick should successfully create nodes and play sound', async () => {
      const { playClick } = await import('./audio');

      playClick();

      // Verify AudioContext was created/used
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);

      // Verify oscillator settings
      expect(mockOscillator.type).toBe('triangle');
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(180, 100);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(45, 100 + 0.08);

      // Verify gain settings
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 100);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 100 + 0.08);

      // Verify connections
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);

      // Verify start/stop
      expect(mockOscillator.start).toHaveBeenCalledWith(100);
      expect(mockOscillator.stop).toHaveBeenCalledWith(100 + 0.1);

      // Verify console.warn was not called
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('playStart should successfully create nodes and play sound', async () => {
      const { playStart } = await import('./audio');

      playStart();

      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(1);

      expect(mockOscillator.start).toHaveBeenCalledTimes(2);
      expect(mockOscillator.stop).toHaveBeenCalledTimes(2);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('playReward should successfully create nodes and play sound', async () => {
      const { playReward } = await import('./audio');

      playReward();

      // 4 notes * (2 osc + 1 gain + 1 filter)
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(8);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4);
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(4);

      expect(mockOscillator.start).toHaveBeenCalledTimes(8);
      expect(mockOscillator.stop).toHaveBeenCalledTimes(8);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should resume AudioContext if state is suspended', async () => {
      mockAudioContext.state = 'suspended';
      const { playClick } = await import('./audio');

      playClick();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('should fallback to webkitAudioContext if AudioContext is not available', async () => {
      class MockAudioContext {
        constructor() {
          return mockAudioContext;
        }
      }

      // Remove AudioContext
      vi.stubGlobal('AudioContext', undefined);
      // Add webkitAudioContext
      vi.stubGlobal('webkitAudioContext', MockAudioContext);

      const { playClick } = await import('./audio');
      playClick();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('should handle and warn when both AudioContext and webkitAudioContext are missing', async () => {
      // Remove both contexts
      vi.stubGlobal('AudioContext', undefined);
      vi.stubGlobal('webkitAudioContext', undefined);

      const { playClick } = await import('./audio');
      playClick();

      expect(console.warn).toHaveBeenCalledWith('Audio click failed to play:', expect.any(TypeError));
    });

    it('should handle and warn when an error is thrown during playback', async () => {
      // Make createOscillator throw an error
      const error = new Error('Failed to create oscillator');
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw error;
      });

      const { playClick, playStart, playReward } = await import('./audio');

      playClick();
      expect(console.warn).toHaveBeenCalledWith('Audio click failed to play:', error);

      // Also test for playStart and playReward
      playStart();
      expect(console.warn).toHaveBeenCalledWith('Audio start failed to play:', error);

      playReward();
      expect(console.warn).toHaveBeenCalledWith('Audio reward failed to play:', error);
    });
  });
});
