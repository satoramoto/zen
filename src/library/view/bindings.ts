// The bindings-only rule's scanner: a component's `.tsx` and `.svelte` are bindings, so the only
// element markup in them is `<Tree …/>`; everything they draw is the model's tree. Counted per file
// under the component folders (stories, story markup and tests aside) and held to
// `view.baseline.json` by `bindings-only.test.ts`: a count may go down, never up. Markup written
// without tags counts too: `createElement(` and `h(` calls (a model file, `*.model.ts`, is never a
// binding, so the tree's `h` is free there) and Svelte's `{@html …}`.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { stripTsComments } from '../tiers';

/** The folders whose renderers are held to the rule, under `src/library`. */
export const BINDING_FOLDERS = ['primitives', 'components', 'layout', 'yahaha'] as const;

/** Stories, story markup (`*.story.svelte`, `*.story.tsx`: a story's own harness, never shipped)
 *  and tests are not renderers. */
const SKIP = /\.(?:stories|test)\.(?:svelte\.)?tsx?$|\.story\.(?:svelte|tsx)$/;

/** The one element a binding may write. */
const ALLOWED = new Set(['Tree']);

/** A JSX tag or fragment: `<` not after an identifier, `)` or `]` (so not a generic), then a name or
 *  `>`; a name followed by `,` or `extends` is a generic arrow's parameter (`<T,>(x: T) => …`). */
const JSX_TAG = /(?<![\w$.)\]])<(?:([A-Za-z][\w.:-]*)(?![\w.:-]|\s*(?:,|extends\b))|>)/g;
/** A Svelte tag (an element, a component, `svelte:element`, …). */
const SVELTE_TAG = /<([A-Za-z][\w.:-]*)/g;
/** Element-building calls: React's `createElement(` (not `document.createElement(`) and a tree's `h(`. */
const BUILD_CALL = /(?<![\w$.])(?:createElement|h)\s*\(/g;
/** Svelte's raw markup. */
const SVELTE_HTML = /\{@html\b/g;

const count = (src: string, pattern: RegExp) => [...src.matchAll(pattern)].filter((m) => !ALLOWED.has(m[1] ?? '')).length;

/** The element tags and element-building calls in a binding other than `<Tree`: JSX and calls in a
 *  `.tsx` (comments aside); markup and `{@html}` in a `.svelte` (its `<style>` and comments aside),
 *  and calls in its `<script>`. */
export function markupCount(file: string, src: string): number {
  if (file.endsWith('.svelte')) {
    const uncommented = src.replace(/<!--[\s\S]*?-->/g, '');
    const scripts = [...uncommented.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => stripTsComments(m[1])).join('\n');
    const markup = uncommented.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '');
    return count(markup, SVELTE_TAG) + count(markup, SVELTE_HTML) + count(scripts, BUILD_CALL);
  }
  const code = stripTsComments(src);
  return count(code, JSX_TAG) + count(code, BUILD_CALL);
}

/** Every binding file under `root` (`src/library`) with markup besides `<Tree`, and its count. */
export function scanBindings(root: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const folder of BINDING_FOLDERS) {
    const base = join(root, folder);
    if (!existsSync(base)) continue;
    for (const f of readdirSync(base, { recursive: true, encoding: 'utf8' })) {
      const rel = `${folder}/${f.split('\\').join('/')}`;
      if (!/\.(?:tsx|svelte)$/.test(rel) || SKIP.test(rel) || !statSync(join(root, rel)).isFile()) continue;
      const n = markupCount(rel, readFileSync(join(root, rel), 'utf8'));
      if (n > 0) counts[rel] = n;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}
