/** Small, bounded expression language. It never executes JavaScript or accesses objects. */
export const functionNames = ['f', 'g', 'h'] as const;
export type FunctionName = typeof functionNames[number];
export type Equations = Record<FunctionName, string>;
export type ExpressionNode = { kind: 'number'; value: number } | { kind: 'name'; name: string } |
  { kind: 'unary'; sign: number; value: ExpressionNode } |
  { kind: 'binary'; op: string; left: ExpressionNode; right: ExpressionNode } |
  { kind: 'call'; name: string; argument: ExpressionNode };
const builtins: Record<string, (x: number) => number> = Object.assign(Object.create(null), {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, sqrt: Math.sqrt,
  exp: Math.exp, log: Math.log, floor: Math.floor, ceil: Math.ceil,
});
export class ExpressionError extends Error {
  constructor(message: string, public equation?: FunctionName) { super(message); }
}
function parse(source: string): { tree: ExpressionNode; parameters: Set<string>; dependencies: Set<FunctionName> } {
  if (source.length > 240) throw new ExpressionError('Keep each expression under 240 characters.');
  const tokens: string[] = []; let offset = 0;
  while (offset < source.length) {
    if (/\s/.test(source[offset])) { offset++; continue; }
    const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|^[a-z]+|^[+\-*/^()]/.exec(source.slice(offset));
    if (!match) throw new ExpressionError(`Unexpected character “${source[offset]}”. Use explicit * for multiplication.`);
    tokens.push(match[0]); offset += match[0].length;
  }
  if (tokens.length > 100) throw new ExpressionError('This expression is too complex (100 tokens maximum).');
  let at = 0;
  const parameters = new Set<string>(), dependencies = new Set<FunctionName>();
  const peek = () => tokens[at];
  const take = () => tokens[at++];
  function atom(): ExpressionNode {
    const token = take();
    if (!token) throw new ExpressionError('Finish the expression.');
    if (token === '(') { const value = sum(); if (take() !== ')') throw new ExpressionError('Close the parentheses.'); return value; }
    if (/^(?:\d|\.)/.test(token)) {
      const value = Number(token); if (!Number.isFinite(value)) throw new ExpressionError('Use a finite number.');
      return { kind: 'number', value };
    }
    if (/^[a-z]+$/.test(token)) {
      if (peek() === '(') {
        if (!Object.hasOwn(builtins, token) && !functionNames.includes(token as FunctionName)) throw new ExpressionError(`Unknown function “${token}”.`);
        take(); const argument = sum(); if (take() !== ')') throw new ExpressionError('Close the function parentheses.');
        if (functionNames.includes(token as FunctionName)) dependencies.add(token as FunctionName);
        return { kind: 'call', name: token, argument };
      }
      if (['f', 'g', 'h'].includes(token) || Object.hasOwn(builtins, token)) throw new ExpressionError(`Use ${token}(x) to call a function.`);
      if (!['x', 't', 'pi', 'e'].includes(token)) {
        if (token.length !== 1) throw new ExpressionError('Parameters use one letter. Write products with *, such as a*x.');
        parameters.add(token);
      }
      return { kind: 'name', name: token };
    }
    throw new ExpressionError(`Expected a number, name, or parenthesis; found “${token}”.`);
  }
  function power(): ExpressionNode { const left = atom(); return peek() === '^' ? (take(), { kind: 'binary', op: '^', left, right: unary() }) : left; }
  function unary(): ExpressionNode { return ['+', '-'].includes(peek()) ? { kind: 'unary', sign: take() === '-' ? -1 : 1, value: unary() } : power(); }
  function product(): ExpressionNode { let left = unary(); while (['*', '/'].includes(peek())) left = { kind: 'binary', op: take(), left, right: unary() }; return left; }
  function sum(): ExpressionNode { let left = product(); while (['+', '-'].includes(peek())) left = { kind: 'binary', op: take(), left, right: product() }; return left; }
  const tree = sum();
  if (at !== tokens.length) throw new ExpressionError('Separate factors with *, and check your parentheses.');
  return { tree, parameters, dependencies };
}
export interface ExpressionProgram {
  equations: Equations;
  parameters: string[];
  parametersByFunction: Record<FunctionName, string[]>;
  evaluate(name: FunctionName, x: number, parameters: Readonly<Record<string, number>>, t?: number): number;
}
/** Compiles all definitions atomically and rejects circular function references. */
export function compileExpressions(equations: Equations): ExpressionProgram {
  const parsed = {} as Record<FunctionName, ReturnType<typeof parse>>;
  for (const name of functionNames) {
    try { parsed[name] = parse(equations[name]); }
    catch (error) { if (error instanceof ExpressionError) error.equation = name; throw error; }
  }
  const visit = (name: FunctionName, path: FunctionName[]) => {
    if (path.includes(name)) throw new ExpressionError(`Circular relationship: ${[...path, name].join(' → ')}.`, name);
    for (const dependency of parsed[name].dependencies) visit(dependency, [...path, name]);
  };
  for (const name of functionNames) visit(name, []);
  const parameters = [...new Set(functionNames.flatMap(name => [...parsed[name].parameters]))].sort();
  if (parameters.length > 8) throw new ExpressionError('Use at most eight parameters in this workspace.');
  const linkedParameters = (name: FunctionName): string[] => [...new Set([...parsed[name].parameters, ...[...parsed[name].dependencies].flatMap(linkedParameters)])].sort();
  return {
    parametersByFunction: Object.fromEntries(functionNames.map(name => [name, linkedParameters(name)])) as Record<FunctionName, string[]>,
    equations: { ...equations }, parameters,
    evaluate(name, x, values, t = 0) {
      let budget = 4096;
      function evaluate(node: ExpressionNode, xValue: number): number {
        if (--budget < 0) return NaN;
        switch (node.kind) {
          case 'number': return node.value;
          case 'name': return node.name === 'x' ? xValue : node.name === 't' ? t : node.name === 'pi' ? Math.PI : node.name === 'e' ? Math.E : values[node.name] ?? 1;
          case 'unary': return node.sign * evaluate(node.value, xValue);
          case 'call': {
            const value = evaluate(node.argument, xValue);
            return Object.hasOwn(builtins, node.name) ? builtins[node.name](value) : evaluate(parsed[node.name as FunctionName].tree, value);
          }
          case 'binary': {
            const a = evaluate(node.left, xValue), b = evaluate(node.right, xValue);
            switch (node.op) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return a / b; default: return a ** b; }
          }
        }
      }
      const result = evaluate(parsed[name].tree, x);
      return Number.isFinite(result) ? result : NaN;
    },
  };
}
export type CurvePoint = [number, number];
/** Fixed domain, bounded work. Gaps and steep unresolved intervals are not connected. */
export function sampleCurve(evaluate: (x: number) => number, domain: [number, number] = [-Math.PI * 2, Math.PI * 2]): CurvePoint[][] {
  const paths: CurvePoint[][] = []; let path: CurvePoint[] = [];
  const valid = (y: number) => Number.isFinite(y) && Math.abs(y) <= 12;
  const finish = () => { if (path.length > 1) paths.push(path); path = []; };
  for (let i = 0; i <= 640; i++) {
    const x = domain[0] + (domain[1] - domain[0]) * i / 640, y = evaluate(x);
    if (!valid(y)) { finish(); continue; }
    const previous = path.at(-1);
    if (previous) {
      const middle = evaluate((previous[0] + x) / 2);
      if (!valid(middle) || Math.abs(y - previous[1]) > .6 || Math.abs(middle - (previous[1] + y) / 2) > .2) finish();
    }
    path.push([x, y]);
  }
  finish(); return paths;
}

