import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GrammarExercises, GrammarExercisesProps } from './GrammarExercises';
import { Exercise } from '../types';

vi.mock('../utils/audio', () => ({
  playClick: vi.fn(),
  playReward: vi.fn(),
}));

vi.mock('../contexts/AppContext', () => ({
  useAppContext: () => ({
    activeTheme: {
      primary: 'amber',
      textPrimary: 'text-amber-400',
      textLight: 'text-amber-200',
      textMedium: 'text-amber-300',
      textMuted: 'text-amber-200/60',
      badgeBg: 'bg-amber-950/60',
      borderDouble: 'border-amber-500/30',
      borderSingle: 'border-amber-900/40',
      accentBtn: 'bg-amber-600',
      accentBtnDisabled: 'bg-amber-950/20',
      shadowGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      glowHex: '#f59e0b',
      bgGradient: 'from-amber-950/20',
      glowClass: 'glow-amber',
      activeIconColor: 'text-amber-400',
      svgPrimary: '#f59e0b',
      svgSecondary: '#78350f'
    }
  })
}));

const mockExercise: Exercise = {
  id: 1,
  topic: 'Past Tenses',
  question: 'When I was young, we _____ to the library every week.',
  options: ['go', 'were going', 'went', 'have gone'],
  answer: 2,
  explanation: 'Use simple past for repeated past actions.',
  pronunciation: 'library: /ˈlaɪˌbrɛri/'
};

const defaultProps: GrammarExercisesProps = {
  currentExerciseIndex: 0,
  setCurrentExerciseIndex: vi.fn(),
  currentExercise: mockExercise,
  setCurrentExercise: vi.fn(),
  isGeneratingExercise: false,
  selectedAnswer: null,
  setSelectedAnswer: vi.fn(),
  exercisesCompleted: 3,
  exerciseStyle: 'choice',
  setExerciseStyle: vi.fn(),
  spellInput: '',
  setSpellInput: vi.fn(),
  spellHintTriggered: false,
  setSpellHintTriggered: vi.fn(),
  unscrambleOptions: [],
  unscrambleSelected: [],
  setUnscrambleSelected: vi.fn(),
  exerciseStreak: 2,
  incorrectAttempts: {},
  setIncorrectAttempts: vi.fn(),
  spellError: false,
  generateNewExercise: vi.fn(),
  handleChoiceSelect: vi.fn(),
  verifyScribeAnswer: vi.fn(),
  verifyUnscrambleAnswer: vi.fn(),
  setUnscrambleOptions: vi.fn(),
};

const renderComponent = (props: Partial<GrammarExercisesProps> = {}) => {
  return render(
    <GrammarExercises {...defaultProps} {...props} />
  );
};

describe('GrammarExercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly in multiple choice mode', () => {
    renderComponent();

    expect(screen.getByText('Past Tenses')).toBeDefined();
    expect(screen.getByText('When I was young, we _____ to the library every week.')).toBeDefined();
    expect(screen.getByText('Streak: 2')).toBeDefined();
    expect(screen.getByText(/3/)).toBeDefined();
    expect(screen.getByText('went')).toBeDefined();
  });

  it('calls handleChoiceSelect when an option is clicked', () => {
    const handleChoiceSelect = vi.fn();
    renderComponent({ handleChoiceSelect });

    const optionBtn = screen.getByRole('button', { name: /went/i });
    fireEvent.click(optionBtn);

    expect(handleChoiceSelect).toHaveBeenCalledWith(2);
  });

  it('switches exercise styles when buttons are clicked', () => {
    const setExerciseStyle = vi.fn();
    renderComponent({ setExerciseStyle });

    const unscrambleBtn = screen.getByRole('button', { name: /incantation/i });
    fireEvent.click(unscrambleBtn);
    expect(setExerciseStyle).toHaveBeenCalledWith('unscramble');

    const spellBtn = screen.getByRole('button', { name: /scribe ritual/i });
    fireEvent.click(spellBtn);
    expect(setExerciseStyle).toHaveBeenCalledWith('spell');
  });

  it('renders unscramble mode correctly and handles interaction', () => {
    const setUnscrambleSelected = vi.fn();
    const setUnscrambleOptions = vi.fn();
    const verifyUnscrambleAnswer = vi.fn();

    renderComponent({
      exerciseStyle: 'unscramble',
      unscrambleOptions: ['went', 'library'],
      unscrambleSelected: ['When', 'I'],
      setUnscrambleSelected,
      setUnscrambleOptions,
      verifyUnscrambleAnswer
    });

    expect(screen.getByRole('button', { name: 'When' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'library' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'library' }));
    expect(setUnscrambleOptions).toHaveBeenCalled();
    expect(setUnscrambleSelected).toHaveBeenCalled();
  });

  it('renders scribe ritual mode and handles input and verification', () => {
    const setSpellInput = vi.fn();
    const verifyScribeAnswer = vi.fn();
    const setSpellHintTriggered = vi.fn();

    renderComponent({
      exerciseStyle: 'spell',
      spellInput: 'went',
      setSpellInput,
      verifyScribeAnswer,
      setSpellHintTriggered
    });

    const input = screen.getByPlaceholderText('Type the missing word...');
    expect(input).toBeDefined();

    fireEvent.change(input, { target: { value: 'test' } });
    expect(setSpellInput).toHaveBeenCalledWith('test');

    const inscribeBtn = screen.getByRole('button', { name: 'Inscribe' });
    fireEvent.click(inscribeBtn);
    expect(verifyScribeAnswer).toHaveBeenCalled();

    const hintBtn = screen.getByRole('button', { name: 'Reveal Hint' });
    fireEvent.click(hintBtn);
    expect(setSpellHintTriggered).toHaveBeenCalledWith(true);
  });

  it('displays explanation and next scroll button when an answer is selected', () => {
    const setCurrentExerciseIndex = vi.fn();
    const setCurrentExercise = vi.fn();
    const setSelectedAnswer = vi.fn();

    renderComponent({
      selectedAnswer: 2,
      setCurrentExerciseIndex,
      setCurrentExercise,
      setSelectedAnswer
    });

    expect(screen.getByText('Wisdom Unveiled')).toBeDefined();
    expect(screen.getByText('Use simple past for repeated past actions.')).toBeDefined();

    const nextBtn = screen.getByRole('button', { name: /next scroll/i });
    fireEvent.click(nextBtn);

    expect(setCurrentExerciseIndex).toHaveBeenCalled();
    expect(setCurrentExercise).toHaveBeenCalled();
    expect(setSelectedAnswer).toHaveBeenCalledWith(null);
  });
});
