// The slice of Markdown an OpenSpec artifact uses: headings, paragraphs, bullet and numbered
// lists (with task boxes), fenced code, and inline code, emphasis and links. Comments are dropped.
// Pure: a string in, blocks out.

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] }
  | { kind: 'link'; text: string; href: string };

export interface ListItem {
  children: Inline[];
  /** Set for a task box: `- [ ]` or `- [x]`. */
  checked?: boolean;
  /** Nesting, 0 at the margin. */
  depth: number;
}

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string; children: Inline[] }
  | { kind: 'paragraph'; children: Inline[] }
  | { kind: 'list'; ordered: boolean; items: ListItem[] }
  | { kind: 'code'; text: string; language?: string }
  | { kind: 'quote'; children: Inline[] };

/** Inline Markdown: code spans, bold, italics and links, in that precedence. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  let buf = '';
  const flush = () => {
    if (buf) out.push({ kind: 'text', text: buf });
    buf = '';
  };
  while (i < text.length) {
    const rest = text.slice(i);
    let m: RegExpMatchArray | null;
    if ((m = rest.match(/^`([^`]+)`/))) {
      flush();
      out.push({ kind: 'code', text: m[1] });
      i += m[0].length;
    } else if ((m = rest.match(/^\*\*(.+?)\*\*/))) {
      flush();
      out.push({ kind: 'strong', children: parseInline(m[1]) });
      i += m[0].length;
    } else if ((m = rest.match(/^(?:\*|_)([^*_]+?)(?:\*|_)/))) {
      flush();
      out.push({ kind: 'em', children: parseInline(m[1]) });
      i += m[0].length;
    } else if ((m = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/))) {
      flush();
      out.push({ kind: 'link', text: m[1], href: m[2] });
      i += m[0].length;
    } else {
      buf += text[i];
      i++;
    }
  }
  flush();
  return out;
}

/** The plain words of inline content. */
export const plain = (inline: Inline[]): string =>
  inline.map((n) => (n.kind === 'text' || n.kind === 'code' ? n.text : n.kind === 'link' ? n.text : plain(n.children))).join('');

const stripComments = (s: string) => s.replace(/<!--[\s\S]*?-->/g, '');

/** Markdown to blocks. */
export function parseMarkdown(source: string): Block[] {
  const lines = stripComments(source).replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  let para: string[] = [];
  const flushPara = () => {
    const text = para.join(' ').trim();
    if (text) blocks.push({ kind: 'paragraph', children: parseInline(text) });
    para = [];
  };
  while (i < lines.length) {
    const line = lines[i];
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/))) {
      flushPara();
      const text = m[2].trim();
      blocks.push({ kind: 'heading', level: m[1].length as Block extends { level: infer L } ? L : never, text, children: parseInline(text) });
      i++;
    } else if ((m = line.match(/^```(\w*)\s*$/))) {
      flushPara();
      const language = m[1] || undefined;
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++;
      blocks.push({ kind: 'code', text: code.join('\n'), language });
    } else if ((m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/))) {
      flushPara();
      const ordered = /\d/.test(m[2]);
      const items: ListItem[] = [];
      while (i < lines.length) {
        const im = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        // A list of the other kind at the margin is a new list.
        if (im && !im[1] && /\d/.test(im[2]) !== ordered) break;
        if (!im) {
          // A wrapped continuation line belongs to the last item.
          if (items.length && /^\s{2,}\S/.test(lines[i]) && lines[i].trim()) {
            const last = items[items.length - 1];
            last.children = parseInline(plain(last.children) + ' ' + lines[i].trim());
            i++;
            continue;
          }
          break;
        }
        const depth = Math.floor(im[1].replace(/\t/g, '  ').length / 2);
        let body = im[3];
        let checked: boolean | undefined;
        const task = body.match(/^\[([ xX])\]\s+(.*)$/);
        if (task) {
          checked = task[1] !== ' ';
          body = task[2];
        }
        items.push({ children: parseInline(body), checked, depth });
        i++;
      }
      blocks.push({ kind: 'list', ordered, items });
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara();
      const quote: string[] = [m[1]];
      i++;
      while (i < lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push({ kind: 'quote', children: parseInline(quote.join(' ').trim()) });
    } else if (!line.trim()) {
      flushPara();
      i++;
    } else {
      para.push(line.trim());
      i++;
    }
  }
  flushPara();
  return blocks;
}

/** The blocks under a heading, up to the next heading of the same or a higher level. */
export function section(blocks: Block[], level: number, match: (text: string) => boolean): Block[] {
  const start = blocks.findIndex((b) => b.kind === 'heading' && b.level === level && match(b.text));
  if (start < 0) return [];
  const body: Block[] = [];
  for (const b of blocks.slice(start + 1)) {
    if (b.kind === 'heading' && b.level <= level) break;
    body.push(b);
  }
  return body;
}

/** Each heading of `level` in `blocks` with what follows it, up to the next heading at or above that level. */
export function sections(blocks: Block[], level: number): { heading: string; body: Block[] }[] {
  const out: { heading: string; body: Block[] }[] = [];
  let current: { heading: string; body: Block[] } | null = null;
  for (const b of blocks) {
    if (b.kind === 'heading' && b.level <= level) {
      current = b.level === level ? { heading: b.text, body: [] } : null;
      if (current) out.push(current);
      continue;
    }
    current?.body.push(b);
  }
  return out;
}
