import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useExercises } from './useExercises';

vi.mock('../data', () => ({
  EXERCISES: [
    {
      id: 1,
      topic: 'Test grammar',
      question: '_____ quickly, please!',
      options: ['Walk', 'Walked', 'Walking', 'Walks'],
      answer: 0,
    },
  ],
  GRAMMAR_TOPICS: [],
}));

vi.mock('../utils/audio', () => ({
  playClick: vi.fn(),
  playReward: vi.fn(),
}));

vi.mock('../utils/storage', () => ({
  safeGetFeedbackLogs: vi.fn(() => []),
}));

describe('useExercises unscramble answer verification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const renderUnscrambleExercise = () => {
    const hook = renderHook(() => useExercises());

    act(() => {
      hook.result.current.setExerciseStyle('unscramble');
    });

    return hook;
  };

  it('accepts answers with different casing and punctuation', () => {
    const { result } = renderUnscrambleExercise();

    act(() => {
      result.current.setUnscrambleSelected(['walk', 'quickly,', 'please!']);
    });
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    expect(result.current.selectedAnswer).toBe(0);
    expect(result.current.exercisesCompleted).toBe(1);
    expect(result.current.exerciseStreak).toBe(1);
  });

  it('rejects an incomplete sentence and restores selected words to the options', () => {
    const { result } = renderUnscrambleExercise();

    act(() => {
      result.current.setUnscrambleSelected(['Walk']);
    });
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    expect(result.current.selectedAnswer).toBeNull();
    expect(result.current.exercisesCompleted).toBe(0);
    expect(result.current.exerciseStreak).toBe(0);
    expect(result.current.spellError).toBe(true);

    act(() => {
      vi.advanceTimersByTime(850);
    });

    expect(result.current.spellError).toBe(false);
    expect(result.current.unscrambleSelected).toEqual([]);
    expect(result.current.unscrambleOptions).toContain('Walk');
  });

  it('rejects the right words in the wrong order', () => {
    const { result } = renderUnscrambleExercise();

    act(() => {
      result.current.setUnscrambleSelected(['please!', 'quickly,', 'Walk']);
    });
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    expect(result.current.selectedAnswer).toBeNull();
    expect(result.current.exerciseStreak).toBe(0);
    expect(result.current.spellError).toBe(true);
  });

  it('does not verify an answer after the exercise is already completed', () => {
    const { result } = renderUnscrambleExercise();

    act(() => {
      result.current.setUnscrambleSelected(['Walk', 'quickly,', 'please!']);
    });
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    const completedCount = result.current.exercisesCompleted;

    act(() => {
      result.current.setUnscrambleSelected(['please!', 'quickly,', 'Walk']);
    });
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    expect(result.current.selectedAnswer).toBe(0);
    expect(result.current.exercisesCompleted).toBe(completedCount);
    expect(result.current.exerciseStreak).toBe(1);
  });
});
