import { describe, it, expect } from 'vitest';
import { THEMES } from './themes';
import { MenuMode, AppTheme } from './types';

describe('THEMES configuration', () => {
  const expectedModes: MenuMode[] = [
    'student',
    'teacher',
    'beginner',
    'exercises',
    'progress',
    'flashcards'
  ];

  const requiredThemeKeys: (keyof AppTheme)[] = [
    'primary',
    'textPrimary',
    'textLight',
    'textMedium',
    'textMuted',
    'badgeBg',
    'borderDouble',
    'borderSingle',
    'accentBtn',
    'accentBtnDisabled',
    'shadowGlow',
    'glowHex',
    'bgGradient',
    'glowClass',
    'activeIconColor',
    'svgPrimary',
    'svgSecondary'
  ];

  it('contains entries for all defined MenuMode values', () => {
    const themeKeys = Object.keys(THEMES) as MenuMode[];
    expect(themeKeys.sort()).toEqual([...expectedModes].sort());
  });

  describe.each(expectedModes)('theme mode: %s', (mode) => {
    it('defines a valid theme object', () => {
      const theme = THEMES[mode];
      expect(theme).toBeDefined();
      expect(typeof theme).toBe('object');
    });

    it('contains all required AppTheme properties with non-empty string values', () => {
      const theme = THEMES[mode];
      for (const property of requiredThemeKeys) {
        expect(theme).toHaveProperty(property);
        expect(typeof theme[property]).toBe('string');
        expect(theme[property].trim().length).toBeGreaterThan(0);
      }
    });

    it('has valid hex color codes for glowHex, svgPrimary, and svgSecondary', () => {
      const theme = THEMES[mode];
      const hexRegex = /^#[0-9a-fA-F]{6}$/;

      expect(theme.glowHex).toMatch(hexRegex);
      expect(theme.svgPrimary).toMatch(hexRegex);
      expect(theme.svgSecondary).toMatch(hexRegex);
    });

    it('has proper Tailwind background gradient syntax', () => {
      const theme = THEMES[mode];
      expect(theme.bgGradient).toContain('from-');
      expect(theme.bgGradient).toContain('via-');
      expect(theme.bgGradient).toContain('to-');
    });

    it('has appropriate shadow glow styling', () => {
      const theme = THEMES[mode];
      expect(theme.shadowGlow).toMatch(/^shadow-\[.*\]$/);
      expect(theme.glowClass).toMatch(/hover:shadow-\[.*\]/);
    });
  });

  it('maps primary identifiers to their expected color themes', () => {
    expect(THEMES.student.primary).toBe('blue');
    expect(THEMES.teacher.primary).toBe('green');
    expect(THEMES.beginner.primary).toBe('velvet');
    expect(THEMES.exercises.primary).toBe('gold');
    expect(THEMES.progress.primary).toBe('red');
    expect(THEMES.flashcards.primary).toBe('indigo');
  });

  it('matches specific distinct glow colors for each theme', () => {
    expect(THEMES.student.glowHex).toBe('#22d3ee');
    expect(THEMES.teacher.glowHex).toBe('#10b981');
    expect(THEMES.beginner.glowHex).toBe('#d946ef');
    expect(THEMES.exercises.glowHex).toBe('#f59e0b');
    expect(THEMES.progress.glowHex).toBe('#f43f5e');
    expect(THEMES.flashcards.glowHex).toBe('#6366f1');
  });
});
