import { useState, useEffect } from 'react';

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
                const response = await fetch('/api/generate-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (!response.ok) throw new Error("Failed to generate background");
        
        const data = await response.json();
        if (data.url) {
          setBgUrl(data.url);
          try {
            localStorage.setItem(cacheKey, data.url);
          } catch (e) {
            console.warn("Could not save background to localStorage (might be too large).");
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
