import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('audio utilities', () => {
  describe('playClick', () => {
    let mockAudioContext: any;
    let mockOscillator: any;
    let mockGain: any;
    let mockConsoleWarn: any;
    let playClick: any;

    beforeEach(async () => {
      vi.clearAllMocks();

      // Create mock oscillator
      mockOscillator = {
        type: '',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };

      // Create mock gain node
      mockGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };

      // Create mock audio context
      mockAudioContext = {
        currentTime: 100,
        state: 'running',
        resume: vi.fn(),
        createOscillator: vi.fn(() => mockOscillator),
        createGain: vi.fn(() => mockGain),
        destination: {},
      };

      // Stub window with AudioContext constructor
      vi.stubGlobal('window', {
        AudioContext: vi.fn().mockImplementation(() => mockAudioContext),
        webkitAudioContext: vi.fn().mockImplementation(() => mockAudioContext),
      });

      mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.resetModules();
      const audioModule = await import('./audio');
      playClick = audioModule.playClick;
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('should play a click sound by configuring nodes correctly', () => {
      playClick();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();

      // Verify oscillator
      expect(mockOscillator.type).toBe('triangle');
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(180, 100);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(45, 100.08);

      // Verify gain
      expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 100);
      expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 100.08);

      // Verify connections
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
      expect(mockGain.connect).toHaveBeenCalledWith(mockAudioContext.destination);

      // Verify start/stop
      expect(mockOscillator.start).toHaveBeenCalledWith(100);
      expect(mockOscillator.stop).toHaveBeenCalledWith(100.1);
    });

    it('should resume audio context if it is suspended', () => {
      mockAudioContext.state = 'suspended';

      playClick();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('should catch and log errors if audio playback fails', async () => {
      // Mock createOscillator to throw an error
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new TypeError('AudioContext not available');
      });

      playClick();

      expect(mockConsoleWarn).toHaveBeenCalledWith('Audio click failed to play:', expect.any(TypeError));
    });
  });

  describe('playStart', () => {
    let mockAudioContext: any;
    let mockOscillator1: any;
    let mockOscillator2: any;
    let mockGain: any;
    let mockFilter: any;
    let mockConsoleWarn: any;
    let oscCount = 0;

    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules();
      oscCount = 0;

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

      mockGain = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };

      mockFilter = {
        type: '',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };

      mockAudioContext = {
        currentTime: 10,
        state: 'running',
        resume: vi.fn(),
        createOscillator: vi.fn(() => {
          oscCount++;
          if (oscCount === 1) return mockOscillator1;
          return mockOscillator2;
        }),
        createGain: vi.fn(() => mockGain),
        createBiquadFilter: vi.fn(() => mockFilter),
        destination: {},
      };

      vi.stubGlobal('window', {
        AudioContext: vi.fn(function(this: any) { return mockAudioContext; }),
      });

      mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('should play the start audio successfully', async () => {
      const { playStart } = await import('./audio');

      playStart();

      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(1);

      expect(mockOscillator1.connect).toHaveBeenCalledWith(mockFilter);
      expect(mockOscillator2.connect).toHaveBeenCalledWith(mockFilter);
      expect(mockFilter.connect).toHaveBeenCalledWith(mockGain);
      expect(mockGain.connect).toHaveBeenCalledWith(mockAudioContext.destination);

      expect(mockOscillator1.start).toHaveBeenCalledWith(10);
      expect(mockOscillator2.start).toHaveBeenCalledWith(10);

      expect(mockOscillator1.stop).toHaveBeenCalledWith(10.95);
      expect(mockOscillator2.stop).toHaveBeenCalledWith(10.95);

      expect(mockFilter.frequency.setValueAtTime).toHaveBeenCalledWith(400, 10);
      expect(mockFilter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(100, 10.8);

      expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.01, 10);
      expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.35, 10.15);
      expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 10.8);

      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new Error('Audio setup failed');
      });

      const { playStart } = await import('./audio');

      playStart();

      expect(mockConsoleWarn).toHaveBeenCalledWith('Audio start failed to play:', expect.any(Error));
    });
  });
});
