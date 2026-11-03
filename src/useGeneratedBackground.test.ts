import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGeneratedBackground } from './useGeneratedBackground';

describe('useGeneratedBackground', () => {
  it('should return default background asset and isGenerating false when called without prompt', () => {
    const { result } = renderHook(() => useGeneratedBackground());

    expect(result.current).toEqual({
      bgUrl: '/deep-sea-bg.jpg',
      isGenerating: false,
    });
  });

  it('should return default background asset and isGenerating false when called with a prompt', () => {
    const prompt = 'fantasy underwater landscape with neon coral';
    const { result } = renderHook(() => useGeneratedBackground(prompt));

    expect(result.current).toEqual({
      bgUrl: '/deep-sea-bg.jpg',
      isGenerating: false,
    });
  });

  it('should maintain consistent return values when rerendered with different prompts', () => {
    const { result, rerender } = renderHook(
      ({ prompt }: { prompt?: string }) => useGeneratedBackground(prompt),
      { initialProps: { prompt: 'initial prompt' } }
    );

    expect(result.current.bgUrl).toBe('/deep-sea-bg.jpg');
    expect(result.current.isGenerating).toBe(false);

    rerender({ prompt: 'updated prompt' });

    expect(result.current.bgUrl).toBe('/deep-sea-bg.jpg');
    expect(result.current.isGenerating).toBe(false);

    rerender({ prompt: undefined });

    expect(result.current.bgUrl).toBe('/deep-sea-bg.jpg');
    expect(result.current.isGenerating).toBe(false);
  });
});
