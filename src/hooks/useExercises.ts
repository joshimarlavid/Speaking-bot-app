import { useState, useCallback, useEffect } from 'react';
import { EXERCISES, GRAMMAR_TOPICS } from '../data';
import { playReward, playClick } from '../utils/audio';

export const useExercises = () => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(EXERCISES[0]);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [exerciseStyle, setExerciseStyle] = useState<'choice' | 'spell' | 'unscramble'>('choice');
  const [spellInput, setSpellInput] = useState('');
  const [spellHintTriggered, setSpellHintTriggered] = useState(false);
  const [unscrambleOptions, setUnscrambleOptions] = useState<string[]>([]);
  const [unscrambleSelected, setUnscrambleSelected] = useState<string[]>([]);
  const [exerciseStreak, setExerciseStreak] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<Record<number, boolean>>({});
  const [spellError, setSpellError] = useState(false);

  useEffect(() => {
    if (exerciseStyle === 'unscramble') {
      const correctWord = currentExercise.options[currentExercise.answer];
      const fullSentence = currentExercise.question.replace(/_____+|____|___/g, correctWord);
      const words = fullSentence.split(/\s+/).filter(Boolean);
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setUnscrambleOptions(shuffled);
      setUnscrambleSelected([]);
    } else {
      setUnscrambleOptions([]);
      setUnscrambleSelected([]);
    }
  }, [currentExercise, exerciseStyle]);

  const generateNewExercise = useCallback(async () => {
    setIsGeneratingExercise(true);
    try {
      const randomTopic = GRAMMAR_TOPICS[Math.floor(Math.random() * GRAMMAR_TOPICS.length)];

      const response = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ randomTopic })
      });

      if (!response.ok) {
        throw new Error("Failed to generate exercise");
      }

      const exercise = await response.json();
      setCurrentExercise({ ...exercise, topic: randomTopic.title });
    } catch (e) {
      console.error("Failed to generate exercise:", e);
      const randomPreloaded = EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
      setCurrentExercise(randomPreloaded);
    } finally {
      setIsGeneratingExercise(false);
      setSelectedAnswer(null);
      setSpellInput('');
      setSpellHintTriggered(false);
      setIncorrectAttempts({});
    }
  }, []);

  const handleChoiceSelect = useCallback((idx: number) => {
    if (selectedAnswer !== null) return;

    if (idx === currentExercise.answer) {
      setSelectedAnswer(idx);
      setExercisesCompleted(prev => prev + 1);
      setExerciseStreak(prev => prev + 1);
      playReward();

      try {
        const feedbackLogs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
        feedbackLogs.push({
          role: "Gothic Exercise Tutor",
          date: new Date().toISOString(),
          topic: currentExercise.topic,
          comments: `Successfully mastered: "${currentExercise.question}" with answer "${currentExercise.options[idx]}".`,
          ratingAI: 5,
          ratingTopic: 5
        });
        localStorage.setItem('linguaRole_feedback', JSON.stringify(feedbackLogs));
      } catch (e) {
        console.error(e);
      }
    } else {
      playClick();
      setIncorrectAttempts(prev => ({ ...prev, [idx]: true }));
      setExerciseStreak(0);
    }
  }, [currentExercise, selectedAnswer]);

  const verifyScribeAnswer = useCallback(() => {
    if (!currentExercise || selectedAnswer !== null) return;
    const norm = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    const correct = currentExercise.options[currentExercise.answer];

    if (norm(spellInput) === norm(correct)) {
      setSelectedAnswer(currentExercise.answer);
      setExercisesCompleted(prev => prev + 1);
      setExerciseStreak(prev => prev + 1);
      playReward();

      try {
        const feedbackLogs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
        feedbackLogs.push({
          role: "Gothic Exercise Tutor",
          date: new Date().toISOString(),
          topic: currentExercise.topic,
          comments: `Successfully mastered Scribe Ritual for: "${currentExercise.question}" with correct spelling "${correct}".`,
          ratingAI: 5,
          ratingTopic: 5
        });
        localStorage.setItem('linguaRole_feedback', JSON.stringify(feedbackLogs));
      } catch (e) {
        console.error(e);
      }
    } else {
      setSpellError(true);
      setExerciseStreak(0);
      playClick();
      setTimeout(() => {
        setSpellError(false);
      }, 850);
    }
  }, [currentExercise, spellInput, selectedAnswer]);

  const verifyUnscrambleAnswer = useCallback(() => {
    if (!currentExercise || selectedAnswer !== null) return;
    const norm = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

    const correctWord = currentExercise.options[currentExercise.answer];
    const fullSentence = currentExercise.question.replace(/_____+|____|___/g, correctWord);
    const correctWords = fullSentence.split(/\s+/).filter(Boolean);

    const isCorrect = unscrambleSelected.map(norm).join(' ') === correctWords.map(norm).join(' ');

    if (isCorrect) {
      setSelectedAnswer(currentExercise.answer);
      setExercisesCompleted(prev => prev + 1);
      setExerciseStreak(prev => prev + 1);
      playReward();

      try {
        const feedbackLogs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
        feedbackLogs.push({
          role: "Gothic Exercise Tutor",
          date: new Date().toISOString(),
          topic: currentExercise.topic,
          comments: `Successfully ordered sentence: "${fullSentence}".`,
          ratingAI: 5,
          ratingTopic: 5
        });
        localStorage.setItem('linguaRole_feedback', JSON.stringify(feedbackLogs));
      } catch (e) {
        console.error(e);
      }
    } else {
      setSpellError(true);
      setExerciseStreak(0);
      playClick();
      setTimeout(() => {
        setSpellError(false);
        setUnscrambleOptions(prev => [...prev, ...unscrambleSelected].sort(() => Math.random() - 0.5));
        setUnscrambleSelected([]);
      }, 850);
    }
  }, [currentExercise, unscrambleSelected, selectedAnswer]);

  return {
    currentExerciseIndex, setCurrentExerciseIndex,
    currentExercise, setCurrentExercise,
    isGeneratingExercise, setIsGeneratingExercise,
    selectedAnswer, setSelectedAnswer,
    exercisesCompleted, setExercisesCompleted,
    exerciseStyle, setExerciseStyle,
    spellInput, setSpellInput,
    spellHintTriggered, setSpellHintTriggered,
    unscrambleOptions, setUnscrambleOptions,
    unscrambleSelected, setUnscrambleSelected,
    exerciseStreak, setExerciseStreak,
    incorrectAttempts, setIncorrectAttempts,
    spellError, setSpellError,
    generateNewExercise,
    handleChoiceSelect,
    verifyScribeAnswer,
    verifyUnscrambleAnswer
  };
};
