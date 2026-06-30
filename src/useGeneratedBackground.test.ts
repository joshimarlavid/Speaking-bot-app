import { renderHook, waitFor } from '@testing-library/react';
import { useGeneratedBackground } from './useGeneratedBackground';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GoogleGenAI } from '@google/genai';

// Mock the GoogleGenAI library
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: vi.fn().mockRejectedValue(new Error('API Error')),
      };
    },
  };
});

describe('useGeneratedBackground', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should handle errors when generation fails, log to console, and set isGenerating to false', async () => {
    // Mock console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Render the hook
    const { result } = renderHook(() => useGeneratedBackground('test prompt'));

    // The initial render sets it to true because cache is empty
    expect(result.current.isGenerating).toBe(true);

    // Wait for the hook to finish generating (which in this case means it fails)
    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    // Check that console.error was called with the correct message and error object
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to generate background',
      expect.any(Error)
    );
    expect(consoleErrorSpy.mock.calls[0][1].message).toBe('API Error');

    // Restore the spy
    consoleErrorSpy.mockRestore();
  });
});
