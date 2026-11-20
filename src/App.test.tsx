import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { EXERCISES, ROLES, TOPICS } from './data';

const live = vi.hoisted(() => ({
  connect: vi.fn(), disconnect: vi.fn(),
  transcript: [{ role: 'user', text: 'I went yesterday.' }, { role: 'model', text: 'Good!' }],
}));
vi.mock('./useLiveAPI', () => ({
  useLiveAPI: () => {
    const [connected, setConnected] = useState(false);
    return {
      isConnected: connected, isConnecting: false, error: null, hasMicrophone: false,
      connect: (...args: unknown[]) => { live.connect(...args); setConnected(true); },
      disconnect: () => { live.disconnect(); setConnected(false); },
      getTranscript: () => live.transcript, userTranscript: '', aiTranscript: '', sendTextMessage: vi.fn(),
    };
  },
}));
vi.mock('./useGeneratedBackground', () => ({ useGeneratedBackground: () => ({ bgUrl: null, isGenerating: false }) }));
vi.mock('./utils/audio', () => ({ playClick: vi.fn(), playStart: vi.fn(), playReward: vi.fn() }));
vi.mock('./components/InteractiveFlashcards', () => ({ InteractiveFlashcards: () => null }));

describe('active App flows', () => {
  const speak = vi.fn();
  const cancel = vi.fn();
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, String(value)),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    vi.clearAllMocks();
    vi.stubGlobal('speechSynthesis', { speak, cancel });
    vi.stubGlobal('SpeechSynthesisUtterance', class { lang = ''; onstart = null; onerror = null; constructor(public text: string) {} });
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('sends the ordered live transcript on End and plays, replays and stops feedback', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ feedback: 'Try the past tense.' }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Conversation' }));
    fireEvent.click(screen.getByRole('button', { name: 'End' }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages).toEqual(live.transcript);
    expect(await screen.findByText('Try the past tense.')).toBeTruthy();
    expect(speak).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Replay feedback' }));
    expect(speak).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Stop audio' }));
    expect(cancel).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(localStorage.getItem('linguaRole_feedback')).toBeNull();
  });

  it('ignores late feedback after closing it and starting a new session', async () => {
    let resolveFeedback!: (value: unknown) => void;
    const fetchMock = vi.fn().mockImplementation(() => new Promise(resolve => { resolveFeedback = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Conversation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Get Feedback' }));
    const signal: AbortSignal = fetchMock.mock.calls[0][1].signal;
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(signal.aborted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Start Conversation' }));
    await act(async () => { resolveFeedback({ ok: true, json: async () => ({ feedback: 'Old feedback.' }) }); });
    expect(screen.queryByText('Old feedback.')).toBeNull();
    expect(speak).not.toHaveBeenCalled();
  });

  it('expires automatically once and requests feedback', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ feedback: 'Review.' }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Conversation' }));
    await act(async () => { vi.advanceTimersByTime(180_000); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Review.')).toBeTruthy();
  });

  it('does not create fictitious ratings on exercise completion and varies fallback cards', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Exercises' }));
    fireEvent.click(screen.getByText(EXERCISES[0].options[EXERCISES[0].answer], { selector: 'button span span' }).closest('button')!);
    expect(localStorage.getItem('linguaRole_feedback')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Generate AI exercise' }));
    await screen.findByText('AI exercise unavailable; showing a preloaded exercise instead.');
    expect(screen.queryByText(EXERCISES[0].question)).toBeNull();
  });

  it('keeps role and topic aligned for selection and session start', () => {
    render(<App />);
    const role = ROLES[1];
    const topic = TOPICS.find(item => item.id === role.topicId)!;
    fireEvent.click(screen.getByText(role.name, { exact: false, selector: 'button div' }).closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: 'Start Conversation' }));
    expect(live.connect.mock.calls[0][1].id).toBe(role.id);
    expect(live.connect.mock.calls[0][2].id).toBe(topic.id);
    expect(localStorage.getItem('linguaRole_topic')).toBe(topic.id);
  });

  it('includes prior ElevenLabs turns and ignores a stale response after restart', async () => {
    let resolveOld!: (value: unknown) => void;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ text: 'Hello there.' }) })
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ text: 'Fresh hello.' }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'ElevenLabs (turn-based)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start Conversation' }));
    await screen.findByText('Hello there.');
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), { target: { value: 'My first answer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).user_input).toContain('Partner: Hello there.');
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await screen.findByText('Fresh hello.');
    await act(async () => { resolveOld({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ text: 'Stale answer.' }) }); });
    await waitFor(() => expect(screen.queryByText('Stale answer.')).toBeNull());
  });
});
