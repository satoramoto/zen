/**
 * The tier rules (docs/tiers.md) as a scanner: it counts each breach per folder so
 * `tiers.test.ts` can hold every count to its recorded baseline (`tiers.baseline.json`).
 * Pure node:fs and string work, no React.
 *
 * **What is scanned.** `src/library/{components,layout,yahaha,visuals,primitives}`: CSS, TSX and
 * TS files, except stories, tests, story/test data (`*.fixtures.ts`), `visuals/model/**` (logic
 * ported 1:1) and `visuals/fixtures/**`. `themes/` is never scanned: values live there. Comments
 * are stripped before matching (line numbers are kept).
 *
 * **Folders** (what counts are per): `components/<core|music>/<Name>`, `yahaha/<Name>`,
 * `visuals/<Name>`, `layout`, `primitives`. A file directly in a folder keys to that folder
 * (`yahaha/tokens.css` → `yahaha`, `components/core/hue.ts` → `components/core`).
 *
 * **pixels** (every folder but `primitives`). CSS: each `px` length in a declaration value
 * (custom properties included) whose absolute value isn't 0, 1 or 2. Media and container query
 * preludes aren't counted: variables can't be used there, and breakpoints are a Screen decision.
 * TS/TSX: each such `px` length anywhere in the stripped source, plus, inside `style={{ … }}`,
 * a bare number other than 0, 1 or 2 on a length key (width, height, padding, gap, top,
 * fontSize, …), which React reads as px.
 *
 * **margins** (`components/**`, the controls). A `margin*` declaration counts when its rule
 * targets the control's root block: some selector in the list is a single compound (no
 * descendant, child or sibling combinator outside brackets and parentheses) whose first class
 * has no `__` (`.yh-rackcell`, `.yh-pad[data-state='x']`, `.lib-x:hover`). Margins on inner
 * parts (`.yh-fader__cap`, `.yh-keys .black`) are the control's own business. All-zero values
 * (`0`, `0 0`, `0px`) are resets and pass.
 *
 * **painting** (Groups, Regions, Screens). `background*`, `box-shadow`, `backdrop-filter`,
 * `border`, `border-<side>*`, `border-color|style|width` (not `border-radius`,
 * `border-collapse`, `border-spacing`), unless the value is `none`, `0`, `transparent`,
 * `inherit`, `initial` or `unset`. Which rules count is {@link PAINTING_TIERS}.
 *
 * **knobs** (`components`, `layout`, `yahaha`, `visuals`). Each distinct `--yh-*` / `--vs-*`
 * custom property declared in a folder's CSS and not listed under a **Tuning knobs** heading in a
 * doc comment of a TSX file in the same directory (or, for a CSS file with no sibling TSX, in that
 * CSS file's own comments). The list runs to the next `**Heading**` or the comment's end; a
 * trailing `*` (`--yh-fader-*`) lists a family by prefix. A name counts once per folder.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type RuleId = 'pixels' | 'margins' | 'painting' | 'knobs';

/** Each rule and what to do instead. */
export const RULES: Record<RuleId, { fix: string }> = {
  pixels: {
    fix: 'use a scale step (var(--space-N), var(--control-h), var(--size-*)); pixels belong to tokens and primitives',
  },
  margins: { fix: "spacing belongs to the Group (gap), not a control's outer margin" },
  painting: { fix: "painting belongs to primitives (Surface) or the Region's own plate" },
  knobs: { fix: "declare it under **Tuning knobs** in the component's doc comment" },
};
export const RULE_IDS = Object.keys(RULES) as RuleId[];

/** The folders scanned, under `src/library`. */
export const TOP_FOLDERS = ['components', 'layout', 'yahaha', 'visuals', 'primitives'] as const;

/** Which top folders each rule applies to. */
export const RULE_FOLDERS: Record<RuleId, readonly string[]> = {
  pixels: ['components', 'layout', 'yahaha', 'visuals'],
  margins: ['components'],
  painting: ['layout', 'yahaha', 'visuals'],
  knobs: ['components', 'layout', 'yahaha', 'visuals'],
};

