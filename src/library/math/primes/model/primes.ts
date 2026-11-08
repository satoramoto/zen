// Primes: a sieve once, the first n primes, their gaps, and a histogram. Pure; the prime-wave
// figures and the Prime waves chapter read it.

/** The sieve's reach: it holds the first 100,000 primes (the 100,000th is 1,299,709). */
export const SIEVE_LIMIT = 1_300_000;
/** The most primes any figure asks for. */
export const MAX_PRIMES = 100_000;

let sieved: Int32Array | null = null;

/** Every prime up to `SIEVE_LIMIT`, in order, sieved once and kept. */
function allPrimes(): Int32Array {
  if (sieved) return sieved;
  const composite = new Uint8Array(SIEVE_LIMIT + 1);
  const out: number[] = [];
  for (let n = 2; n <= SIEVE_LIMIT; n++) {
    if (composite[n]) continue;
    out.push(n);
    for (let m = n * n; m <= SIEVE_LIMIT; m += n) composite[m] = 1;
  }
  sieved = Int32Array.from(out);
  return sieved;
}

/** The first `n` primes (clamped to 0…`MAX_PRIMES`). */
export function firstPrimes(n: number): Int32Array {
  return allPrimes().subarray(0, Math.max(0, Math.min(MAX_PRIMES, Math.floor(n))));
}

/** Whether `n` is prime, for 0 ≤ n ≤ `SIEVE_LIMIT`. */
export function isPrime(n: number): boolean {
  if (n < 2 || n > SIEVE_LIMIT || !Number.isInteger(n)) return false;
  const all = allPrimes();
  let lo = 0;
  let hi = all.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (all[mid] === n) return true;
    if (all[mid] < n) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

/** The differences between neighbouring primes: one fewer than the primes. */
export function gaps(primes: ArrayLike<number>): Int32Array {
  const out = new Int32Array(Math.max(0, primes.length - 1));
  for (let i = 1; i < primes.length; i++) out[i - 1] = primes[i] - primes[i - 1];
  return out;
}

/** How often each value occurs, as [value, count] pairs sorted by value. */
export function histogram(values: ArrayLike<number>): [number, number][] {
  const counts = new Map<number, number>();
  for (let i = 0; i < values.length; i++) counts.set(values[i], (counts.get(values[i]) ?? 0) + 1);
  return [...counts].sort((a, b) => a[0] - b[0]);
}

/** Clamp a requested count to `1…limit`, and say whether it was cut. */
export function clampCount(requested: number, limit: number): { count: number; clamped: boolean } {
  const count = Math.max(1, Math.min(limit, Math.round(requested)));
  return { count, clamped: Math.round(requested) > limit };
}
