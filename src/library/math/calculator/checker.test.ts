import { describe, expect, it } from 'vitest';
import { expressionChecker, foldSpelling } from './checker';

describe('foldSpelling', () => {
  it('folds the common spellings to the grammar', () => {
    expect(foldSpelling('√3/2')).toBe('sqrt(3)/2');
    expect(foldSpelling('√(3)/2')).toBe('sqrt(3)/2');
    expect(foldSpelling('sin²x')).toBe('sin(x)^2');
    expect(foldSpelling('sin^2 x')).toBe('sin(x)^2');
    expect(foldSpelling('cos x')).toBe('cos(x)');
    expect(foldSpelling('2sin x')).toBe('2*sin(x)');
    expect(foldSpelling('2x + 1')).toBe('2*x + 1');
    expect(foldSpelling('(x+1)(x-1)')).toBe('(x+1)*(x-1)');
    expect(foldSpelling('π/3')).toBe('pi/3');
    expect(foldSpelling('2π')).toBe('2*pi');
    expect(foldSpelling('cos(θ)')).toBe('cos(x)');
    expect(foldSpelling('sin(theta) × 2')).toBe('sin(x) * 2');
    expect(foldSpelling('3 ÷ t', 't')).toBe('3 / x');
  });
});

describe('expressionChecker', () => {
  it('takes an exact value in any spelling', () => {
    for (const given of ['sqrt(3)/2', '√3/2', 'sqrt(3) / 2', '0.8660254', 'cos(30*pi/180)', 'sin(π/3)'])
      expect(expressionChecker(given, 'sqrt(3)/2', { tolerance: 1e-6 }), given).toEqual({ correct: true });
    expect(expressionChecker('0.86', 'sqrt(3)/2')).toEqual({ correct: false });
    expect(expressionChecker('1/2', 'sqrt(3)/2')).toEqual({ correct: false });
  });
  it('takes an identity in a variable, and refuses a near miss', () => {
    const over = { variable: 'x', range: [0, 2 * Math.PI] as [number, number] };
    expect(expressionChecker('cos(x)^2', '1 - sin(x)^2', over)).toEqual({ correct: true });
    expect(expressionChecker('cos²x', '1 - sin²x', over)).toEqual({ correct: true });
    expect(expressionChecker('cos(x)', '1 - sin(x)^2', over)).toEqual({ correct: false });
    expect(expressionChecker('2 sin x cos x', 'sin(2x)', over)).toEqual({ correct: true });
    expect(expressionChecker('sin(2θ)', 'sin(2x)', { variable: 'theta' })).toEqual({ correct: true });
  });
  it('compares at one point when asked', () => {
    expect(expressionChecker('x^2', '4', { variable: 'x', at: 2 })).toEqual({ correct: true });
    expect(expressionChecker('x^2', '4', { variable: 'x', at: 3 })).toEqual({ correct: false });
  });
  it('skips the poles of tangent and refuses an everywhere-undefined answer', () => {
    expect(expressionChecker('sin(x)/cos(x)', 'tan(x)', { variable: 'x', range: [0, Math.PI] })).toEqual({ correct: true });
    expect(expressionChecker('1/cos(x)', 'tan(x)', { variable: 'x', range: [0, Math.PI] })).toEqual({ correct: false });
    expect(expressionChecker('1/0', '1/0')).toMatchObject({ correct: false, feedback: expect.stringMatching(/undefined/) });
  });
  it('says so when it cannot read the answer, and never throws', () => {
    expect(expressionChecker('', '1')).toEqual({ correct: false, feedback: 'Type an expression first.' });
    expect(expressionChecker('sin(', '1')).toMatchObject({ correct: false, feedback: expect.stringMatching(/Couldn’t read that/) });
    expect(expressionChecker('y + 1', '2')).toMatchObject({ correct: false, feedback: expect.stringMatching(/Unknown name “y”/) });
    expect(expressionChecker('foo(1)', '1')).toMatchObject({ correct: false, feedback: expect.stringMatching(/Couldn’t read that/) });
    expect(expressionChecker('1', 'sin(')).toMatchObject({ correct: false, feedback: expect.stringMatching(/expected answer/) });
  });
});
