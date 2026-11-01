export type MenuMode = 'student' | 'teacher' | 'exercises' | 'beginner' | 'progress' | 'flashcards';

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

export interface FeedbackLog {
  date: string;
  role: string;
  topic: string;
  ratingAI: number;
  ratingTopic: number;
  comments: string;
  student?: string;
  aiReport?: string | null;
}
