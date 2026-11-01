import { performance } from 'perf_hooks';

// Simulate typical Web Audio buffer (2048 samples as in ScriptProcessorNode(2048, 1, 1))
const BUFFER_SIZE = 2048;
const ITERATIONS = 50000;
const inputData = new Float32Array(BUFFER_SIZE);
for (let i = 0; i < BUFFER_SIZE; i++) {
  inputData[i] = Math.sin(i * 0.05);
}

function baselineConversion(inputData) {
  const pcm16 = new Int16Array(inputData.length);
  for (let i = 0; i < inputData.length; i++) {
    pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
  }
  const buffer = new ArrayBuffer(pcm16.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(i * 2, pcm16[i], true);
  }
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

function optimizedConversion(inputData) {
  const len = inputData.length;
  const pcm16 = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  if (bytes.length <= 0x8000) {
    return btoa(String.fromCharCode.apply(null, bytes));
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// Correctness verification
const baselineOut = baselineConversion(inputData);
const optimizedOut = optimizedConversion(inputData);
if (baselineOut !== optimizedOut) {
  throw new Error('Optimized output does not match baseline output!');
}

// Warmup
for (let i = 0; i < 5000; i++) {
  baselineConversion(inputData);
  optimizedConversion(inputData);
}

// Benchmark Baseline
const t0 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  baselineConversion(inputData);
}
const t1 = performance.now();
const baselineTotal = t1 - t0;
const baselineAvgUs = (baselineTotal / ITERATIONS) * 1000;

// Benchmark Optimized
const t2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  optimizedConversion(inputData);
}
const t3 = performance.now();
const optimizedTotal = t3 - t2;
const optimizedAvgUs = (optimizedTotal / ITERATIONS) * 1000;

const speedupPercent = (((baselineTotal - optimizedTotal) / baselineTotal) * 100).toFixed(2);
const factor = (baselineTotal / optimizedTotal).toFixed(2);

console.log('--- Audio TypedArray to Base64 Benchmark ---');
console.log(`Buffer size: ${BUFFER_SIZE} samples, Iterations: ${ITERATIONS}`);
console.log(`Baseline  Total: ${baselineTotal.toFixed(2)} ms (${baselineAvgUs.toFixed(2)} µs/op)`);
console.log(`Optimized Total: ${optimizedTotal.toFixed(2)} ms (${optimizedAvgUs.toFixed(2)} µs/op)`);
console.log(`Improvement: ${speedupPercent}% faster (${factor}x speedup)`);
