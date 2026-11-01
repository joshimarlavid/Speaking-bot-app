import { performance } from 'perf_hooks';

// Simulate typical Web Audio chunk received from Gemini Live API (e.g. 2400 samples = 4800 bytes PCM16 at 24kHz)
const SAMPLES = 2400;
const ITERATIONS = 50000;

const pcmData = new Int16Array(SAMPLES);
for (let i = 0; i < SAMPLES; i++) {
  pcmData[i] = Math.round(Math.sin(i * 0.05) * 32000);
}
const bytes = new Uint8Array(pcmData.buffer);
const base64Audio = Buffer.from(bytes).toString('base64');

// Baseline implementation from src/useLiveAPI.ts:282
function baselineConversion(base64Audio) {
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768;
  }
  return float32;
}

// Optimized implementation: single-pass decode avoiding intermediate Uint8Array, Int16Array, and secondary loop
function optimizedConversion(base64Audio) {
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

// Correctness verification
const baselineOut = baselineConversion(base64Audio);
const optimizedOut = optimizedConversion(base64Audio);

if (baselineOut.length !== optimizedOut.length) {
  throw new Error(`Length mismatch: baseline ${baselineOut.length} vs optimized ${optimizedOut.length}`);
}

for (let i = 0; i < baselineOut.length; i++) {
  if (baselineOut[i] !== optimizedOut[i]) {
    throw new Error(`Mismatch at index ${i}: baseline ${baselineOut[i]} vs optimized ${optimizedOut[i]}`);
  }
}

// Warmup
for (let i = 0; i < 5000; i++) {
  baselineConversion(base64Audio);
  optimizedConversion(base64Audio);
}

// Benchmark Baseline
const t0 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  baselineConversion(base64Audio);
}
const t1 = performance.now();
const baselineTotal = t1 - t0;
const baselineAvgUs = (baselineTotal / ITERATIONS) * 1000;

// Benchmark Optimized
const t2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  optimizedConversion(base64Audio);
}
const t3 = performance.now();
const optimizedTotal = t3 - t2;
const optimizedAvgUs = (optimizedTotal / ITERATIONS) * 1000;

const speedupPercent = (((baselineTotal - optimizedTotal) / baselineTotal) * 100).toFixed(2);
const factor = (baselineTotal / optimizedTotal).toFixed(2);

console.log('--- Base64 to Float32Array Benchmark ---');
console.log(`Audio Chunk: ${SAMPLES} samples (${bytes.length} bytes), Iterations: ${ITERATIONS}`);
console.log(`Baseline  Total: ${baselineTotal.toFixed(2)} ms (${baselineAvgUs.toFixed(2)} µs/op)`);
console.log(`Optimized Total: ${optimizedTotal.toFixed(2)} ms (${optimizedAvgUs.toFixed(2)} µs/op)`);
console.log(`Improvement: ${speedupPercent}% faster (${factor}x speedup)`);
