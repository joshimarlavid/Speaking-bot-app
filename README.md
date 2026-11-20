<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/97b014ff-d67d-40c1-88a4-673ca51f1114

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to a key from [Google AI Studio](https://aistudio.google.com/apikey). Gemini Live and AI-generated feedback require this key and access to the Live model. Optionally set `ELEVEN_API_KEY` for ElevenLabs voices.
3. Run the app:
   `npm run dev`

Allow microphone access in your browser to speak in real time. Microphone access requires HTTPS or localhost. If permission is unavailable, use the text input instead. Browsers may block automatic feedback playback; use the replay control or read the written report. ElevenLabs mode uses turn-by-turn interaction, rather than the Gemini Live streaming conversation.
