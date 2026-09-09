import { renderHook, act } from '@testing-library/react';
import { useExercises } from './useExercises';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { EXERCISES } from '../data';

// Mock the audio utils to avoid issues in test environment
vi.mock('../utils/audio', () => ({
  playReward: vi.fn(),
  playClick: vi.fn(),
}));

// Mock the storage utils
vi.mock('../utils/storage', () => ({
  safeGetFeedbackLogs: vi.fn(() => []),
}));

describe('useExercises - unscramble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('verifyUnscrambleAnswer verifies correct answer', () => {
    const { result } = renderHook(() => useExercises());

    // Switch to unscramble mode
    act(() => {
      result.current.setExerciseStyle('unscramble');
    });

    // We know the current exercise from EXERCISES[0]
    const currentExercise = result.current.currentExercise;
    const correctWord = currentExercise.options[currentExercise.answer];
    const fullSentence = currentExercise.question.replace(/_____+|____|___/g, correctWord);
    const correctWords = fullSentence.split(/\s+/).filter(Boolean);

    // Set the selected words to be the correct answer
    act(() => {
      result.current.setUnscrambleSelected(correctWords);
    });

    // Call verify
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    expect(result.current.selectedAnswer).toBe(currentExercise.answer);
    expect(result.current.exercisesCompleted).toBe(1);
    expect(result.current.exerciseStreak).toBe(1);
  });

  test('verifyUnscrambleAnswer handles incorrect answer', () => {
    const { result } = renderHook(() => useExercises());

    // Switch to unscramble mode
    act(() => {
      result.current.setExerciseStyle('unscramble');
    });

    const currentExercise = result.current.currentExercise;
    const correctWord = currentExercise.options[currentExercise.answer];
    const fullSentence = currentExercise.question.replace(/_____+|____|___/g, correctWord);
    const correctWords = fullSentence.split(/\s+/).filter(Boolean);

    // Swap the first two words to make it incorrect
    const incorrectWords = [...correctWords];
    if (incorrectWords.length > 1) {
      const temp = incorrectWords[0];
      incorrectWords[0] = incorrectWords[1];
      incorrectWords[1] = temp;
    } else {
      // Fallback if there's only 1 word, just add a wrong word
      incorrectWords.push("wrong");
    }

    act(() => {
      result.current.setUnscrambleSelected(incorrectWords);
    });

    // Call verify
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    expect(result.current.selectedAnswer).toBe(null);
    expect(result.current.spellError).toBe(true);
    expect(result.current.exerciseStreak).toBe(0);
  });

  test('verifyUnscrambleAnswer edge case: punctuation and extra spaces', () => {
    const { result } = renderHook(() => useExercises());

    // Switch to unscramble mode
    act(() => {
      result.current.setExerciseStyle('unscramble');
    });

    const currentExercise = result.current.currentExercise;
    const correctWord = currentExercise.options[currentExercise.answer];
    const fullSentence = currentExercise.question.replace(/_____+|____|___/g, correctWord);
    const correctWords = fullSentence.split(/\s+/).filter(Boolean);

    // Add punctuation and strange spacing to the correct words
    const messyWords = correctWords.map(word => `  ${word},.?!  `);

    act(() => {
      result.current.setUnscrambleSelected(messyWords);
    });

    // Call verify
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    // Should still be correct because of normalization
    expect(result.current.selectedAnswer).toBe(currentExercise.answer);
    expect(result.current.exercisesCompleted).toBe(1);
  });

  test('verifyUnscrambleAnswer edge case: missing words', () => {
    const { result } = renderHook(() => useExercises());

    // Switch to unscramble mode
    act(() => {
      result.current.setExerciseStyle('unscramble');
    });

    const currentExercise = result.current.currentExercise;
    const correctWord = currentExercise.options[currentExercise.answer];
    const fullSentence = currentExercise.question.replace(/_____+|____|___/g, correctWord);
    const correctWords = fullSentence.split(/\s+/).filter(Boolean);

    // Remove the last word to make it incomplete
    const missingWords = correctWords.slice(0, -1);

    act(() => {
      result.current.setUnscrambleSelected(missingWords);
    });

    // Call verify
    act(() => {
      result.current.verifyUnscrambleAnswer();
    });

    // Should be incorrect
    expect(result.current.selectedAnswer).toBe(null);
    expect(result.current.spellError).toBe(true);
  });
});