/**
 * How the painting rule reads each file.
 * - `all`: a Group/Stack/Screen file; every painting declaration counts.
 * - `region`: the Region; rules whose selectors are all the plate (`.lib-region`,
 *   `.lib-region__head`, with attribute/pseudo suffixes on that same compound) are its own plate
 *   and pass, others count.
 * - `none`: a primitive (Layer, the depth surface) or a control (Tabs); not counted.
 * - `app` (yahaha, visuals): a rule counts when any selector names a layout primitive's class
 *   (`.lib-screen`, `.lib-region`, `.lib-group`, `.lib-stack`, or their `__` parts) or
 *   `[data-part='region'|'group']`: that is the app's outer layout CSS. Other app CSS is widget CSS.
 * `components/**` and `primitives/**` are never counted. A layout file not listed reads as `all`.
 */
export const PAINTING_TIERS = {
  'layout/Group.css': 'all',
  'layout/Stack.css': 'all',
  'layout/Screen.css': 'all',
  'layout/Region.css': 'region',
  'layout/Layer.css': 'none',
  'layout/Tabs.css': 'none',
  'layout/*': 'all',
  'yahaha/**': 'app',
  'visuals/**': 'app',
  'components/**': 'none',
  'primitives/**': 'none',
} as const;
export type PaintingTier = (typeof PAINTING_TIERS)[keyof typeof PAINTING_TIERS];

export interface Finding {
  /** Relative to `src/library`. */
  file: string;
  /** 1-based. */
  line: number;
  rule: RuleId;
  snippet: string;
}

/* ---------- paths ---------- */

const top = (file: string) => file.split('/')[0];

/** The folder a file's counts belong to. */
export function folderOf(file: string): string {
  const parts = file.split('/');
  const t = parts[0];
  if (t === 'components') return parts.length >= 4 ? parts.slice(0, 3).join('/') : parts.slice(0, -1).join('/');
  if (t === 'yahaha' || t === 'visuals') return parts.length >= 3 ? parts.slice(0, 2).join('/') : t;
  return t;
}

const applies = (rule: RuleId, file: string) => RULE_FOLDERS[rule].includes(top(file));

export function paintingTier(file: string): PaintingTier {
  const t = top(file);
  if (t === 'yahaha' || t === 'visuals') return 'app';
  if (t === 'layout') return (PAINTING_TIERS as Record<string, PaintingTier>)[file] ?? 'all';
  return 'none';
}

/* ---------- comment stripping (keeps offsets: comments become spaces, newlines stay) ---------- */

const blank = (s: string) => s.replace(/[^\n]/g, ' ');

/** CSS without its comments. */
export function stripCssComments(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      const end = skipString(src, i);
      out += src.slice(i, end);
      i = end;
    } else if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      const end = close < 0 ? src.length : close + 2;
      out += blank(src.slice(i, end));
      i = end;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function skipString(src: string, i: number): number {
  const q = src[i];
  let j = i + 1;
  while (j < src.length && src[j] !== q) {
    if (src[j] === '\\') j++;
    else if (src[j] === '\n' && q !== '`') break;
    j++;
  }
  return Math.min(j + 1, src.length);
}

