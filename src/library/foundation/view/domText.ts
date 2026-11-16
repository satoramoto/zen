// A DOM as canonical text, for comparing what renderers draw (parity.ts, the DOM renderer's
// stories): tag names; every attribute (class as a sorted set of tokens, `style` as a sorted set
// of declarations, the rest by value); text, with adjacent text joined. Comments (anchors) and
// attribute order are not compared. `maskIds` replaces generated ids by their order of appearance.
// No test runner and no renderer here, so a story can use it in the browser.
const sortedTokens = (value: string, separator: RegExp) =>
  value
    .split(separator)
    .map((token) => token.trim())
    .filter(Boolean)
    .sort()
    .join(separator.source === ';' ? '; ' : ' ');

/** A node's DOM as canonical, indented text: one line per element and per run of text. */
export function serialize(node: Node, depth = 0): string {
  const pad = '  '.repeat(depth);
  const lines: string[] = [];
  let text = '';
  const flush = () => {
    if (text !== '') lines.push(`${pad}${JSON.stringify(text)}`);
    text = '';
  };
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    flush();
    const element = child as Element;
    const attrs = Array.from(element.attributes)
      .map(({ name, value }) => {
        if (name === 'class') return `class="${sortedTokens(value, /\s+/)}"`;
        if (name === 'style') return `style="${sortedTokens(value, /;/)}"`;
        return `${name}="${value}"`;
      })
      .sort();
    lines.push(`${pad}<${element.tagName.toLowerCase()}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`);
    const inner = serialize(element, depth + 1);
    if (inner) lines.push(inner);
  }
  flush();
  return lines.join('\n');
}

/** A generated id: React's `useId` forms whole, the DOM renderer's `«z1»`, or Svelte's `c1`/`s1` as an id or a `-`-separated part of one. */
const GENERATED_ID = /:[rR][0-9a-zA-Z]*:|«[rRz][0-9a-zA-Z]*»|_[rR]_[0-9a-zA-Z]*_|(?<![^\s"-])[cs]\d+(?![^\s"-])/g;
const ID_REFERENCE = / (id|for|aria-controls|aria-labelledby|aria-describedby)="([^"]*)"/g;

/** `dom` (serialized) with each distinct generated id replaced by `id<n>`, n its order of first appearance. */
export function maskIds(dom: string): string {
  const seen = new Map<string, string>();
  const mask = (id: string) => {
    if (!seen.has(id)) seen.set(id, `id${seen.size}`);
    return seen.get(id)!;
  };
  return dom.replace(ID_REFERENCE, (_, name: string, value: string) => ` ${name}="${value.replace(GENERATED_ID, mask)}"`);
}
