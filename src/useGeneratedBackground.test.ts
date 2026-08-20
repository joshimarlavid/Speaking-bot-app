import { renderHook, waitFor } from '@testing-library/react';
import { useGeneratedBackground } from './useGeneratedBackground';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useGeneratedBackground', () => {
  const mockPrompt = 'test prompt';
  // Compute cache key as done in the component:
  const cacheKey = `linguaRole_bg_${btoa(unescape(encodeURIComponent(mockPrompt))).slice(0, 16)}`;

  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};

    // Mock localStorage
    const localStorageProto = Storage.prototype;
    vi.spyOn(localStorageProto, 'getItem').mockImplementation((key) => localStorageMock[key] || null);
    vi.spyOn(localStorageProto, 'setItem').mockImplementation((key, value) => {
      localStorageMock[key] = value.toString();
    });
    vi.spyOn(localStorageProto, 'removeItem').mockImplementation((key) => {
      delete localStorageMock[key];
    });

    // Mock fetch
    global.fetch = vi.fn();

    // Mock console.warn and console.error to avoid noise
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return cached URL and not fetch if cache exists', () => {
    const cachedUrl = 'http://example.com/cached.png';
    localStorageMock[cacheKey] = cachedUrl;

    const { result } = renderHook(() => useGeneratedBackground(mockPrompt));

    expect(result.current.bgUrl).toBe(cachedUrl);
    expect(result.current.isGenerating).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch new URL and cache it if not in cache', async () => {
    const newUrl = 'http://example.com/new.png';
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: newUrl }),
    });

    const { result } = renderHook(() => useGeneratedBackground(mockPrompt));

    // Initially, it should be generating and have no url
    expect(result.current.bgUrl).toBe(null);
    expect(result.current.isGenerating).toBe(true);

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.bgUrl).toBe(newUrl);
    });

    expect(result.current.isGenerating).toBe(false);
    expect(localStorageMock[cacheKey]).toBe(newUrl);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/generate-background', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ prompt: mockPrompt }),
    }));
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useGeneratedBackground(mockPrompt));

    expect(result.current.isGenerating).toBe(true);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.bgUrl).toBe(null);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle fetch exception gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useGeneratedBackground(mockPrompt));

    expect(result.current.isGenerating).toBe(true);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.bgUrl).toBe(null);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle localStorage setItem error gracefully', async () => {
    const newUrl = 'http://example.com/new.png';
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: newUrl }),
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const { result } = renderHook(() => useGeneratedBackground(mockPrompt));

    await waitFor(() => {
      expect(result.current.bgUrl).toBe(newUrl);
    });

    expect(result.current.isGenerating).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Could not save background'));
  });
});
