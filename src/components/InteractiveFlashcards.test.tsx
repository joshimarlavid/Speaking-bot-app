import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InteractiveFlashcards } from './InteractiveFlashcards';
import type { AppTheme } from '../App';

vi.mock('../data', () => ({
  TOPICS: [
    { id: 'one', title: 'First', vocabulary: ['(to give) feedback', 'shared'] },
    { id: 'two', title: 'Second', vocabulary: ['shared', 'other'] },
    { id: 'single', title: 'Single', vocabulary: ['alone'] },
  ],
  GRAMMAR_TOPICS: [],
}));

const storageKey = 'linguaRole_mastered_words';
const playClick = vi.fn();
const playReward = vi.fn();
const renderCards = () => render(<InteractiveFlashcards theme={{} as AppTheme} playClick={playClick} playReward={playReward} />);
const selectDeck = (value: string) => fireEvent.change(screen.getByRole('combobox'), { target: { value } });
const enterQuiz = () => fireEvent.click(screen.getByRole('button', { name: /memory quiz/i }));
const answer = (value: string) => {
  fireEvent.change(screen.getByPlaceholderText('Type the English term...'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Test' }));
};

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
  });
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ definitionEn: 'A clue', definitionEs: 'Una pista', syllables: 'clue' }),
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('InteractiveFlashcards', () => {
  it('grades parentheses symmetrically, awards once and persists mastery', async () => {
    renderCards();
    await screen.findByRole('heading', { name: '(to give) feedback' });
    enterQuiz();
    answer('  (TO GIVE)   feedback  ');
    expect(screen.getByText('Perfect Recalled!')).toBeDefined();
    expect(playReward).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({ one: { '(to give) feedback': true } });
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    answer('to give feedback');
    expect(playReward).toHaveBeenCalledTimes(1);
  });

  it('does not grant mastery for a revealed answer or an incorrect answer', async () => {
    renderCards();
    enterQuiz();
    answer('wrong');
    expect(screen.getByText('Spectral Fracture')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    fireEvent.click(screen.getByRole('button', { name: /help \/ reveal/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByText('Perfect Recalled!')).toBeDefined();
    expect(playReward).not.toHaveBeenCalled();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('keeps deck progress independent, including reset and reload', async () => {
    localStorage.setItem(storageKey, JSON.stringify({ shared: true }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const view = renderCards();
    selectDeck('two');
    expect(screen.getByText('50%')).toBeDefined();
    fireEvent.click(screen.getByTitle('Revive Mastery Progress'));
    expect(screen.getByText('0%')).toBeDefined();
    selectDeck('one');
    expect(screen.getByText('50%')).toBeDefined();
    view.unmount();
    renderCards();
    expect(screen.getByText('50%')).toBeDefined();
    selectDeck('two');
    expect(screen.getByText('0%')).toBeDefined();
    vi.restoreAllMocks();
  });

  it('does not reset an answer when enrichment arrives, or show stale deck details', async () => {
    const responses: Array<(value: unknown) => void> = [];
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => responses.push(resolve))));
    renderCards();
    enterQuiz();
    fireEvent.change(screen.getByPlaceholderText('Type the English term...'), { target: { value: 'to give feedback' } });
    responses[0]({ ok: true, json: async () => ({ definitionEn: 'First clue' }) });
    await screen.findAllByText(/First clue/);
    expect((screen.getByPlaceholderText('Type the English term...') as HTMLInputElement).value).toBe('to give feedback');
    selectDeck('two');
    selectDeck('one');
    expect(screen.getByRole('heading', { name: '(to give) feedback' })).toBeDefined();
    await act(async () => { responses[1]({ ok: true, json: async () => ({ definitionEn: 'Stale clue' }) }); });
    expect(screen.queryByText('Stale clue')).toBeNull();
  });

  it('resets quiz state when navigating a one-card deck', async () => {
    renderCards();
    selectDeck('single');
    enterQuiz();
    answer('alone');
    fireEvent.click(screen.getByRole('button', { name: /next card/i }));
    expect(screen.getByPlaceholderText('Type the English term...')).toBeDefined();
  });
});
