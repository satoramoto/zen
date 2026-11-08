// Checking an exercise's answer. A checker compares what the reader typed with what the block
// expects, in its own terms; the page's registry maps a block's `check` name to one. The two
// here know nothing but strings and numbers; a checker that understands mathematics (an
// expression equal to another) is registered by the page from the math area.

export interface Verdict {
  correct: boolean;
  /** What to tell the reader beyond right or wrong: "Not a number", "Close: within 0.5". */
  feedback?: string;
}

/** What a block hands its checker besides the answer: a tolerance, and anything else the block names. */
export type CheckOptions = { tolerance?: number } & Record<string, unknown>;

export interface Checker {
  (given: string, expect: string, options: CheckOptions): Verdict;
}

export type CheckerRegistry = Record<string, Checker>;

/** Whitespace collapsed, case folded, surrounding punctuation dropped. */
const normalise = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:!?'"“”‘’]+|[\s.,;:!?'"“”‘’]+$/g, '');

/** The answer is one of the expected alternatives (`a|b|c`), spelling aside from case and spacing. */
export const exact: Checker = (given, expect) => {
  const g = normalise(given);
  if (!g) return { correct: false, feedback: 'Type an answer first.' };
  const alternatives = expect.split('|').map(normalise);
  return { correct: alternatives.includes(g) };
};

/** A number parsed from the answer, within `tolerance` of the expected one (default exact). */
export const numeric: Checker = (given, expect, { tolerance = 0 }) => {
  const g = Number(given.trim().replace(/,/g, ''));
  if (given.trim() === '' || Number.isNaN(g)) return { correct: false, feedback: 'Type a number.' };
  const e = Number(expect);
  const off = Math.abs(g - e);
  if (off <= tolerance + 1e-12) return { correct: true };
  if (tolerance > 0 && off <= tolerance * 4) return { correct: false, feedback: 'Close, but not within the tolerance.' };
  return { correct: false };
};

export const builtinCheckers: CheckerRegistry = { exact, numeric };

/**
 * Check an answer with the registry: the block's checker by name, with the built-in ones
 * underneath. An unknown checker is a verdict too, so a mistyped name shows in the page.
 */
export function checkAnswer(
  registry: CheckerRegistry,
  check: string,
  given: string,
  expect: string,
  options: CheckOptions = {},
): Verdict {
  const checker = registry[check] ?? builtinCheckers[check];
  if (!checker) return { correct: false, feedback: `No checker “${check}” on this page.` };
  return checker(given, expect, options);
}

/** Which exercises have been answered correctly, by id. */
export type Progress = Record<string, boolean>;
