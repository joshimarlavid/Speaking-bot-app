import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

export function useGeneratedBackground(prompt: string) {
  const cacheKey = `linguaRole_bg_${btoa(unescape(encodeURIComponent(prompt))).slice(0, 16)}`;
  const [bgUrl, setBgUrl] = useState<string | null>(() => localStorage.getItem(cacheKey));
  const [isGenerating, setIsGenerating] = useState(!localStorage.getItem(cacheKey));

  useEffect(() => {
    if (bgUrl) {
      setIsGenerating(false);
      return;
    }

    async function generate() {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: prompt,
          config: {
            imageConfig: {
              aspectRatio: "16:9",
              imageSize: "1K"
            }
          }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const url = `data:image/jpeg;base64,${part.inlineData.data}`;
            setBgUrl(url);
            try {
              localStorage.setItem(cacheKey, url);
            } catch (e) {
              console.warn("Could not save background to localStorage (might be too large).");
            }
            break;
          }
        }
      } catch (e) {
        console.error("Failed to generate background", e);
      } finally {
        setIsGenerating(false);
      }
    }
    generate();
  }, [prompt, bgUrl, cacheKey]);

  return { bgUrl, isGenerating };
}
