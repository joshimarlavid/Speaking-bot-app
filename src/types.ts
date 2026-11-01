export type MenuMode = 'student' | 'teacher' | 'exercises' | 'beginner' | 'progress' | 'flashcards';

export type ExerciseStyle = 'choice' | 'spell' | 'unscramble';

export type ExerciseAnswer = number | null;

export interface Exercise {
  id?: number | string;
  topic: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  pronunciation?: string;
}

export interface AppTheme {
  primary: string;
  textPrimary: string;
  textLight: string;
  textMedium: string;
  textMuted: string;
  badgeBg: string;
  borderDouble: string;
  borderSingle: string;
  accentBtn: string;
  accentBtnDisabled: string;
  shadowGlow: string;
  glowHex: string;
  bgGradient: string;
  glowClass: string;
  activeIconColor: string;
  svgPrimary: string;
  svgSecondary: string;
}