/** Typeset the supported source grammar without changing its mathematical grouping. */
export function expressionLatex(source: string): string {
  const wrap = (value: string) => `\\left(${value}\\right)`;
  function render(node: ExpressionNode, parent = 0): string {
    if (node.kind === 'number') { const text = String(node.value), formatted = text.replace(/e([+-]?\d+)/i, '\\times 10^{$1}'); return /e/i.test(text) && parent > 2 ? wrap(formatted) : formatted; }
    if (node.kind === 'name') return node.name === 'pi' ? '\\pi' : node.name;
    if (node.kind === 'call') {
      const arg = render(node.argument);
      if (node.name === 'exp') { const power = `e^{${arg}}`; return parent > 4 ? wrap(power) : power; }
      if (node.name === 'sqrt') return `\\sqrt{${arg}}`;
      if (node.name === 'abs') return `\\left|${arg}\\right|`;
      if (node.name === 'floor') return `\\lfloor ${arg}\\rfloor`;
      if (node.name === 'ceil') return `\\lceil ${arg}\\rceil`;
      return `${functionNames.includes(node.name as FunctionName) ? node.name : `\\${node.name === 'log' ? 'ln' : node.name}`}${wrap(arg)}`;
    }
    if (node.kind === 'unary') { const value = `${node.sign < 0 ? '-' : '+'}${render(node.value, 3)}`; return parent > 3 ? wrap(value) : value; }
    if (node.op === '/') return `\\frac{${render(node.left)}}{${render(node.right)}}`;
    const precedence = node.op === '^' ? 4 : node.op === '*' ? 2 : 1;
    const value = node.op === '^' ? `${render(node.left, 5)}^{${render(node.right)}}` : `${render(node.left, precedence)}${node.op === '*' ? '\\,' : node.op}${render(node.right, precedence + (node.op === '-' ? 1 : 0))}`;
    return parent > precedence ? wrap(value) : value;
  }
  return render(parse(source).tree);
}

/** Parsed structure for selection and semantics-preserving transformations. */
export function expressionTree(source: string): ExpressionNode { return parse(source).tree; }
