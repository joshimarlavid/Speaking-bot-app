import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: "1950s cigarette advertisement aesthetic, a glowing green emerald smoke cloud shaped like healthy lungs, high-tech microscopic nanobots repairing tissue, vintage luxury magazine texture, cynical and futuristic."
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        if (!fs.existsSync('public')) {
          fs.mkdirSync('public');
        }
        fs.writeFileSync('public/bg.png', Buffer.from(part.inlineData.data, 'base64'));
        console.log('Image saved to public/bg.png');
        break;
      }
    }
  } catch (error) {
    console.error('Error generating image:', error);
  }
}

run();
