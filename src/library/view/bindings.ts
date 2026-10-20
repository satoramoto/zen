// The bindings-only rule's scanner: a component's `.tsx` and `.svelte` are bindings, so the only
// element markup in them is `<Tree …/>`; everything they draw is the model's tree. Counted per file
// under the component folders (stories, story markup and tests aside) and held to
// `view.baseline.json` by `bindings-only.test.ts`: a count may go down, never up.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { stripTsComments } from '../tiers';

/** The folders whose renderers are held to the rule, under `src/library`. */
export const BINDING_FOLDERS = ['primitives', 'components', 'layout', 'yahaha'] as const;

/** Stories, story markup and tests are not renderers. */
const SKIP = /\.(?:stories|test)\.(?:svelte\.)?tsx?$|\.story\.svelte$/;

/** The one element a binding may write. */
const ALLOWED = new Set(['Tree']);

/** A JSX tag or fragment: `<` not after an identifier, `)` or `]` (so not a generic), then a name or `>`. */
const JSX_TAG = /(?<![\w$.)\]])<(?:([A-Za-z][\w.:-]*)|>)/g;
/** A Svelte tag (an element, a component, `svelte:element`, …). */
const SVELTE_TAG = /<([A-Za-z][\w.:-]*)/g;

const count = (src: string, pattern: RegExp) => [...src.matchAll(pattern)].filter((m) => !ALLOWED.has(m[1] ?? '')).length;

/** The element tags in a binding other than `<Tree`: JSX in a `.tsx` (comments aside), markup in a
 *  `.svelte` (its `<script>`, `<style>` and comments aside). */
export function markupCount(file: string, src: string): number {
  if (file.endsWith('.svelte')) {
    const markup = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '');
    return count(markup, SVELTE_TAG);
  }
  return count(stripTsComments(src), JSX_TAG);
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
