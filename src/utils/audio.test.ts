import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('audio utilities', () => {
  let mockAudioContext: any;
  let mockOscillator: any;
  let mockGainNode: any;
  let mockFilter: any;
  let mockConsoleWarn: any;

  beforeEach(() => {
    vi.resetModules();

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

    mockGainNode = {
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
      currentTime: 1.0,
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGainNode),
      createBiquadFilter: vi.fn().mockReturnValue(mockFilter),
      destination: {},
      state: 'running',
    };

    const AudioContextMock = vi.fn(function() {
      return mockAudioContext;
    });

    vi.stubGlobal('window', { AudioContext: AudioContextMock });
    mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('playReward', () => {
    it('should play a reward sound using AudioContext', async () => {
      const { playReward } = await import('./audio');

      playReward();

      expect(mockConsoleWarn).not.toHaveBeenCalled();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(8);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4);
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(4);

      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it('should handle errors gracefully', async () => {
       vi.stubGlobal('window', { AudioContext: vi.fn(() => { throw new Error('Mock error'); }) });
       const { playReward } = await import('./audio');
       playReward();
       expect(mockConsoleWarn).toHaveBeenCalledWith('Audio reward failed to play:', expect.any(Error));
    });

    it('should handle Audio setup failed gracefully in playStart', async () => {
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new Error('Audio setup failed');
      });
      const { playStart } = await import('./audio');
      playStart();
      expect(mockConsoleWarn).toHaveBeenCalledWith('Audio start failed to play:', expect.any(Error));
    });

    it('should handle mock error gracefully in playReward after resetModules', async () => {
      vi.stubGlobal('window', { AudioContext: vi.fn(() => { throw new Error('Mock error'); }) });
      vi.resetModules();
      const { playReward } = await import('./audio');
      playReward();
      expect(mockConsoleWarn).toHaveBeenCalledWith('Audio reward failed to play:', expect.any(Error));
    });
  });
});
