import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function() {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({ text: 'mocked text' })
        }
      };
    })
  };
});

describe('Server API Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/chat-roleplay', () => {
    it('should catch unhandled errors and return offline fallback response', async () => {
      // Set valid API keys to enter the main logic path
      process.env.GEMINI_API_KEY = 'valid_key_that_is_longer_than_10_chars';
      process.env.ELEVEN_API_KEY = 'valid_eleven_key';

      // Mock fetch to throw an error simulating a network failure during ElevenLabs API call
      const mockFetch = vi.spyOn(global, 'fetch').mockImplementation(async () => {
        throw new Error('Artificial Network Error');
      });

      // Provide input that triggers the offline fallback mapping for 'grumpy' persona
      const response = await request(app)
        .post('/api/chat-roleplay')
        .send({
          user_input: 'hello',
          persona_prompt: 'grumpy'
        });

      // Assertions
      expect(response.status).toBe(200);

      // Expected offline response for 'grumpy' + 'hello'
      const expectedText = "Honestly, I've been traveling for 12 hours and my luggage is missing! This is unacceptable. Check my reservation!";

      expect(response.body).toEqual({ text: expectedText });
      expect(decodeURIComponent(response.headers['x-response-text'])).toBe(expectedText);

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalled();

      // Clean up mock
      mockFetch.mockRestore();
    });
  });
});
