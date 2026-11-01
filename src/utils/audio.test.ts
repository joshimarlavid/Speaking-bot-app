import { describe, it, expect, vi, beforeEach, afterEach, type Mock, type MockInstance } from 'vitest';

interface MockAudioParam {
  setValueAtTime: Mock;
  exponentialRampToValueAtTime: Mock;
  linearRampToValueAtTime?: Mock;
}

interface MockOscillatorNode {
  type: string;
  frequency: MockAudioParam;
  connect: Mock;
  start: Mock;
  stop: Mock;
}

interface MockGainNode {
  gain: MockAudioParam;
  connect: Mock;
}

interface MockBiquadFilterNode {
  type: string;
  frequency: MockAudioParam;
  connect: Mock;
}

interface MockAudioContext {
  currentTime: number;
  state: AudioContextState | string;
  resume: Mock;
  createOscillator: Mock;
  createGain: Mock;
  createBiquadFilter?: Mock;
  destination: object;
}


describe('audio utilities', () => {
  describe('playClick', () => {
    let mockAudioContext: MockAudioContext;
    let mockOscillator: MockOscillatorNode;
    let mockGain: MockGainNode;
    let mockConsoleWarn: MockInstance;

    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules();

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
        AudioContext: vi.fn(function() { return mockAudioContext; }),
        webkitAudioContext: vi.fn(function() { return mockAudioContext; }),
      });

      mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('should play a click sound by configuring nodes correctly', async () => {
      const { playClick } = await import('./audio');
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

    it('should resume audio context if it is suspended', async () => {
      mockAudioContext.state = 'suspended';
      const { playClick } = await import('./audio');

      playClick();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('should catch and log errors if audio playback fails', async () => {
      // Mock createOscillator to throw an error
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new TypeError('AudioContext not available');
      });

      const { playClick } = await import('./audio');

      playClick();

      expect(mockConsoleWarn).toHaveBeenCalledWith('Audio click failed to play:', expect.any(TypeError));
    });
  });

  describe('playStart', () => {
    let mockAudioContext: MockAudioContext;
    let mockOscillator1: MockOscillatorNode;
    let mockOscillator2: MockOscillatorNode;
    let mockGain: MockGainNode;
    let mockFilter: MockBiquadFilterNode;
    let mockConsoleWarn: MockInstance;
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
        AudioContext: vi.fn(function() { return mockAudioContext; }),
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

  describe('float32ToPcm16Base64', () => {
    it('should correctly convert Float32Array to base64 PCM16 LE matching baseline', async () => {
      const { float32ToPcm16Base64 } = await import('./audio');

      const testSamples = new Float32Array([-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5]);

      // Baseline reference implementation
      const pcm16 = new Int16Array(testSamples.length);
      for (let i = 0; i < testSamples.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, testSamples[i])) * 32767;
      }
      const buffer = new ArrayBuffer(pcm16.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < pcm16.length; i++) {
        view.setInt16(i * 2, pcm16[i], true);
      }
      const expectedBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer) as unknown as number[]));

      const actualBase64 = float32ToPcm16Base64(testSamples);
      expect(actualBase64).toBe(expectedBase64);
    });

    it('should handle empty Float32Array', async () => {
      const { float32ToPcm16Base64 } = await import('./audio');
      expect(float32ToPcm16Base64(new Float32Array(0))).toBe('');
    });

    it('should handle large audio buffers exceeding chunk size without stack overflow', async () => {
      const { float32ToPcm16Base64 } = await import('./audio');
      // Buffer larger than 32768 samples (65536 bytes)
      const largeSamples = new Float32Array(35000);
      for (let i = 0; i < largeSamples.length; i++) {
        largeSamples[i] = Math.sin(i * 0.01);
      }
      const base64 = float32ToPcm16Base64(largeSamples);
      expect(base64).toBeDefined();
      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
    });
  });
});
