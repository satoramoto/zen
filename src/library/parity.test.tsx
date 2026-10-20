// DOM parity: every unconverted component's React and Svelte renderers draw the same DOM for every
// story's fixture (parity.ts). One line per component: `parity(name, ReactComponent, SvelteComponent, fixtures)`.
// A component converted to a view tree moves from here to `view/snapshot.test.ts`.
import { describe, expect, it } from 'vitest';
import { reactDom, svelteDom } from './parity';
import { Stage } from './yahaha/Stage/Stage';
import StageSvelte from './yahaha/Stage/Stage.svelte';
import { stageStories } from './yahaha/Stage/Stage.fixtures';

// The Stage holds Regions with views, whose ids are React's `useId` and Svelte's `$props.id`: each
// distinct id is masked by its order of first appearance, so the references still have to agree.
const maskIds = (dom: string) => {
  const seen = new Map<string, string>();
  return dom.replace(/ (id|aria-controls|aria-labelledby|aria-describedby|for)="([^"]*)"/g, (_, name: string, value: string) => {
    const ids = value.split(' ').map((id) => {
      if (!seen.has(id)) seen.set(id, `id${seen.size}`);
      return seen.get(id);
    });
    return ` ${name}="${ids.join(' ')}"`;
  });
};
describe('Stage: React and Svelte draw the same DOM (ids masked)', () => {
  for (const [story, fixture] of Object.entries(stageStories)) {
    it(story, () => {
      const expected = maskIds(reactDom(Stage, fixture.args ?? {}));
      expect(expected).not.toBe('');
      expect(maskIds(svelteDom(StageSvelte, fixture.args ?? {}))).toBe(expected);
    });
  }
});
