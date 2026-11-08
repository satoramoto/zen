// A prime as a wave in a boundary: p half-waves between walls at 0 and 1; its interior nodes
// k/p; how close two primes' nodes come; and the wave wrapped round a circle. Pure.

/** The standing wave of prime p at x in [0, 1]: sin(p·π·x), p half-waves between the walls. */
export const boundaryWave = (p: number, x: number) => Math.sin(p * Math.PI * x);

/** The interior nodes (the "centres" between half-waves) of prime p: k/p for k = 1…p−1. */
export function nodeMarks(p: number): number[] {
  return Array.from({ length: Math.max(0, p - 1) }, (_, i) => (i + 1) / p);
}

/** k with k·q ≡ 1 (mod p), for coprime p and q. */
function inverse(q: number, p: number): number {
  let [r0, r1] = [p, ((q % p) + p) % p];
  let [s0, s1] = [0, 1];
  while (r1 !== 0) {
    const t = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - t * r1];
    [s0, s1] = [s1, s0 - t * s1];
  }
  return ((s0 % p) + p) % p;
}

export interface Approach {
  /** The distance between the two nearest marks, as a share of the width. */
  distance: number;
  /** The two primes and the marks (k/p and j/q) that come closest. */
  p: number;
  q: number;
  k: number;
  j: number;
}

/**
 * How close the interior marks of two different primes come. For distinct primes p < q, k/p and
 * j/q differ by |kq − jp|/(pq), which is never 0 (p would have to divide k) and is 1/(pq) for the
 * k with kq ≡ ±1 (mod p). So across a set of primes the closest pair is the two largest.
 */
export function closestApproach(primes: ArrayLike<number>): Approach | undefined {
  if (primes.length < 2) return undefined;
  const sorted = Array.from(primes).sort((a, b) => a - b);
  const p = sorted[sorted.length - 2];
  const q = sorted[sorted.length - 1];
  if (p < 2) return undefined;
  // kq − jp = 1 with 1 ≤ k ≤ p − 1 (then 1 ≤ j ≤ q − 1).
  const k = inverse(q, p);
  const j = (k * q - 1) / p;
  return { distance: 1 / (p * q), p, q, k, j };
}

/** The wrapped wave of prime p at angle θ: radius 1 + a·sin(p·θ). */
export const wrappedRadius = (p: number, theta: number, amplitude: number) => 1 + amplitude * Math.sin(p * theta);
