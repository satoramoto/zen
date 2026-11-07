import { expressionTree, type ExpressionNode } from './expression';
export type TermPath = readonly ('left' | 'right' | 'value' | 'argument')[];
export type TermAction = 'half' | 'double' | 'flip' | 'repeat' | 'shift' | 'envelope';
export interface ExpressionTerm { key: string; path: TermPath; source: string; label: string; hasPosition: boolean; kind: ExpressionNode['kind'] }
/** Parentheses are deliberate: transformation never relies on string substitution or precedence guesses. */
export function termSource(node: ExpressionNode): string {
  switch (node.kind) {
    case 'number': return String(node.value);
    case 'name': return node.name;
    case 'call': return `${node.name}(${termSource(node.argument)})`;
    case 'unary': return `(${node.sign < 0 ? '-' : '+'}${termSource(node.value)})`;
    case 'binary': return `(${termSource(node.left)}${node.op}${termSource(node.right)})`;
  }
}
function children(node: ExpressionNode): [TermPath[number], ExpressionNode][] {
  return node.kind === 'binary' ? [['left', node.left], ['right', node.right]] : node.kind === 'call' ? [['argument', node.argument]] : node.kind === 'unary' ? [['value', node.value]] : [];
}
function hasPosition(node: ExpressionNode): boolean { return node.kind === 'name' && node.name === 'x' || children(node).some(([, child]) => hasPosition(child)); }
export function expressionTerms(source: string): ExpressionTerm[] {
  const result: ExpressionTerm[] = [];
  function visit(node: ExpressionNode, path: TermPath) {
    result.push({ key: path.join('.') || 'whole', path, source: termSource(node), kind: node.kind, hasPosition: hasPosition(node), label: !path.length ? 'Whole expression' : node.kind === 'call' ? `${node.name} function` : node.kind === 'number' ? `Number ${node.value}` : node.kind === 'name' ? node.name === 'x' ? 'x position' : node.name === 't' ? 't time' : ['pi', 'e'].includes(node.name) ? `${node.name} constant` : `${node.name} quantity` : node.kind === 'unary' ? 'Signed term' : ['+', '-'].includes(node.op) ? 'Sum / difference' : node.op === '^' ? 'Power' : node.op === '/' ? 'Fraction' : 'Product' });
    children(node).forEach(([key, child]) => visit(child, [...path, key]));
  }
  visit(expressionTree(source), []); return result;
}
function replaceAt(node: ExpressionNode, path: TermPath, transform: (node: ExpressionNode) => ExpressionNode): ExpressionNode {
  if (!path.length) return transform(node);
  const entry = children(node).find(([key]) => key === path[0]);
  if (!entry) throw new Error('That term has changed. Select it again.');
  return { ...node, [entry[0]]: replaceAt(entry[1], path.slice(1), transform) } as ExpressionNode;
}
function replacePosition(node: ExpressionNode, replacement: ExpressionNode): ExpressionNode {
  if (node.kind === 'name' && node.name === 'x') return replacement;
  return children(node).reduce((result, [key, child]) => ({ ...result, [key]: replacePosition(child, replacement) }), node);
}
export const termActions: Record<TermAction, { label: string; detail: string }> = {
  half: { label: 'Half as large', detail: 'Divide only this term by 2.' },
  double: { label: 'Twice as large', detail: 'Multiply only this term by 2.' },
  flip: { label: 'Flip its sign', detail: 'Negate only this term.' },
  repeat: { label: 'Compress horizontally', detail: 'Replace x with 2x inside this term; distances from x = 0 halve.' },
  shift: { label: 'Shift right', detail: 'Replace x with x − 1 inside this term; its graph shifts right by one unit.' },
  envelope: { label: 'Fade from center', detail: 'Multiply this term by exp(−0.35|x|). The multiplier is 1 at zero and fades outward.' },
};
export function transformTerm(source: string, path: TermPath, action: TermAction): string {
  return termSource(replaceAt(expressionTree(source), path, node => {
    const source = termSource(node);
    if (action === 'repeat' || action === 'shift') {
      if (!hasPosition(node)) throw new Error('Choose a term containing x for this action.');
      return replacePosition(node, expressionTree(action === 'repeat' ? '2*x' : 'x-1'));
    }
    return expressionTree(action === 'half' ? `(${source})/2` : action === 'double' ? `2*(${source})` : action === 'flip' ? `-(${source})` : `(${source})*exp(-0.35*abs(x))`);
  }));
}
/** Structural match, with repeated occurrences returned separately for explicit disambiguation. */
export function matchingTerms(source: string, selected: string): ExpressionTerm[] {
  const signature = termSource(expressionTree(selected));
  return expressionTerms(source).filter(term => term.source === signature);
}