/** TS/TSX without its comments: strings, template literals and regex literals are kept whole. */
export function stripTsComments(src: string): string {
  let out = '';
  let i = 0;
  // Brace depth stack: a template's `${` pushes its depth so the matching `}` resumes the template.
  const templates: number[] = [];
  let depth = 0;
  let prev = ''; // last significant character, to tell a regex from a division
  const regexAfter = /[(,=:[!&|?{};+\-*%<>~^]/;
  const scanTemplate = () => {
    // From just inside a template (after ` or }), to its end or the next `${`.
    let j = i;
    while (j < src.length) {
      if (src[j] === '\\') j += 2;
      else if (src[j] === '`') {
        j++;
        break;
      } else if (src[j] === '$' && src[j + 1] === '{') {
        j += 2;
        templates.push(depth);
        depth++;
        break;
      } else j++;
    }
    out += src.slice(i, j);
    i = j;
    prev = '`';
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      const end = nl < 0 ? src.length : nl;
      out += blank(src.slice(i, end));
      i = end;
    } else if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      const end = close < 0 ? src.length : close + 2;
      out += blank(src.slice(i, end));
      i = end;
    } else if (c === '"' || c === "'") {
      const end = skipString(src, i);
      out += src.slice(i, end);
      i = end;
      prev = c;
    } else if (c === '`') {
      out += c;
      i++;
      scanTemplate();
    } else if (c === '/' && (prev === '' || regexAfter.test(prev) || /\breturn\s*$/.test(out.slice(-12)))) {
      let j = i + 1;
      let cls = false;
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\') j++;
        else if (src[j] === '[') cls = true;
        else if (src[j] === ']') cls = false;
        else if (src[j] === '/' && !cls) break;
        j++;
      }
      if (src[j] !== '/') {
        out += c;
        i++;
        prev = c;
        continue;
      }
      j++;
      while (/[a-z]/i.test(src[j] ?? '')) j++;
      out += src.slice(i, j);
      i = j;
      prev = 'x';
    } else {
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (templates.length && templates[templates.length - 1] === depth) {
          templates.pop();
          out += c;
          i++;
          scanTemplate();
          continue;
        }
      }
      out += c;
      i++;
      if (!/\s/.test(c)) prev = c;
    }
  }
  return out;
}

/* ---------- CSS block walker ---------- */

export interface Declaration {
  prop: string;
  value: string;
  /** Offset of the property and of the value in the source. */
  offset: number;
  valueOffset: number;
}
export interface CssRule {
  selectors: string[];
  offset: number;
  decls: Declaration[];
}

const RECURSE_AT = /^@(media|container|supports|layer|scope|starting-style|document)\b/i;

/** Split on top-level commas (not inside parentheses or brackets). */
function splitList(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const c of s) {
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Resolve nested selectors against their parent's (`&` replaced, otherwise a descendant). */
function nest(parent: string[], child: string[]): string[] {
  if (!parent.length) return child;
  return parent.flatMap((p) => child.map((c) => (c.includes('&') ? c.replace(/&/g, p) : `${p} ${c}`)));
}

/** Every style rule in a CSS source (comments already stripped or not), with its declarations. */
export function parseCss(source: string): CssRule[] {
  const src = stripCssComments(source);
  const rules: CssRule[] = [];
  let i = 0;
  const walk = (selectors: string[]): void => {
    // Inside a block (or at the top level when selectors is empty and i is 0).
    const rule: CssRule | null = selectors.length ? { selectors, offset: i, decls: [] } : null;
    if (rule) rules.push(rule);
    let start = i;
    let paren = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === '"' || c === "'") {
        i = skipString(src, i);
        continue;
      }
      if (c === '(') paren++;
      else if (c === ')') paren = Math.max(0, paren - 1);
      else if (paren === 0 && c === '{') {
        const prelude = src.slice(start, i).trim();
        i++;
        if (prelude.startsWith('@')) {
          // Conditional at-rules keep the current selectors; others (keyframes, font-face) open their own.
          if (RECURSE_AT.test(prelude)) walk(selectors);
          else walk([prelude]);
        } else walk(nest(selectors, splitList(prelude)));
        start = i;
        continue;
      } else if (paren === 0 && (c === ';' || c === '}')) {
        const text = src.slice(start, i);
        const colon = text.indexOf(':');
        if (rule && colon > 0) {
          const lead = text.length - text.trimStart().length;
          const prop = text.slice(0, colon).trim().toLowerCase();
          const rawValue = text.slice(colon + 1);
          const valueLead = rawValue.length - rawValue.trimStart().length;
          if (/^(--)?[a-z-][\w-]*$/i.test(prop)) {
            rule.decls.push({
              prop,
              value: rawValue.trim(),
              offset: start + lead,
              valueOffset: start + colon + 1 + valueLead,
            });
          }
        }
        i++;
        start = i;
        if (c === '}') return;
        continue;
      }
      i++;
    }
  };
  walk([]);
  return rules;
}

