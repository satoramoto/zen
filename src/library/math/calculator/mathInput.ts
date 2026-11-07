import { ComputeEngine } from '@cortex-js/compute-engine';
import { compileExpressions, ExpressionError } from './expression';
// Parse only. Evaluation remains in Zen's bounded expression interpreter.
const engine = new ComputeEngine();
for (const name of ['f', 'g', 'h']) engine.declare(name, 'function');
const functions: Record<string, string> = { Sin: 'sin', Cos: 'cos', Tan: 'tan', Abs: 'abs', Sqrt: 'sqrt', Exp: 'exp', Ln: 'log', Floor: 'floor', Ceil: 'ceil', f: 'f', g: 'g', h: 'h' };
/** Allowlisted MathJSON adapter; no symbolic simplification or evaluation of editor input. */
export function latexExpression(latex: string): string {
  if (latex.length > 1200) throw new ExpressionError('This equation is getting long. Try splitting it between functions.');
  let remaining = 150;
  function convert(node: unknown): string {
    if (--remaining < 0) throw new ExpressionError('This equation is too complex for this workspace.');
    if (typeof node === 'number' && Number.isFinite(node)) return String(node);
    if (typeof node === 'string') {
      if (node === 'Pi') return 'pi'; if (node === 'ExponentialE') return 'e';
      if (/^[a-z]$/.test(node)) return node;
      throw new ExpressionError('Use single-letter quantities, x, t, pi, or e.');
    }
    if (node && typeof node === 'object' && !Array.isArray(node) && 'num' in node) {
      const value = Number(node.num); if (Number.isFinite(value)) return String(value);
    }
    if (!Array.isArray(node) || typeof node[0] !== 'string') throw new ExpressionError('Finish the highlighted part of your equation.');
    const [operation, ...args] = node;
    if (operation === 'Error' || operation === 'Sequence') throw new ExpressionError('Finish the fraction, bracket, or missing value.');
    if (operation === 'Delimiter' && args.length === 1) return convert(args[0]);
    if (operation === 'Negate' && args.length === 1) return `(-${convert(args[0])})`;
    if (Object.hasOwn(functions, operation) && args.length === 1) return `${functions[operation]}(${convert(args[0])})`;
    // Conventional printed log is base ten; Zen's source log() is natural logarithm.
    if (operation === 'Log' && args.length === 1) return `(log(${convert(args[0])})/log(10))`;
    const operators: Record<string, string> = { Add: '+', Subtract: '-', Multiply: '*', InvisibleOperator: '*', Divide: '/', Power: '^' };
    if (Object.hasOwn(operators, operation) && args.length >= 2 && (['Add', 'Multiply', 'InvisibleOperator'].includes(operation) || args.length === 2)) return `(${args.map(convert).join(operators[operation])})`;
    throw new ExpressionError(`This workspace cannot plot ${operation} yet. Try a wave, fraction, power, or root.`);
  }
  const result = convert(engine.parse(latex.replace(/\\[,;:!]/g, ' '), { form: 'raw' }).json);
  // Syntax/size validation without imposing the caller's function-dependency graph.
  compileExpressions({ f: '0', g: '0', h: result.replace(/\b[fgh]\(/g, 'sin(') });
  return result;
}
