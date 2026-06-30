import { renderHook, waitFor } from '@testing-library/react';
import { useGeneratedBackground } from './useGeneratedBackground';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockGenerateContent = vi.fn();

// The class itself must be mockable
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent
      }
    }
  };
});

import { GoogleGenAI } from '@google/genai';

describe('useGeneratedBackground', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state and call the API when cache is empty', async () => {
    const mockImageBase64 = 'mock-base64-data';

    mockGenerateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: mockImageBase64,
                  },
                },
              ],
            },
          },
        ],
      });

    const prompt = 'a beautiful landscape';

    const { result } = renderHook(() => useGeneratedBackground(prompt));

    // Wait for the hook to finish processing the API response
    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    // Check that the API was called
    expect(mockGenerateContent).toHaveBeenCalledWith({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '1K',
        },
      },
    });

    // Check the final state
    const expectedUrl = `data:image/jpeg;base64,${mockImageBase64}`;
    expect(result.current.bgUrl).toBe(expectedUrl);

    // Check if it was saved to cache
    const cacheKey = `linguaRole_bg_${btoa(unescape(encodeURIComponent(prompt))).slice(0, 16)}`;
    expect(localStorage.getItem(cacheKey)).toBe(expectedUrl);
  });

  it('should initialize with cached image and not call API if cache exists', () => {
    const prompt = 'cached prompt';
    const cachedUrl = 'data:image/jpeg;base64,cached-data';
    const cacheKey = `linguaRole_bg_${btoa(unescape(encodeURIComponent(prompt))).slice(0, 16)}`;

    localStorage.setItem(cacheKey, cachedUrl);

    const { result } = renderHook(() => useGeneratedBackground(prompt));

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.bgUrl).toBe(cachedUrl);

    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));

    const prompt = 'error prompt';
    const { result } = renderHook(() => useGeneratedBackground(prompt));

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.bgUrl).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Failed to generate background", expect.any(Error));
  });

  it('should handle localStorage quota errors gracefully', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const mockImageBase64 = 'large-mock-data';

    mockGenerateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: mockImageBase64,
                  },
                },
              ],
            },
          },
        ],
      });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const prompt = 'large image prompt';
    const { result } = renderHook(() => useGeneratedBackground(prompt));

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    const expectedUrl = `data:image/jpeg;base64,${mockImageBase64}`;
    expect(result.current.bgUrl).toBe(expectedUrl);

    expect(console.warn).toHaveBeenCalledWith("Could not save background to localStorage (might be too large).");

    setItemSpy.mockRestore();
  });
});