/* ---------- matching helpers ---------- */

function lineAt(src: string): (offset: number) => number {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

const short = (s: string) => {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > 80 ? `${one.slice(0, 77)}...` : one;
};

const PX = /(?<![\w.-])-?(?:\d+(?:\.\d+)?|\.\d+)px(?![\w-])/g;
const allowed = (n: number) => n === 0 || n === 1 || n === 2;

/** Offsets of each counted px length in a string. */
function pxLengths(s: string): { at: number; text: string }[] {
  const out: { at: number; text: string }[] = [];
  for (const m of s.matchAll(PX)) {
    if (!allowed(Math.abs(parseFloat(m[0])))) out.push({ at: m.index ?? 0, text: m[0] });
  }
  return out;
}

const MARGIN = /^margin(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?$/;
const PAINT = /^(?:background(?:-[\w-]+)?|box-shadow|backdrop-filter|border(?:-(?:top|right|bottom|left|inline|block)(?:-[\w-]+)?)?|border-(?:color|style|width|image(?:-[\w-]+)?))$/;
const PAINT_NONE = new Set(['none', '0', 'transparent', 'inherit', 'initial', 'unset']);
const unimportant = (v: string) => v.replace(/!\s*important\s*$/i, '').trim();

export const isPainting = (prop: string, value: string) =>
  PAINT.test(prop) && !/radius$/.test(prop) && !PAINT_NONE.has(unimportant(value).toLowerCase());

/** `(…)` and `[…]` contents removed, keeping the brackets. */
function flatten(sel: string): string {
  let out = '';
  let depth = 0;
  for (const c of sel) {
    if (c === '(' || c === '[') {
      if (depth === 0) out += c;
      depth++;
    } else if (c === ')' || c === ']') {
      depth--;
      if (depth === 0) out += c;
    } else if (depth === 0) out += c;
  }
  return out.trim();
}

/** A single compound selector whose first class is a block, not a `__` part. */
export function isRootSelector(sel: string): boolean {
  const flat = flatten(sel);
  if (/[\s>+~]/.test(flat)) return false;
  const first = /\.(-?[_a-zA-Z][\w-]*)/.exec(flat);
  return !!first && !first[1].includes('__');
}

const isReset = (value: string) =>
  unimportant(value)
    .split(/\s+/)
    .every((t) => /^-?0(?:\.0+)?(?:px|rem|em|%)?$/.test(t));

/** The Region's own plate: `.lib-region` or `.lib-region__head` with only attribute/pseudo suffixes. */
const isPlate = (sel: string) => /^\.lib-region(?:__head)?(?:\[\]|::?[\w-]+(?:\(\))?)*$/.test(flatten(sel));

const LAYOUT_CLASS = /\.lib-(?:screen|region|group|stack)(?:__[\w-]+)?(?![\w-])/;
const LAYOUT_PART = /\[\s*data-part\s*=\s*['"]?(?:region|group)['"]?\s*\]/;
const isLayoutSelector = (sel: string) => LAYOUT_CLASS.test(sel) || LAYOUT_PART.test(sel);

function paintingCounts(tier: PaintingTier, rule: CssRule): boolean {
  if (tier === 'all') return true;
  if (tier === 'region') return !rule.selectors.every(isPlate);
  if (tier === 'app') return rule.selectors.some(isLayoutSelector);
  return false;
}

/* ---------- tuning knobs ---------- */

const KNOB = /^--(?:yh|vs)-[\w-]+$/;

/** The knob names (and `prefix*` families) listed under **Tuning knobs** in the given comments. */
export function tuningKnobs(comments: string[]): string[] {
  const out: string[] = [];
  for (const c of comments) {
    const heads = [...c.matchAll(/\*\*Tuning knobs[.:]?\*\*/g)];
    for (const h of heads) {
      const rest = c.slice((h.index ?? 0) + h[0].length);
      const next = /\*\*[A-Z][^*\n]*\*\*/.exec(rest);
      const body = next ? rest.slice(0, next.index) : rest;
      for (const m of body.matchAll(/--(?:yh|vs)-[\w-]*\*?/g)) out.push(m[0]);
    }
  }
  return out;
}

/** Doc comments (`/** … *\/`) of a TS/TSX source. */
export const docComments = (src: string) => [...src.matchAll(/\/\*\*[\s\S]*?\*\//g)].map((m) => m[0]);
/** All block comments of a CSS source. */
export const cssComments = (src: string) => [...src.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0]);

const listed = (name: string, knobs: string[]) =>
  knobs.some((k) => (k.endsWith('*') ? name.startsWith(k.slice(0, -1)) : name === k));

/* ---------- scanning one file ---------- */

export interface CssOptions {
  /** Knob names listed for this file's directory; undefined: read them from the CSS's own comments. */
  knobs?: string[];
}

/** Findings in one CSS file, `path` relative to `src/library`. Knobs are not yet de-duplicated per folder. */
export function scanCss(path: string, source: string, options: CssOptions = {}): Finding[] {
  const out: Finding[] = [];
  const line = lineAt(source);
  const tier = paintingTier(path);
  const knobs = options.knobs ?? tuningKnobs(cssComments(source));
  for (const rule of parseCss(source)) {
    for (const d of rule.decls) {
      const snippet = short(`${d.prop}: ${d.value}`);
      if (applies('pixels', path)) {
        for (const px of pxLengths(d.value)) {
          out.push({ file: path, line: line(d.valueOffset + px.at), rule: 'pixels', snippet });
        }
      }
      if (applies('margins', path) && MARGIN.test(d.prop) && !isReset(d.value) && rule.selectors.some(isRootSelector)) {
        out.push({ file: path, line: line(d.offset), rule: 'margins', snippet: short(`${rule.selectors.join(', ')} { ${snippet} }`) });
      }
      if (applies('painting', path) && isPainting(d.prop, d.value) && paintingCounts(tier, rule)) {
        out.push({ file: path, line: line(d.offset), rule: 'painting', snippet: short(`${rule.selectors.join(', ')} { ${snippet} }`) });
      }
      if (applies('knobs', path) && KNOB.test(d.prop) && !listed(d.prop, knobs)) {
        out.push({ file: path, line: line(d.offset), rule: 'knobs', snippet: d.prop });
      }
    }
  }
  return out;
}

const STYLE_LENGTH =
  /(?<![\w$.'"])(width|height|(?:min|max)(?:Width|Height)|padding\w*|margin\w*|gap|rowGap|columnGap|top|right|bottom|left|inset\w*|fontSize|borderRadius|flexBasis)\s*:\s*(-?\d+(?:\.\d+)?)(?![\w.])(?=\s*[,}])/g;

/** Findings in one TS/TSX file, `path` relative to `src/library`. */
export function scanTsx(path: string, source: string): Finding[] {
  if (!applies('pixels', path)) return [];
  const src = stripTsComments(source);
  const line = lineAt(src);
  const lines = source.split('\n');
  const at = (offset: number): Finding => {
    const n = line(offset);
    return { file: path, line: n, rule: 'pixels', snippet: short(lines[n - 1] ?? '') };
  };
  const out: Finding[] = pxLengths(src).map((px) => at(px.at));
  for (const m of src.matchAll(/style=\{\{/g)) {
    const begin = (m.index ?? 0) + m[0].length;
    let depth = 2;
    let j = begin;
    while (j < src.length && depth > 0) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') depth--;
      j++;
    }
    const body = src.slice(begin, j);
    for (const s of body.matchAll(STYLE_LENGTH)) {
      if (!allowed(Math.abs(parseFloat(s[2])))) out.push(at(begin + (s.index ?? 0)));
    }
  }
  return out.sort((a, b) => a.line - b.line);
}

/* ---------- the library ---------- */

export type LibraryScan = Finding[] & { folders: string[] };

const SKIP = /\.(?:stories|test|fixtures)\.tsx?$/;
const excluded = (rel: string) => SKIP.test(rel) || /^visuals\/(?:model|fixtures)\//.test(rel);

/** Every finding under `root` (the `src/library` directory), with every scanned folder. */
export function scanLibrary(root: string): LibraryScan {
  const files: string[] = [];
  for (const t of TOP_FOLDERS) {
    const base = join(root, t);
    if (!existsSync(base)) continue;
    for (const f of readdirSync(base, { recursive: true, encoding: 'utf8' })) {
      const rel = `${t}/${f.split('\\').join('/')}`;
      if (!/\.(?:css|tsx?)$/.test(rel) || /\.d\.ts$/.test(rel) || excluded(rel)) continue;
      if (statSync(join(root, rel)).isFile()) files.push(rel);
    }
  }
  files.sort();
  const read = (rel: string) => readFileSync(join(root, rel), 'utf8');
  // Knobs listed per directory, from its TSX doc comments; undefined when it has no TSX.
  const knobsByDir = new Map<string, string[] | undefined>();
  for (const rel of files) {
    const d = dirname(rel);
    if (!knobsByDir.has(d)) knobsByDir.set(d, undefined);
    if (rel.endsWith('.tsx')) knobsByDir.set(d, [...(knobsByDir.get(d) ?? []), ...tuningKnobs(docComments(read(rel)))]);
  }
  const findings: Finding[] = [];
  const seenKnobs = new Set<string>();
  for (const rel of files) {
    const src = read(rel);
    if (!rel.endsWith('.css')) {
      findings.push(...scanTsx(rel, src));
      continue;
    }
    for (const f of scanCss(rel, src, { knobs: knobsByDir.get(dirname(rel)) })) {
      if (f.rule === 'knobs') {
        const key = `${folderOf(rel)} ${f.snippet}`;
        if (seenKnobs.has(key)) continue;
        seenKnobs.add(key);
      }
      findings.push(f);
    }
  }
  return Object.assign(findings, { folders: [...new Set(files.map(folderOf))].sort() });
}

export type Counts = Record<string, Partial<Record<RuleId, number>>>;

const findingsOf = new WeakMap<Counts, Finding[]>();

/** Counts per folder and rule, with an explicit 0 for each rule that applies to each scanned folder. */
export function countByFolder(findings: Finding[] & { folders?: string[] }, folders: Iterable<string> = findings.folders ?? []): Counts {
  const counts: Counts = {};
  const ensure = (folder: string) => {
    if (!counts[folder]) {
      counts[folder] = {};
      for (const r of RULE_IDS) if (RULE_FOLDERS[r].includes(top(folder))) counts[folder][r] = 0;
    }
    return counts[folder];
  };
  for (const f of folders) ensure(f);
  for (const f of findings) {
    const c = ensure(folderOf(f.file));
    c[f.rule] = (c[f.rule] ?? 0) + 1;
  }
  findingsOf.set(counts, findings);
  return counts;
}

/** A failure for each count above its baseline (a missing baseline entry is 0). */
export function compare(counts: Counts, baseline: Counts, findings: Finding[] = findingsOf.get(counts) ?? []): string[] {
  const failures: string[] = [];
  for (const folder of Object.keys(counts).sort()) {
    for (const rule of RULE_IDS) {
      const n = counts[folder][rule];
      if (n === undefined) continue;
      const b = baseline[folder]?.[rule] ?? 0;
      if (n <= b) continue;
      const head =
        b === 0
          ? `${folder} ${rule}: ${n} (rule is an error here: baseline 0) — ${RULES[rule].fix}`
          : `${folder} ${rule}: ${n} > baseline ${b} — ${RULES[rule].fix}`;
      const examples = findings
        .filter((f) => f.rule === rule && folderOf(f.file) === folder)
        .slice(0, 10)
        .map((f) => `  ${f.file}:${f.line} ${f.snippet}`);
      failures.push([head, ...examples].join('\n'));
    }
  }
  return failures;
}
