import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('audio utilities', () => {
  describe('playClick', () => {
    let mockAudioContext: any;
    let mockOscillator: any;
    let mockGain: any;
    let mockConsoleWarn: any;

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
        AudioContext: vi.fn(function(this: any) { return mockAudioContext; }),
        webkitAudioContext: vi.fn(function(this: any) { return mockAudioContext; }),
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

  describe('base64ToFloat32', () => {
    it('should correctly convert base64 PCM16 LE audio into Float32Array matching baseline', async () => {
      const { base64ToFloat32 } = await import('./audio');

      // Create test PCM16 values covering positive, negative, zero, and boundary limits
      const testPcm16 = new Int16Array([-32768, -32767, -16384, -1, 0, 1, 16384, 32767]);
      const bytes = new Uint8Array(testPcm16.buffer);
      const base64Audio = btoa(String.fromCharCode.apply(null, bytes as unknown as number[]));

      // Baseline reference implementation
      const binaryString = atob(base64Audio);
      const baselineBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        baselineBytes[i] = binaryString.charCodeAt(i);
      }
      const pcm16 = new Int16Array(baselineBytes.buffer);
      const expectedFloat32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        expectedFloat32[i] = pcm16[i] / 32768;
      }

      const actualFloat32 = base64ToFloat32(base64Audio);
      expect(actualFloat32.length).toBe(expectedFloat32.length);
      for (let i = 0; i < expectedFloat32.length; i++) {
        expect(actualFloat32[i]).toBe(expectedFloat32[i]);
      }
    });

    it('should correctly handle empty base64 string', async () => {
      const { base64ToFloat32 } = await import('./audio');
      const actual = base64ToFloat32('');
      expect(actual).toBeInstanceOf(Float32Array);
      expect(actual.length).toBe(0);
    });

    it('should correctly handle large base64 audio chunks', async () => {
      const { base64ToFloat32 } = await import('./audio');
      const samples = 4800; // 9600 bytes
      const pcm16 = new Int16Array(samples);
      for (let i = 0; i < samples; i++) {
        pcm16[i] = Math.round(Math.sin(i * 0.1) * 32000);
      }
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000) as unknown as number[]);
      }
      const base64Audio = btoa(binary);

      const float32 = base64ToFloat32(base64Audio);
      expect(float32.length).toBe(samples);
      for (let i = 0; i < samples; i++) {
        expect(float32[i]).toBe(pcm16[i] / 32768);
      }
    });

    it('should accurately roundtrip with float32ToPcm16Base64', async () => {
      const { float32ToPcm16Base64, base64ToFloat32 } = await import('./audio');
      const input = new Float32Array([-1.0, -0.5, 0.0, 0.5, 1.0]);
      const base64 = float32ToPcm16Base64(input);
      const decoded = base64ToFloat32(base64);

      expect(decoded.length).toBe(input.length);
      for (let i = 0; i < input.length; i++) {
        expect(decoded[i]).toBeCloseTo(input[i], 3);
      }
    });
  });
});
