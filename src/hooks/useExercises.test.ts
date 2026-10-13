import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useExercises } from './useExercises';
import { EXERCISES } from '../data';
import { playReward, playClick } from '../utils/audio';

vi.mock('../utils/audio', () => ({
  playReward: vi.fn(),
  playClick: vi.fn(),
}));

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe('useExercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useExercises());

    expect(result.current.currentExerciseIndex).toBe(0);
    expect(result.current.currentExercise).toEqual(EXERCISES[0]);
    expect(result.current.isGeneratingExercise).toBe(false);
    expect(result.current.selectedAnswer).toBeNull();
    expect(result.current.exercisesCompleted).toBe(0);
    expect(result.current.exerciseStyle).toBe('choice');
    expect(result.current.spellInput).toBe('');
    expect(result.current.spellHintTriggered).toBe(false);
    expect(result.current.unscrambleOptions).toEqual([]);
    expect(result.current.unscrambleSelected).toEqual([]);
    expect(result.current.exerciseStreak).toBe(0);
    expect(result.current.incorrectAttempts).toEqual({});
    expect(result.current.spellError).toBe(false);
  });

  it('should update state via direct state setters', () => {
    const { result } = renderHook(() => useExercises());

    act(() => {
      result.current.setCurrentExerciseIndex(2);
      result.current.setSpellInput('test input');
      result.current.setSpellHintTriggered(true);
      result.current.setExerciseStreak(5);
    });

    expect(result.current.currentExerciseIndex).toBe(2);
    expect(result.current.spellInput).toBe('test input');
    expect(result.current.spellHintTriggered).toBe(true);
    expect(result.current.exerciseStreak).toBe(5);
  });

  describe('unscramble effect', () => {
    it('should set unscramble options when style is unscramble', () => {
      const { result } = renderHook(() => useExercises());

      act(() => {
        result.current.setExerciseStyle('unscramble');
      });

      expect(result.current.unscrambleOptions.length).toBeGreaterThan(0);
      expect(result.current.unscrambleSelected).toEqual([]);
    });

    it('should reset unscramble options when style is not unscramble', () => {
      const { result } = renderHook(() => useExercises());

      act(() => {
        result.current.setExerciseStyle('unscramble');
      });
      expect(result.current.unscrambleOptions.length).toBeGreaterThan(0);

      act(() => {
        result.current.setExerciseStyle('choice');
      });
      expect(result.current.unscrambleOptions).toEqual([]);
      expect(result.current.unscrambleSelected).toEqual([]);
    });
  });

  describe('generateNewExercise', () => {
    it('should generate a new exercise using GoogleGenAI on success', async () => {
      const generatedExercise = {
        topic: 'Present Simple',
        question: 'She _____ to school every day.',
        options: ['go', 'goes', 'went'],
        answer: 1,
        explanation: 'Third-person singular takes "goes".',
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: `\`\`\`json\n${JSON.stringify(generatedExercise)}\n\`\`\``,
      });

      const { result } = renderHook(() => useExercises());

      let genPromise: Promise<void>;
      act(() => {
        genPromise = result.current.generateNewExercise();
      });

      await act(async () => {
        await genPromise;
      });

      expect(result.current.currentExercise).toEqual(generatedExercise);
      expect(result.current.isGeneratingExercise).toBe(false);
      expect(result.current.selectedAnswer).toBeNull();
      expect(result.current.spellInput).toBe('');
      expect(result.current.spellHintTriggered).toBe(false);
      expect(result.current.incorrectAttempts).toEqual({});
    });

    it('should fallback to preloaded exercise if GoogleGenAI fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGenerateContent.mockRejectedValueOnce(new Error('AI generation failed'));

      const { result } = renderHook(() => useExercises());

      let genPromise: Promise<void>;
      act(() => {
        genPromise = result.current.generateNewExercise();
      });

      await act(async () => {
        await genPromise;
      });

      expect(EXERCISES).toContainEqual(result.current.currentExercise);
      expect(result.current.isGeneratingExercise).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('handleChoiceSelect', () => {
    it('should handle correct choice selection', () => {
      const { result } = renderHook(() => useExercises());
      const correctIndex = result.current.currentExercise.answer;

      act(() => {
        result.current.handleChoiceSelect(correctIndex);
      });

      expect(result.current.selectedAnswer).toBe(correctIndex);
      expect(result.current.exercisesCompleted).toBe(1);
      expect(result.current.exerciseStreak).toBe(1);
      expect(playReward).toHaveBeenCalledTimes(1);

      const logs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
      expect(logs.length).toBe(1);
      expect(logs[0].role).toBe('Gothic Exercise Tutor');
      expect(logs[0].ratingAI).toBe(5);
    });

    it('should handle incorrect choice selection', () => {
      const { result } = renderHook(() => useExercises());
      const wrongIndex = (result.current.currentExercise.answer + 1) % result.current.currentExercise.options.length;

      act(() => {
        result.current.setExerciseStreak(3);
      });

      act(() => {
        result.current.handleChoiceSelect(wrongIndex);
      });

      expect(result.current.selectedAnswer).toBeNull();
      expect(result.current.exerciseStreak).toBe(0);
      expect(result.current.incorrectAttempts[wrongIndex]).toBe(true);
      expect(playClick).toHaveBeenCalledTimes(1);
    });

    it('should ignore choice selection if answer is already selected', () => {
      const { result } = renderHook(() => useExercises());
      const correctIndex = result.current.currentExercise.answer;

      act(() => {
        result.current.handleChoiceSelect(correctIndex);
      });

      expect(result.current.exercisesCompleted).toBe(1);

      act(() => {
        result.current.handleChoiceSelect(correctIndex);
      });

      expect(result.current.exercisesCompleted).toBe(1);
    });

    it('should handle localStorage error gracefully on correct choice', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useExercises());
      const correctIndex = result.current.currentExercise.answer;

      act(() => {
        result.current.handleChoiceSelect(correctIndex);
      });

      expect(result.current.selectedAnswer).toBe(correctIndex);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('verifyScribeAnswer', () => {
    it('should handle correct scribe answer (case-insensitive and trimmed)', () => {
      const { result } = renderHook(() => useExercises());
      const correctAnswer = result.current.currentExercise.options[result.current.currentExercise.answer];

      act(() => {
        result.current.setSpellInput(`  ${correctAnswer.toUpperCase()}!  `);
      });

      act(() => {
        result.current.verifyScribeAnswer();
      });

      expect(result.current.selectedAnswer).toBe(result.current.currentExercise.answer);
      expect(result.current.exercisesCompleted).toBe(1);
      expect(result.current.exerciseStreak).toBe(1);
      expect(playReward).toHaveBeenCalledTimes(1);

      const logs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
      expect(logs.length).toBe(1);
      expect(logs[0].comments).toContain('Scribe Ritual');
    });

    it('should handle incorrect scribe answer and clear spellError after timeout', () => {
      const { result } = renderHook(() => useExercises());

      act(() => {
        result.current.setExerciseStreak(2);
        result.current.setSpellInput('definitely wrong answer');
      });

      act(() => {
        result.current.verifyScribeAnswer();
      });

      expect(result.current.spellError).toBe(true);
      expect(result.current.exerciseStreak).toBe(0);
      expect(playClick).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(850);
      });

      expect(result.current.spellError).toBe(false);
    });

    it('should ignore verifyScribeAnswer if selectedAnswer is already set', () => {
      const { result } = renderHook(() => useExercises());

      act(() => {
        result.current.setSelectedAnswer(0);
        result.current.setSpellInput('wrong');
      });

      act(() => {
        result.current.verifyScribeAnswer();
      });

      expect(playClick).not.toHaveBeenCalled();
      expect(result.current.spellError).toBe(false);
    });

    it('should handle localStorage error gracefully on correct scribe answer', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useExercises());
      const correctAnswer = result.current.currentExercise.options[result.current.currentExercise.answer];

      act(() => {
        result.current.setSpellInput(correctAnswer);
      });

      act(() => {
        result.current.verifyScribeAnswer();
      });

      expect(result.current.selectedAnswer).toBe(result.current.currentExercise.answer);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('verifyUnscrambleAnswer', () => {
    it('should handle correct unscramble answer', () => {
      const { result } = renderHook(() => useExercises());

      act(() => {
        result.current.setExerciseStyle('unscramble');
      });

      const correctWord = result.current.currentExercise.options[result.current.currentExercise.answer];
      const fullSentence = result.current.currentExercise.question.replace(/_____+|____|___/g, correctWord);
      const correctWords = fullSentence.split(/\s+/).filter(Boolean);

      act(() => {
        result.current.setUnscrambleSelected(correctWords);
      });

      act(() => {
        result.current.verifyUnscrambleAnswer();
      });

      expect(result.current.selectedAnswer).toBe(result.current.currentExercise.answer);
      expect(result.current.exercisesCompleted).toBe(1);
      expect(result.current.exerciseStreak).toBe(1);
      expect(playReward).toHaveBeenCalledTimes(1);

      const logs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
      expect(logs.length).toBe(1);
      expect(logs[0].comments).toContain('Successfully ordered sentence');
    });

    it('should handle incorrect unscramble answer and reset selections after timeout', () => {
      const { result } = renderHook(() => useExercises());

      act(() => {
        result.current.setExerciseStyle('unscramble');
      });

      act(() => {
        result.current.setExerciseStreak(4);
        result.current.setUnscrambleSelected(['wrong', 'order']);
      });

      act(() => {
        result.current.verifyUnscrambleAnswer();
      });

      expect(result.current.spellError).toBe(true);
      expect(result.current.exerciseStreak).toBe(0);
      expect(playClick).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(850);
      });

      expect(result.current.spellError).toBe(false);
      expect(result.current.unscrambleSelected).toEqual([]);
      expect(result.current.unscrambleOptions).toContain('wrong');
      expect(result.current.unscrambleOptions).toContain('order');
    });

    it('should ignore verifyUnscrambleAnswer if selectedAnswer is already set', () => {
      const { result } = renderHook(() => useExercises());

      act(() => {
        result.current.setSelectedAnswer(1);
        result.current.setUnscrambleSelected(['some', 'words']);
      });

      act(() => {
        result.current.verifyUnscrambleAnswer();
      });

      expect(playClick).not.toHaveBeenCalled();
      expect(result.current.spellError).toBe(false);
    });

    it('should handle localStorage error gracefully on correct unscramble answer', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useExercises());

      act(() => {
        result.current.setExerciseStyle('unscramble');
      });

      const correctWord = result.current.currentExercise.options[result.current.currentExercise.answer];
      const fullSentence = result.current.currentExercise.question.replace(/_____+|____|___/g, correctWord);
      const correctWords = fullSentence.split(/\s+/).filter(Boolean);

      act(() => {
        result.current.setUnscrambleSelected(correctWords);
      });

      act(() => {
        result.current.verifyUnscrambleAnswer();
      });

      expect(result.current.selectedAnswer).toBe(result.current.currentExercise.answer);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
