/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 *
 * This algorithm runs in O(n) time and provides a uniform, unbiased shuffle,
 * compared to `arr.sort(() => Math.random() - 0.5)` which is slower (O(n log n))
 * and statistically biased in many JS engine implementations.
 *
 * @param array The array to shuffle.
 * @returns A new shuffled array.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
