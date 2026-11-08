// An exercise checker for the compendium: the reader's answer and the expected answer as
// expressions in the bounded grammar of `expression.ts`, equal at a point or across a range.
// It knows nothing of the compendium's model: it meets `Checker` from `compendium/model/exercise`
// structurally (given, expect, options) so a page can register it by name.
import { ExpressionError, compileExpressions } from './expression';

export interface ExpressionVerdict {
  correct: boolean;
  feedback?: string;
}

export interface ExpressionOptions {
  /** How close the two values must be, relative to the larger magnitude (absolute when both are small). Default 1e-6. */
  tolerance?: number;
  /** The variable's name in the block's expressions ("theta", "x"); folded to `x` before parsing. Without one, the expressions are constants. */
  variable?: string;
  /** Compare at this one value of the variable. */
  at?: number;
  /** Compare at samples across this range (default 0 to 2π) when there is a variable and no `at`. */
  range?: [number, number];
  [key: string]: unknown;
}

/** Thirteen sample points at irrational-ish spacing: a wrong answer that agrees at nice points still fails. */
const SAMPLES = 13;
const samplesOver = ([a, b]: [number, number]) => Array.from({ length: SAMPLES }, (_, i) => a + (b - a) * ((i + 0.5 + 0.13 * Math.sin(i)) / SAMPLES));

/**
 * The common spellings a reader types, folded to the grammar: `√x` → `sqrt(x)`, `π` → `pi`,
 * `²`/`³` → `^2`/`^3`, `×`/`÷` → `*`/`/`, `sin x` and `sin²x` → `sin(x)` and `sin(x)^2`,
 * implicit multiplication (`2x`, `2(…)`, `)(`, `x(`), and the block's variable → `x`.
 */
export function foldSpelling(source: string, variable?: string): string {
  let s = source.trim().toLowerCase();
  if (variable) s = s.replace(new RegExp(`\\b${variable.toLowerCase()}\\b`, 'g'), 'x');
  s = s
    .replace(/θ|theta/g, 'x')
    .replace(/π/g, 'pi')
    .replace(/τ/g, '(2*pi)')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/√\s*([0-9.]+|[a-z]+)/g, 'sqrt($1)');
  // sin²x, sin^2 (x) → sin(x)^2, before any number is read as a factor.
  s = s.replace(/(sin|cos|tan|sqrt)\s*\^\s*([0-9]+)\s*\(([^()]*)\)/g, '$1($3)^$2');
  s = s.replace(/(sin|cos|tan|sqrt)\s*\^\s*([0-9]+)\s*([a-z0-9.]+)/g, '$1($3)^$2');
  // A number before a name or a parenthesis multiplies it: 2x, 2sin x, 2(…).
  s = s.replace(/(\d)\s*([a-z(])/g, '$1*$2');
  // sin x → sin(x).
  s = s.replace(/\b(sin|cos|tan|sqrt)\s+([a-z0-9.]+)/g, '$1($2)');
  // Implicit multiplication: a closing parenthesis before anything, x or pi before a parenthesis or a name.
  s = s.replace(/\)\s*([a-z0-9(])/g, ')*$1');
  s = s.replace(/\b(x|pi)\s*\(/g, '$1*(');
  s = s.replace(/\b(x|pi)\s+(x|pi|sin|cos|tan|sqrt)\b/g, '$1*$2');
  s = s.replace(/\bx(pi)\b/g, 'x*$1').replace(/\b(pi)x\b/g, '$1*x');
  return s;
}

const evaluator = (source: string) => {
  const program = compileExpressions({ f: source, g: '0', h: '0' });
  // The grammar reads an unknown letter as a parameter worth 1; an answer has no such thing.
  if (program.parameters.length) throw new ExpressionError(`Unknown name “${program.parameters[0]}”.`);
  return (x: number) => program.evaluate('f', x, {});
};

const close = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));

/**
 * The checker. Equal at `at`, or at samples across `range` when there is a variable, or as
 * constants; points where either side is not finite (tangent's poles) are skipped, and a case
 * where every point is skipped is wrong. A spelling the grammar cannot read is wrong with feedback.
 */
export function expressionChecker(given: string, expect: string, options: ExpressionOptions = {}): ExpressionVerdict {
  const { tolerance = 1e-6, variable, at, range = [0, 2 * Math.PI] } = options;
  if (!given.trim()) return { correct: false, feedback: 'Type an expression first.' };
  let f: (x: number) => number;
  let g: (x: number) => number;
  try {
    f = evaluator(foldSpelling(given, variable));
  } catch (e) {
    return { correct: false, feedback: `Couldn’t read that: ${e instanceof ExpressionError ? e.message : 'use numbers, + − × ÷ ^, sqrt, sin, cos, tan and pi.'}` };
  }
  try {
    g = evaluator(foldSpelling(expect, variable));
  } catch {
    return { correct: false, feedback: 'The expected answer could not be read; tell the author.' };
  }
  const points = at !== undefined ? [at] : variable ? samplesOver(range) : [0];
  let compared = 0;
  for (const x of points) {
    const a = f(x);
    const b = g(x);
    if (!Number.isFinite(a) && !Number.isFinite(b)) continue;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return { correct: false };
    compared++;
    if (!close(a, b, tolerance)) return { correct: false };
  }
  return compared > 0 ? { correct: true } : { correct: false, feedback: 'That is undefined everywhere it was checked.' };
}
