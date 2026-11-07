import { describe, expect, it } from 'vitest';
import { expressionLatex, compileExpressions } from './expression';
import { latexExpression } from './mathInput';
const value = (source: string, x = 1.2) => compileExpressions({ f: source, g: '0', h: 'f(x)' }).evaluate('h', x, { a: 1.4, b: .7, d: .3, k: .4 }, .5);
describe('typeset expression bridge', () => {
  it('preserves arithmetic grouping, constants and function semantics on a round trip', () => {
    for (const source of ['a*sin(b*x-t)', '(x+2)/(x-3)', '(x^2)^3', '-x^2', '(-x)^2', '2^-x', '2^3^2', 'sqrt(abs(x))', 'exp(-k*abs(x))', 'log(x)', 'floor(x)+ceil(x)', 'pi*x', '1e-7*x', 'exp(x)^2', 'sin(x)^2', '(x/2)^2', '(1e-7)^2']) {
      expect(value(latexExpression(expressionLatex(source))), source).toBeCloseTo(value(source), 9);
    }
  });
  it('accepts implicit multiplication and composed user functions', () => {
    const source = latexExpression('a\\sin(bx-t)'); expect(value(source)).toBeCloseTo(value('a*sin(b*x-t)'));
    const program = compileExpressions({ f: 'sin(x)', g: latexExpression('\\frac{f(2x)}{2}'), h: 'g(x)' });
    expect(program.evaluate('h', .4, {})).toBeCloseTo(Math.sin(.8)/2);
  });
  it('distinguishes conventional log and ln and preserves undefined domains', () => {
    expect(value(latexExpression('\\log(100)'))).toBeCloseTo(2);
    expect(value(latexExpression('\\ln(e)'))).toBeCloseTo(1);
    expect(value(latexExpression('\\frac{0}{0}'))).toBeNaN();
  });
  it('rejects incomplete and unsupported math rather than silently simplifying it', () => {
    for (const latex of ['\\frac{x}{}', 'x+', '\\int x \\, dx', 'x=2', '\\sqrt[3]{x}', '\\alpha', 'x'.repeat(1201)]) expect(() => latexExpression(latex), latex).toThrow();
  });
});
