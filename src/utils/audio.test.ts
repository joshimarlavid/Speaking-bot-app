import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGain = {
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
};

const mockGainNode = {
  gain: mockGain,
  connect: vi.fn(),
};

const mockOscillatorFrequency = {
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
};

const mockOscillator = {
  type: '',
  frequency: mockOscillatorFrequency,
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

const mockFilterFrequency = {
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
};

const mockFilter = {
  type: '',
  frequency: mockFilterFrequency,
  connect: vi.fn(),
};

const mockAudioContextInstance = {
  currentTime: 100,
  state: 'running',
  resume: vi.fn(),
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGainNode),
  createBiquadFilter: vi.fn(() => mockFilter),
  destination: {},
};

// Instead of vi.fn(() => ...), we need a class mock for new AudioContext()
const MockAudioContext = vi.fn().mockImplementation(function(this: any) {
  return mockAudioContextInstance;
});

describe('audio utilities - playClick', () => {
  let playClick: any;
  let mockConsoleWarn: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // We stub window because the implementation looks at window.AudioContext
    vi.stubGlobal('window', { AudioContext: MockAudioContext, webkitAudioContext: MockAudioContext });

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

    expect(MockAudioContext).toHaveBeenCalled();
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled();
    expect(mockAudioContextInstance.createGain).toHaveBeenCalled();

    // Verify oscillator
    expect(mockOscillator.type).toBe('triangle');
    expect(mockOscillatorFrequency.setValueAtTime).toHaveBeenCalledWith(180, 100);
    expect(mockOscillatorFrequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(45, 100 + 0.08);

    // Verify gain
    expect(mockGain.setValueAtTime).toHaveBeenCalledWith(0.3, 100);
    expect(mockGain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 100 + 0.08);

    // Verify connections
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContextInstance.destination);

    // Verify start/stop
    expect(mockOscillator.start).toHaveBeenCalledWith(100);
    expect(mockOscillator.stop).toHaveBeenCalledWith(100 + 0.1);
  });

  it('should resume audio context if it is suspended', async () => {
    mockAudioContextInstance.state = 'suspended';

    playClick();

    expect(mockAudioContextInstance.resume).toHaveBeenCalled();

    // reset state
    mockAudioContextInstance.state = 'running';
  });

  it('should catch and log errors if audio playback fails', () => {
    // If window.AudioContext is undefined, `new (window.AudioContext)()` will throw
    vi.stubGlobal('window', { AudioContext: undefined, webkitAudioContext: undefined });

    playClick();

    expect(mockConsoleWarn).toHaveBeenCalledWith('Audio click failed to play:', expect.any(TypeError));
  });
});
