/** Small, deterministic local engine for the Spatial Studio specimen. No Sage connection.
 * The bounded number domain is deliberate; exact-value UI must not inherit this limit. */
export const MAX_INTEGER_POINTS = 100_000;
export const MAX_INTEGER_VALUE = 1_000_000;
export interface IntegerDomain { start: number; end: number; step: number }
export type PlacementKind = 'line' | 'grid' | 'snake' | 'ulam' | 'volume';
export interface Placement { kind: PlacementKind; width: number; depth: number }
export interface IntegerPoint { id: string; n: number; index: number; x: number; y: number; z: number }
export interface PrimeFactor { prime: number; exponent: number }
export interface IntegerProperties {
  value: number;
  factors: PrimeFactor[];
  divisors: number[];
  divisorCount: number;
  distinctPrimeFactorCount: number;
  isPrime: boolean;
  isSquare: boolean;
  isCube: boolean;
}
export type Predicate =
  | { kind: 'multiple'; divisor: number }
  | { kind: 'residue'; modulus: number; remainder: number }
  | { kind: 'square' | 'cube' | 'prime' }
  | { kind: 'and' | 'or' | 'difference' | 'xor'; left: Predicate; right: Predicate };

export function validateDomain(domain: IntegerDomain): string | null {
  if (![domain.start, domain.end, domain.step].every(Number.isSafeInteger)) return 'Use whole, safe integers for start, end, and step.';
  if (domain.start < 1 || domain.end > MAX_INTEGER_VALUE) return `This local explorer supports positive values from 1 to ${MAX_INTEGER_VALUE}.`;
  if (domain.end < domain.start) return 'End must be greater than or equal to start.';
  if (domain.step < 1) return 'Step must be positive.';
  if (Math.floor((domain.end - domain.start) / domain.step) + 1 > MAX_INTEGER_POINTS) return `Choose at most ${MAX_INTEGER_POINTS} values.`;
  return null;
}
export function validatePlacement(placement: Placement): string | null {
  if (!['line', 'grid', 'snake', 'ulam', 'volume'].includes(placement.kind)) return 'Unknown placement.';
  if (![placement.width, placement.depth].every(v => Number.isSafeInteger(v) && v >= 1 && v <= MAX_INTEGER_POINTS)) return `Placement dimensions must be whole numbers from 1 to ${MAX_INTEGER_POINTS}.`;
  return null;
}
/** Positions depend on the zero-based index; integer identity survives every placement. */
export function createIntegerPoints(domain: IntegerDomain, placement: Placement): IntegerPoint[] {
  const error = validateDomain(domain) ?? validatePlacement(placement);
  if (error) throw new RangeError(error);
  const count = Math.floor((domain.end - domain.start) / domain.step) + 1;
  let ux = 0, uy = 0, direction = 0, leg = 1, walked = 0, turns = 0;
  return Array.from({ length: count }, (_, index) => {
    let x = index, y = 0, z = 0;
    if (placement.kind === 'grid' || placement.kind === 'snake') {
      y = Math.floor(index / placement.width);
      x = index % placement.width;
      if (placement.kind === 'snake' && y % 2 === 1) x = placement.width - 1 - x;
    } else if (placement.kind === 'volume') {
      x = index % placement.width;
      y = Math.floor(index / placement.width) % placement.depth;
      z = Math.floor(index / (placement.width * placement.depth));
    } else if (placement.kind === 'ulam') {
      x = ux; y = uy;
      if (direction === 0) ux++;
      else if (direction === 1) uy++;
      else if (direction === 2) ux--;
      else uy--;
      if (++walked === leg) { walked = 0; direction = (direction + 1) % 4; if (++turns % 2 === 0) leg++; }
    }
    const n = domain.start + index * domain.step;
    return { id: String(n), n, index, x, y, z };
  });
}
export function integerProperties(n: number): IntegerProperties {
  if (!Number.isSafeInteger(n) || n < 1 || n > MAX_INTEGER_VALUE) throw new RangeError('Integer outside the local engine domain.');
  const factors: PrimeFactor[] = [];
  let remaining = n;
  for (let p = 2; p * p <= remaining; p += p === 2 ? 1 : 2) {
    let exponent = 0;
    while (remaining % p === 0) { exponent++; remaining /= p; }
    if (exponent) factors.push({ prime: p, exponent });
  }
  if (remaining > 1) factors.push({ prime: remaining, exponent: 1 });
  const divisors = [1];
  for (const { prime, exponent } of factors) {
    const existing = [...divisors];
    let power = 1;
    for (let e = 1; e <= exponent; e++) { power *= prime; divisors.push(...existing.map(d => d * power)); }
  }
  divisors.sort((a, b) => a - b);
  const cubeRoot = Math.round(Math.cbrt(n));
  return { value: n, factors, divisors, divisorCount: divisors.length, distinctPrimeFactorCount: factors.length,
    isPrime: factors.length === 1 && factors[0]!.exponent === 1,
    isSquare: Number.isInteger(Math.sqrt(n)), isCube: cubeRoot ** 3 === n };
}
/** Bounded recursive validation prevents corrupt imported predicates from running unbounded work. */
export function validatePredicate(predicate: unknown, depth = 0): predicate is Predicate {
  if (depth > 8 || typeof predicate !== 'object' || predicate === null) return false;
  const p = predicate as Record<string, unknown>;
  if (['square', 'cube', 'prime'].includes(String(p.kind))) return true;
  if (p.kind === 'multiple') return typeof p.divisor === 'number' && Number.isSafeInteger(p.divisor) && p.divisor >= 1 && p.divisor <= MAX_INTEGER_VALUE;
  if (p.kind === 'residue') return typeof p.modulus === 'number' && Number.isSafeInteger(p.modulus) && p.modulus >= 1 && p.modulus <= MAX_INTEGER_VALUE && typeof p.remainder === 'number' && Number.isSafeInteger(p.remainder) && p.remainder >= 0 && p.remainder < p.modulus;
  return ['and', 'or', 'difference', 'xor'].includes(String(p.kind)) && validatePredicate(p.left, depth + 1) && validatePredicate(p.right, depth + 1);
}
// One bounded sieve avoids repeated factorization when evaluating large prime layers.
let composite: Uint8Array | undefined;
function isPrime(n: number): boolean {
  if (!composite) {
    composite = new Uint8Array(MAX_INTEGER_VALUE + 1);
    composite[0] = composite[1] = 1;
    for (let p = 2; p * p <= MAX_INTEGER_VALUE; p++) {
      if (!composite[p]) for (let k = p * p; k <= MAX_INTEGER_VALUE; k += p) composite[k] = 1;
    }
  }
  return Number.isSafeInteger(n) && n >= 2 && n <= MAX_INTEGER_VALUE && !composite[n];
}
export function evaluatePredicate(n: number, predicate: Predicate): boolean {
  switch (predicate.kind) {
    case 'multiple': return n % predicate.divisor === 0;
    case 'residue': return n % predicate.modulus === predicate.remainder;
    case 'square': return Number.isInteger(Math.sqrt(n));
    case 'cube': return Math.round(Math.cbrt(n)) ** 3 === n;
    case 'prime': return isPrime(n);
    case 'and': return evaluatePredicate(n, predicate.left) && evaluatePredicate(n, predicate.right);
    case 'or': return evaluatePredicate(n, predicate.left) || evaluatePredicate(n, predicate.right);
    case 'difference': return evaluatePredicate(n, predicate.left) && !evaluatePredicate(n, predicate.right);
    case 'xor': return evaluatePredicate(n, predicate.left) !== evaluatePredicate(n, predicate.right);
  }
}
export function describePredicate(predicate: Predicate): string {
  switch (predicate.kind) {
    case 'multiple': return `n mod ${predicate.divisor} = 0`;
    case 'residue': return `n mod ${predicate.modulus} = ${predicate.remainder}`;
    case 'square': return '√n ∈ ℤ';
    case 'cube': return '∛n ∈ ℤ';
    case 'prime': return 'n is prime';
    default: {
      const operator = { and: 'AND', or: 'OR', difference: 'AND NOT', xor: 'XOR' }[predicate.kind];
      return `(${describePredicate(predicate.left)}) ${operator} (${describePredicate(predicate.right)})`;
    }
  }
}
/** Visible-domain neighbors only; callers may display the absent relationships as a count. */
export function relatedIntegerIds(selected: number, points: readonly IntegerPoint[], relation: 'divisors' | 'multiples'): string[] {
  return points.filter(p => p.n !== selected && (relation === 'divisors' ? selected % p.n === 0 : p.n % selected === 0)).map(p => p.id);
}

/** A deliberately small predicate language, not a JavaScript or Sage code evaluator.
 * Supports n % k == r, n mod k = r, is_square(n), is_cube(n), is_prime(n).
 * Boolean composition uses the typed AST rather than ambiguous text precedence. */
export function parsePredicate(expression: string): Predicate {
  const source = expression.trim();
  const special = /^is_(square|cube|prime)\s*\(\s*n\s*\)$/.exec(source);
  if (special) return { kind: special[1] as 'square' | 'cube' | 'prime' };
  const modular = /^n\s*(?:%|mod)\s*(\d+)\s*={1,2}\s*(\d+)$/.exec(source);
  if (modular) {
    const modulus = Number(modular[1]), remainder = Number(modular[2]);
    const predicate: Predicate = remainder === 0 ? { kind: 'multiple', divisor: modulus } : { kind: 'residue', modulus, remainder };
    if (validatePredicate(predicate)) return predicate;
    throw new Error(`Use a modulus from 1 to ${MAX_INTEGER_VALUE} and a remainder smaller than the modulus.`);
  }
  throw new Error('Use n % k == r, is_square(n), is_cube(n), or is_prime(n).');
}
