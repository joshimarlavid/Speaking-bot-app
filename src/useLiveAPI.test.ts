import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLiveAPI } from './useLiveAPI';

const topic = { title: 'Coffee', grammar: 'Requests', vocabulary: ['coffee'] };
const role = { name: 'Barista', description: 'Cafe', winCondition: 'Order', loseCondition: 'Leave', voice: 'Puck' };

class MockSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: MockSocket[] = [];
  readyState = MockSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: any[] = [];
  constructor(public url: string) { MockSocket.instances.push(this); }
  send = vi.fn((data: string) => { this.sent.push(JSON.parse(data)); });
  close = vi.fn(() => { this.readyState = 3; });
  open() { this.readyState = MockSocket.OPEN; this.onopen?.(); }
  message(data: object) { this.onmessage?.({ data: JSON.stringify(data) }); }
}

class MockAudioContext {
  static instances: MockAudioContext[] = [];
  sampleRate: number;
  currentTime = 10;
  state = 'running';
  destination = {};
  close = vi.fn().mockResolvedValue(undefined);
  resume = vi.fn().mockResolvedValue(undefined);
  processor = { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null as any };
  input = { connect: vi.fn(), disconnect: vi.fn() };
  gain = { connect: vi.fn(), disconnect: vi.fn(), gain: { value: 1 } };
  sources: any[] = [];
  constructor(options: { sampleRate: number }) {
    this.sampleRate = options.sampleRate === 16000 ? 48000 : options.sampleRate;
    MockAudioContext.instances.push(this);
  }
  createMediaStreamSource() { return this.input; }
  createScriptProcessor() { return this.processor; }
  createGain() { return this.gain; }
  createBuffer(_channels: number, length: number, rate: number) {
    return { duration: length / rate, getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    const source = { buffer: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null };
    this.sources.push(source);
    return source;
  }
}

const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const start = async (result: { current: ReturnType<typeof useLiveAPI> }) => {
  await act(async () => { await result.current.connect('Alice', role, topic); });
  const socket = MockSocket.instances.at(-1)!;
  await act(async () => { socket.open(); socket.message({ type: 'connected' }); await Promise.resolve(); });
  return socket;
};

describe('useLiveAPI WebSocket bridge', () => {
  let stopTrack: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    MockSocket.instances = [];
    MockAudioContext.instances = [];
    stopTrack = vi.fn();
    vi.stubGlobal('WebSocket', MockSocket);
    vi.stubGlobal('AudioContext', MockAudioContext);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) } });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('preserves ordered fresh turns, typed messages and explicit boundaries', async () => {
    const { result } = renderHook(() => useLiveAPI());
    const socket = await start(result);
    expect(socket.sent[0]).toMatchObject({ type: 'setup', voiceName: 'Puck' });
    expect(socket.sent[0].systemInstruction).toContain('Alice');
    act(() => {
      socket.message({ type: 'outputTranscript', text: 'Hello' });
      socket.message({ type: 'output_transcription', text: ' there' });
      socket.message({ type: 'turn_complete' });
      result.current.sendTextMessage('Coffee please');
      socket.message({ type: 'outputTranscript', text: 'Sure.' });
      socket.message({ type: 'turn_complete' });
      socket.message({ type: 'input_transcription', text: 'Thank' });
      socket.message({ type: 'inputTranscript', text: ' you' });
      socket.message({ type: 'turn_complete' });
      socket.message({ type: 'outputTranscript', text: 'Welcome!' });
      expect(result.current.getTranscript()).toEqual([
        { role: 'model', text: 'Hello there' }, { role: 'user', text: 'Coffee please' },
        { role: 'model', text: 'Sure.' }, { role: 'user', text: 'Thank you' },
        { role: 'model', text: 'Welcome!' },
      ]);
    });
    const snapshot = result.current.getTranscript();
    snapshot[0].text = 'changed';
    expect(result.current.getTranscript()[0].text).toBe('Hello there');
    expect(result.current.userTranscript).toBe('Coffee please Thank you');
    act(() => result.current.disconnect());
    expect(result.current.getTranscript()).toHaveLength(5);
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('completes only on a completed model transcript turn and resets on reconnect', async () => {
    const { result } = renderHook(() => useLiveAPI());
    const socket = await start(result);
    expect(socket.sent[0].systemInstruction).toContain('Scenario complete.');
    expect(socket.sent[0].systemInstruction).toContain('Do not declare an outcome or provide final feedback');

    act(() => {
      result.current.sendTextMessage('Scenario complete.');
      socket.message({ type: 'inputTranscript', text: 'Scenario complete.' });
      socket.message({ type: 'turn_complete' });
      socket.message({ type: 'text', text: 'Scenario complete.' });
      socket.message({ type: 'turn_complete' });
    });
    expect(result.current.scenarioComplete).toBe(false);

    act(() => {
      socket.message({ type: 'outputTranscript', text: 'Scenario complete.' });
      socket.message({ type: 'interrupted' });
      socket.message({ type: 'turn_complete' });
    });
    expect(result.current.scenarioComplete).toBe(false);

    act(() => {
      socket.message({ type: 'outputTranscript', text: 'Scenario ' });
      socket.message({ type: 'output_transcription', text: 'complete.' });
    });
    expect(result.current.scenarioComplete).toBe(false);
    act(() => socket.message({ type: 'turn_complete' }));
    expect(result.current.scenarioComplete).toBe(true);

    const next = await start(result);
    expect(result.current.scenarioComplete).toBe(false);
    act(() => next.message({ type: 'turn_complete' }));
    expect(result.current.scenarioComplete).toBe(false);
  });

  it('falls back to text with a visible microphone error', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useLiveAPI());
    const socket = await start(result);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.hasMicrophone).toBe(false);
    expect(result.current.error).toMatch(/microphone.*text/i);
    expect(MockAudioContext.instances[1].close).toHaveBeenCalledOnce();
    act(() => result.current.sendTextMessage('Hello'));
    expect(socket.sent.at(-1)).toEqual({ type: 'text', text: 'Hello' });
    expect(result.current.getTranscript()).toEqual([{ role: 'user', text: 'Hello' }]);
  });

  it('resamples actual 48kHz input to little-endian 16kHz PCM and cleans up', async () => {
    const { result, unmount } = renderHook(() => useLiveAPI());
    const socket = await start(result);
    const ctx = MockAudioContext.instances[1];
    act(() => ctx.processor.onaudioprocess({ inputBuffer: { getChannelData: () => new Float32Array([1, 0, 0, -1, 0, 0, 0.5]) } }));
    const audio = socket.sent.at(-1);
    expect(audio.type).toBe('audio');
    const bytes = Uint8Array.from(atob(audio.data), c => c.charCodeAt(0));
    expect([...bytes]).toEqual([255, 127, 0, 128]);
    unmount();
    expect(ctx.processor.disconnect).toHaveBeenCalledOnce();
    expect(ctx.input.disconnect).toHaveBeenCalledOnce();
    expect(ctx.gain.disconnect).toHaveBeenCalledOnce();
    expect(ctx.close).toHaveBeenCalledOnce();
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('stops scheduled audio on interruption and disconnect', async () => {
    const { result } = renderHook(() => useLiveAPI());
    const socket = await start(result);
    const ctx = MockAudioContext.instances[0];
    act(() => { socket.message({ type: 'audio', data: btoa('\u0000\u0000') }); socket.message({ type: 'audio', data: btoa('\u0000\u0000') }); });
    expect(ctx.sources).toHaveLength(2);
    act(() => socket.message({ type: 'interrupted' }));
    expect(ctx.sources[0].stop).toHaveBeenCalledOnce();
    expect(ctx.sources[1].stop).toHaveBeenCalledOnce();
    act(() => socket.message({ type: 'audio', data: btoa('\u0000\u0000') }));
    expect(ctx.sources[2].start).toHaveBeenCalledWith(10);
    act(() => result.current.disconnect());
    expect(ctx.sources[2].stop).toHaveBeenCalledOnce();
    expect(ctx.close).toHaveBeenCalledOnce();
  });

  it('does not play a chunk whose resume resolves after interruption', async () => {
    const { result } = renderHook(() => useLiveAPI());
    const socket = await start(result);
    const ctx = MockAudioContext.instances[0];
    let resume!: () => void;
    ctx.state = 'suspended';
    ctx.resume.mockReturnValueOnce(new Promise<void>(resolve => { resume = resolve; }));
    act(() => {
      socket.message({ type: 'audio', data: btoa('\u0000\u0000') });
      socket.message({ type: 'interrupted' });
      resume();
    });
    await flush();
    expect(ctx.sources).toHaveLength(0);
  });

  it('ignores stale microphone resolution and socket events after restart', async () => {
    let resolveStream!: (value: any) => void;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValueOnce(new Promise(resolve => { resolveStream = resolve; }));
    const { result } = renderHook(() => useLiveAPI());
    const first = await start(result);
    const staleMessage = first.onmessage!;
    const second = await start(result);
    act(() => {
      staleMessage({ data: JSON.stringify({ type: 'error', message: 'old' }) });
      resolveStream({ getTracks: () => [{ stop: stopTrack }] });
    });
    await flush();
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
    expect(second.readyState).toBe(MockSocket.OPEN);
  });

  it('reports connection and playback failures and does not inject timed feedback', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useLiveAPI());
      const socket = await start(result);
      act(() => vi.advanceTimersByTime(180000));
      expect(socket.sent.filter(message => message.type === 'text')).toHaveLength(1);
      act(() => socket.message({ type: 'audio', data: btoa('x') }));
      expect(result.current.error).toMatch(/playback/i);
      act(() => socket.message({ type: 'error', message: 'No key' }));
      expect(result.current.error).toBe('No key');
      expect(result.current.isConnected).toBe(false);
    } finally { vi.useRealTimers(); }
  });
});
