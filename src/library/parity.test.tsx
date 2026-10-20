// DOM parity: every unconverted component's React and Svelte renderers draw the same DOM for every
// story's fixture (parity.ts). One line per component: `parity(name, ReactComponent, SvelteComponent, fixtures)`.
// A component converted to a view tree moves from here to `view/snapshot.test.ts`.
import { parity } from './parity';
import { Text } from './primitives/Text';
import TextSvelte from './primitives/Text.svelte';
import { textStories } from './primitives/Text.fixtures';
import { Stack } from './primitives/Stack';
import StackSvelte from './primitives/Stack.svelte';
import { stackStories } from './primitives/Stack.fixtures';
import { Region } from './layout/Region';
import RegionSvelte from './layout/Region.svelte';
import { regionStories } from './layout/Region.fixtures';
import { Group } from './layout/Group';
import GroupSvelte from './layout/Group.svelte';
import { groupStories } from './layout/Group.fixtures';
import { Layer } from './layout/Layer';
import LayerSvelte from './layout/Layer.svelte';
import { holeStories, layerStories, opaqueStories } from './layout/Layer.fixtures';
import { Hole, Opaque } from './primitives/Surface';
import OpaqueSvelte from './primitives/Opaque.svelte';
import HoleSvelte from './primitives/Hole.svelte';
import { Screen } from './layout/Screen';
import ScreenSvelte from './layout/Screen.svelte';
import { screenStories } from './layout/Screen.fixtures';
import { assemblyStories } from './layout/assembly/Assembly.fixtures';
import { Surface } from './primitives/Surface';
import SurfaceSvelte from './primitives/Surface.svelte';
import { surfaceStories } from './primitives/Surface.fixtures';
import { Icon } from './primitives/Icon';
import IconSvelte from './primitives/Icon.svelte';
import { iconStories } from './primitives/Icon.fixtures';
import { describe, expect, it } from 'vitest';
import { reactDom, svelteDom } from './parity';
import { Stage } from './yahaha/Stage/Stage';
import StageSvelte from './yahaha/Stage/Stage.svelte';
import { stageStories } from './yahaha/Stage/Stage.fixtures';

parity('Text', Text, TextSvelte, textStories);
parity('Stack', Stack, StackSvelte, stackStories);
parity('Region', Region, RegionSvelte, regionStories);
parity('Group', Group, GroupSvelte, groupStories);
parity('Layer', Layer, LayerSvelte, layerStories);
parity('Opaque', Opaque, OpaqueSvelte, opaqueStories);
parity('Hole', Hole, HoleSvelte, holeStories);
parity('Screen', Screen, ScreenSvelte, screenStories);
parity('Screen (assembled)', Screen, ScreenSvelte, assemblyStories);
parity('Surface', Surface, SurfaceSvelte, surfaceStories);
parity('Icon', Icon, IconSvelte, iconStories);

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
