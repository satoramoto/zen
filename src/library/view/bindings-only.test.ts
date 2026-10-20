// React and Svelte are bindings only: a component's `.tsx` and `.svelte` write no element markup but
// `<Tree …/>` (bindings.ts). Unconverted files are held to `view.baseline.json`: a count may go down,
// never up, and a file not listed there must have none. Converting a component deletes its lines.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { markupCount, scanBindings } from './bindings';
import baseline from './view.baseline.json';

describe('bindings-only scanner', () => {
  it('counts JSX tags and fragments but not <Tree, generics, comparisons or comments', () => {
    const tsx = `// <div> in a comment
const ref = useRef<HTMLButtonElement>(null);
const less = a < b && c<d;
export const X = () => <Tree tree={t} />;
export const Y = () => <><span>{x}</span><Text role="label" /></>;`;
    expect(markupCount('components/core/X/X.tsx', tsx)).toBe(3);
  });

  it('does not count a generic arrow, but counts createElement( and h( calls', () => {
    const tsx = `const pick = <T,>(x: T) => x;
const keep = <Tab extends string>(x: Tab) => x;
const canvas = document.createElement('canvas');
export const X = () => createElement('div', null, h('span'));`;
    expect(markupCount('components/core/X/X.tsx', tsx)).toBe(2);
  });

  it('counts Svelte markup but not <Tree, the script, the style or comments', () => {
    const svelte = `<!-- <div> -->
<script lang="ts">const a: Array<string> = []; if (a.length < 2) {}</script>
<Tree {tree} {handlers} />
{#if x}<span class="a"><Text>b</Text></span>{/if}
<style>.a > .b {}</style>`;
    expect(markupCount('components/core/X/X.svelte', svelte)).toBe(2);
  });

  it('counts {@html} in Svelte markup and element-building calls in its script', () => {
    const svelte = `<script lang="ts">const node = h('b'); const el = document.createElement('i');</script>
<Tree {tree} />{@html raw}`;
    expect(markupCount('components/core/X/X.svelte', svelte)).toBe(2);
  });
});

it('no binding has more markup than its baseline (view.baseline.json)', () => {
  const counts = scanBindings(join(process.cwd(), 'src/library'));
  const allowed = baseline as Record<string, number>;
  const failures = Object.entries(counts)
    .filter(([file, n]) => n > (allowed[file] ?? 0))
    .map(([file, n]) => `${file}: ${n} element tags besides <Tree> (baseline ${allowed[file] ?? 0}) — move the markup into the model's tree`);
  expect(failures).toEqual([]);
});
