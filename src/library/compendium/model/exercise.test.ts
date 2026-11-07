import { describe, expect, it } from 'vitest';
import { checkAnswer, exact, numeric } from './exercise';

describe('exact', () => {
  it('ignores case, spacing and surrounding punctuation, and takes alternatives', () => {
    expect(exact('  A Perfect Fifth. ', 'perfect fifth|a perfect fifth|fifth', {})).toEqual({ correct: true });
    expect(exact('“fifth”', 'perfect fifth|fifth', {})).toEqual({ correct: true });
    expect(exact('fourth', 'perfect fifth|fifth', {})).toEqual({ correct: false });
  });
  it('asks for an answer when there is none', () => {
    expect(exact('   ', 'x', {}).feedback).toMatch(/type an answer/i);
  });
});

describe('numeric', () => {
  it('parses a number, with thousands separators, and compares exactly by default', () => {
    expect(numeric('4', '4', {})).toEqual({ correct: true });
    expect(numeric('1,000', '1000', {})).toEqual({ correct: true });
    expect(numeric('5', '4', {})).toEqual({ correct: false });
  });
  it('allows a tolerance and says when the answer is near it', () => {
    expect(numeric('14.38', '14.39', { tolerance: 0.01 })).toEqual({ correct: true });
    expect(numeric('14.42', '14.39', { tolerance: 0.01 })).toMatchObject({ correct: false, feedback: expect.stringMatching(/close/i) });
    expect(numeric('20', '14.39', { tolerance: 0.01 })).toEqual({ correct: false });
  });
  it('refuses what is not a number', () => {
    expect(numeric('four', '4', {}).feedback).toMatch(/type a number/i);
    expect(numeric('', '4', {}).feedback).toMatch(/type a number/i);
  });
});

describe('checkAnswer', () => {
  it('finds the checker in the page registry, then the built-ins, and names a missing one', () => {
    const registry = { parity: (given: string, expect: string) => ({ correct: (Number(given) % 2 === 0) === (expect === 'even') }) };
    expect(checkAnswer(registry, 'parity', '6', 'even')).toEqual({ correct: true });
    expect(checkAnswer(registry, 'numeric', '6', '6')).toEqual({ correct: true });
    expect(checkAnswer(registry, 'algebra', 'x', 'x').feedback).toMatch(/no checker “algebra”/i);
  });
});
