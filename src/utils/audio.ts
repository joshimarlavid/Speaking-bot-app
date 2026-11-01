// Web Audio API Synthesizer for Dark Art Studio sfx
// Programmatic synthesis ensures zero-latency, offline capability, and zero external downloads.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a subtle, tactile, dark stone/wood click sound.
 */
export function playClick() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Osc and Gain
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (error) {
    console.warn('Audio click failed to play:', error);
  }
}

/**
 * Play a mystical dark sweep/drone when start/roll/trigger key actions happen.
 */
export function playStart() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Low mysterious hum and sweep
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Detuned frequencies for rich chorus
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(220, now + 0.6);

    osc2.frequency.setValueAtTime(111.5, now);
    osc2.frequency.exponentialRampToValueAtTime(221.5, now + 0.6);

    // Filter to make it warmer/darker
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.8);

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.35, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.95);
    osc2.stop(now + 0.95);
  } catch (error) {
    console.warn('Audio start failed to play:', error);
  }
}

/**
 * Play a glittering, medieval dark-ambient chime chord for daily reward/challenge completion.
 */
export function playReward() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Minor/major gothic bell arpeggio notes
    // E4 (329.63), G4 (392.00), B4 (493.88), F#5 (739.99)
    const freqs = [329.63, 392.00, 493.88, 739.99];

    freqs.forEach((freq, idx) => {
      const noteDelay = idx * 0.12; // Arpeggiate
      const noteTime = now + noteDelay;

      const osc = ctx.createOscillator();
      const sineOsc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Osc 1 (Triangle)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, noteTime + 1.2);

      // Osc 2 (Sine overlay)
      sineOsc.type = 'sine';
      sineOsc.frequency.setValueAtTime(freq * 2, noteTime); // Harmonic

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, noteTime);
      filter.frequency.exponentialRampToValueAtTime(250, noteTime + 1.5);

      gainNode.gain.setValueAtTime(0.01, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.18, noteTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.5);

      osc.connect(filter);
      sineOsc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteTime);
      sineOsc.start(noteTime);

      osc.stop(noteTime + 1.6);
      sineOsc.stop(noteTime + 1.6);
    });
  } catch (error) {
    console.warn('Audio reward failed to play:', error);
  }
}

/**
 * Converts Float32Array audio samples (-1.0 to 1.0) into base64-encoded PCM16 LE audio.
 * Optimized single-pass conversion avoiding redundant ArrayBuffer, DataView, and loop iterations.
 */
export function float32ToPcm16Base64(inputData: Float32Array): string {
  const len = inputData.length;
  const pcm16 = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
  }
  const bytes = new Uint8Array(pcm16.buffer);

  // String.fromCharCode.apply has a stack limit on arguments in JS engines (typically 65536).
  // For standard audio chunks (e.g. 2048 samples = 4096 bytes), direct apply is extremely fast.
  // For larger buffers, chunked processing ensures safety against stack overflows.
  if (bytes.length <= 0x8000) {
    return btoa(String.fromCharCode.apply(null, bytes as unknown as number[]));
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000) as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Converts base64-encoded PCM16 LE audio into Float32Array audio samples (-1.0 to 1.0).
 * Optimized single-pass decoding eliminating redundant Uint8Array and Int16Array allocations,
 * buffer copies, and secondary loop iterations.
 */
export function base64ToFloat32(base64Audio: string): Float32Array {
  const binaryString = atob(base64Audio);
  const pcmLength = binaryString.length >> 1;
  const float32 = new Float32Array(pcmLength);
  for (let i = 0; i < pcmLength; i++) {
    const idx = i << 1;
    const s = ((binaryString.charCodeAt(idx) | (binaryString.charCodeAt(idx + 1) << 8)) << 16) >> 16;
    float32[i] = s / 32768;
  }
  return float32;
}
