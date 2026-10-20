// The tree each converted component draws for every story's fixture, as text (`printTree`), one
// file per component in `__snapshots__/`. With `Tree.parity.test.tsx` proving both renderers draw
// any tree the same, this is a converted component's whole DOM check. One line per component:
// `snapshot('Name', (props) => nameView(props), nameStories)`. A changed tree shows as a diff;
// `npx vitest run src/library/view/snapshot.test.ts -u` records a deliberate change.
import { describe, expect, it } from 'vitest';
import { instances, type Fixtures } from '../fixtures';
import { printTree, type Node } from './Tree.model';
import { buttonView } from '../components/core/Button/Button.model';
import { buttonStories } from '../components/core/Button/Button.fixtures';
import { knobView } from '../components/music/Knob/Knob.model';
import { knobStories } from '../components/music/Knob/Knob.fixtures';

function snapshot<P>(name: string, view: (props: P) => Node, fixtures: Fixtures<P>): void {
  describe(name, () => {
    it('draws the same tree for every fixture', async () => {
      const text = Object.entries(fixtures)
        .flatMap(([story, fixture]) => {
          const all = instances(fixture);
          return all.map((props, i) => `## ${story}${all.length > 1 ? ` #${i + 1}` : ''}\n${printTree(view(props as P))}`);
        })
        .join('\n\n');
      await expect(`${text}\n`).toMatchFileSnapshot(`__snapshots__/${name}.tree`);
    });
  });
}

snapshot('Button', (props) => buttonView(props), buttonStories);
snapshot('Knob', (props) => knobView(props as Parameters<typeof knobView>[0]), knobStories);
