// CodeImage's model: a text as a QR code's modules, and the tree that draws them. No framework:
// `CodeImage.tsx` (React) and `CodeImage.svelte` (Svelte) both pass `codeImageView` to their `Tree`.
//
// The encoder is the standard's byte mode at error correction level M, versions 1 to 10: enough
// for an address (213 bytes) and small enough to keep here, with no dependency.
import { h, type Node } from '../../foundation/view/Tree.model';

export interface CodeImageModelProps {
  /** What the code says: an address, usually. More than `CODE_IMAGE_MAX_BYTES` bytes of UTF-8 draws nothing. */
  text: string;
  /** What it is, for assistive tech. Default: "Code for" and the text. */
  label?: string;
  /** Classes added after the component's own. */
  className?: string;
}

/** The longest text a code can hold, in bytes of UTF-8. */
export const CODE_IMAGE_MAX_BYTES = 213;
/** The clear margin around the modules, in modules, on every side: what a scanner needs. */
export const CODE_IMAGE_MARGIN = 4;

// Level M, by version (index 0 unused): codewords in all, error correction codewords per block, blocks.
const TOTAL = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
const EC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const ALIGN: number[][] = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const dataCodewords = (version: number) => TOTAL[version] - EC_PER_BLOCK[version] * BLOCKS[version];
const countBits = (version: number) => (version < 10 ? 8 : 16);
const capacity = (version: number) => Math.floor((dataCodewords(version) * 8 - 4 - countBits(version)) / 8);

/** A text as bytes of UTF-8. */
function utf8(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

// Arithmetic in the field the standard uses (GF(256), polynomial 0x11D).
function multiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}
function divisor(degree: number): number[] {
  const result = Array.from({ length: degree }, () => 0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = multiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = multiply(root, 2);
  }
  return result;
}
function remainder(data: number[], div: number[]): number[] {
  const result = div.map(() => 0);
  for (const b of data) {
    const factor = b ^ result.shift()!;
    result.push(0);
    div.forEach((coef, i) => (result[i] ^= multiply(coef, factor)));
  }
  return result;
}

/** The data with its error correction, block by block, in the order the standard lays them down. */
function codewords(bytes: number[], version: number): number[] {
  const capacityBits = dataCodewords(version) * 8;
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(4, 4); // byte mode
  put(bytes.length, countBits(version));
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, capacityBits - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((n, b) => (n << 1) | b, 0));

  const blocks = BLOCKS[version];
  const ec = EC_PER_BLOCK[version];
  const short = Math.floor(TOTAL[version] / blocks) - ec;
  const long = TOTAL[version] % blocks;
  const div = divisor(ec);
  const parts: { data: number[]; ec: number[] }[] = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const part = data.slice(k, k + short + (i < blocks - long ? 0 : 1));
    k += part.length;
    parts.push({ data: part, ec: remainder(part, div) });
  }
  const out: number[] = [];
  for (let i = 0; i <= short; i++) for (const p of parts) if (i < p.data.length) out.push(p.data[i]);
  for (let i = 0; i < ec; i++) for (const p of parts) out.push(p.ec[i]);
  return out;
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** How badly a pattern would scan, by the standard's four rules: the mask with the least is used. */
function penalty(m: boolean[][]): number {
  const size = m.length;
  let result = 0;
  const lines = [m, m.map((_, x) => m.map((row) => row[x]))];
  for (const grid of lines) {
    for (const row of grid) {
      let run = 1;
      for (let i = 1; i <= size; i++) {
        if (i < size && row[i] === row[i - 1]) run++;
        else {
          if (run >= 5) result += run - 2;
          run = 1;
        }
      }
      // A finder's look-alike: dark, light, three dark, light, dark, with four light on either side.
      const s = row.map((d) => (d ? '1' : '0')).join('');
      for (const pattern of ['10111010000', '00001011101']) for (let at = s.indexOf(pattern); at >= 0; at = s.indexOf(pattern, at + 1)) result += 40;
    }
  }
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) result += 3;
  const dark = m.reduce((n, row) => n + row.filter(Boolean).length, 0);
  result += Math.floor(Math.abs((dark * 20) / (size * size) - 10)) * 10;
  return result;
}

/**
 * A text's code: a square of modules, `true` for a dark one, with no margin. `undefined` when the
 * text is empty or longer than a code here can hold.
 */
export function encodeCode(text: string): boolean[][] | undefined {
  const bytes = utf8(text);
  if (!bytes.length || bytes.length > CODE_IMAGE_MAX_BYTES) return undefined;
  let version = 1;
  while (capacity(version) < bytes.length) version++;
  const size = version * 4 + 17;
  const m = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const fixed = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const set = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    m[y][x] = dark;
    fixed[y][x] = true;
  };

  // Timing lines, the three finders with their light surround, the alignment squares.
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      set(cx + dx, cy + dy, d !== 2 && d !== 4);
    }
  }
  const align = ALIGN[version];
  align.forEach((cy, i) => align.forEach((cx, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));

  const format = (mask: number) => {
    const data = mask; // level M is 00 in the two high bits
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i: number) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  format(0);
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, dark);
      set(b, a, dark);
    }
  }

  // The codewords, in the standard's zigzag from the bottom right, two columns at a time.
  const data = codewords(bytes, version);
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fixed[y][x] && i < data.length * 8) {
          m[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }

  const apply = (mask: number) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fixed[y][x] && MASKS[mask](x, y)) m[y][x] = !m[y][x];
  };
  let best = 0;
  let least = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    apply(mask);
    format(mask);
    const p = penalty(m);
    if (p < least) {
      least = p;
      best = mask;
    }
    apply(mask);
  }
  apply(best);
  format(best);
  return m;
}

/** The dark modules as one SVG path, a unit square each, runs along a row joined. */
export function codePath(modules: boolean[][], margin = CODE_IMAGE_MARGIN): string {
  let d = '';
  modules.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      let end = x;
      while (end + 1 < row.length && row[end + 1]) end++;
      d += `M${x + margin} ${y + margin}h${end - x + 1}v1h-${end - x + 1}z`;
      x = end;
    }
  });
  return d;
}

/** The tree CodeImage draws: the code as an image on its light ground, or an empty, hidden mark when the text cannot be drawn. */
export function codeImageView({ text, label, className }: CodeImageModelProps): Node {
  const cls = ['lib-codeimage', className].filter(Boolean).join(' ');
  const modules = encodeCode(text);
  if (!modules) return h('span', { class: cls, 'data-part': 'root', 'data-empty': 'true', hidden: 'hidden' });
  const size = modules.length + CODE_IMAGE_MARGIN * 2;
  return h(
    'span',
    { class: cls, 'data-part': 'root', 'data-text': text, 'data-modules': String(modules.length), role: 'img', 'aria-label': label ?? `Code for ${text}` },
    h('svg', { viewBox: `0 0 ${size} ${size}`, 'shape-rendering': 'crispEdges', 'aria-hidden': 'true' }, h('rect', { 'data-part': 'ground', width: String(size), height: String(size) }), h('path', { 'data-part': 'modules', d: codePath(modules) })),
  );
}
