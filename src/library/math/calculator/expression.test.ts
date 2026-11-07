import { describe, expect, it } from 'vitest';
import { compileExpressions, sampleCurve } from './expression';
const evaluate = (f: string) => compileExpressions({ f, g: '0', h: 'f(x)' }).evaluate('h', 2, {});
describe('calculator expressions', () => {
  it('uses mathematical exponent precedence and right associativity', () => {
    expect(evaluate('-2^2')).toBe(-4); expect(evaluate('2^-2')).toBe(.25); expect(evaluate('2^3^2')).toBe(512);
    expect(evaluate('(1 + 2)*3 - 4/2')).toBe(7); expect(evaluate('1e-2')).toBe(.01);
  });
  it('composes functions with their own x and shares parameters and time', () => {
    const program = compileExpressions({ f: 'a*sin(b*x-t)', g: 'f(2*x)', h: 'f(x)+g(x)' });
    expect(program.parameters).toEqual(['a', 'b']);
    expect(program.parametersByFunction.g).toEqual(['a', 'b']);
    expect(program.parametersByFunction.h).toEqual(['a', 'b']);
    expect(program.evaluate('h', Math.PI/2, { a: 2, b: 1 })).toBeCloseTo(2);
    expect(program.evaluate('g', 0, { a: 2, b: 1 }, Math.PI/2)).toBeCloseTo(-2);
  });
  it('rejects circular dependencies, unsupported syntax and excessive work', () => {
    for (const f of ['g(x)', 'window.x', 'constructor(x)', '2x', 'sin(', '', '1e999', 'a'.repeat(241)]) {
      expect(() => compileExpressions({ f, g: 'f(x)', h: '0' })).toThrow();
    }
    expect(() => compileExpressions({f:'a+b+c+d+i+j+k+l+m',g:'0',h:'0'})).toThrow(/eight/);
  });
  it('bounds nested evaluation work', () => {
    const program = compileExpressions({ f: Array(40).fill('x').join('+'), g: Array(20).fill('f(x)').join('+'), h: Array(20).fill('g(x)').join('+') });
    expect(program.evaluate('h', 1, {})).toBeNaN();
  });
  it('leaves undefined values undefined and does not bridge a pole or jump', () => {
    expect(evaluate('sqrt(-1)')).toBeNaN(); expect(evaluate('1/0')).toBeNaN();
    const paths = sampleCurve(x => 1/(x-.017));
    expect(paths.length).toBeGreaterThan(1);
    expect(paths.every(path => !(path[0][0] < .017 && path.at(-1)![0] > .017))).toBe(true);
    expect(sampleCurve(x => x < 0 ? -1 : 1).length).toBe(2);
    expect(sampleCurve(() => NaN)).toEqual([]);
  });
});
