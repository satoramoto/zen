// DOM parity: every unconverted component's React and Svelte renderers draw the same DOM for every
// story's fixture, generated ids masked (parity.ts). One line per component:
// `parity(name, ReactComponent, SvelteComponent, fixtures)`. A component converted to a view tree
// moves from here to `view/snapshot.test.ts`.
import { parity } from './parity';
import { Text } from './primitives/Text';
import TextSvelte from './primitives/Text.svelte';
import { textStories } from './primitives/Text.fixtures';
import { Stack } from './primitives/Stack';
import StackSvelte from './primitives/Stack.svelte';
import { stackStories } from './primitives/Stack.fixtures';
import { holeStories, opaqueStories } from './layout/Layer.fixtures';
import { Hole, Opaque } from './primitives/Surface';
import OpaqueSvelte from './primitives/Opaque.svelte';
import HoleSvelte from './primitives/Hole.svelte';
import { Surface } from './primitives/Surface';
import SurfaceSvelte from './primitives/Surface.svelte';
import { surfaceStories } from './primitives/Surface.fixtures';
import { Icon } from './primitives/Icon';
import IconSvelte from './primitives/Icon.svelte';
import { iconStories } from './primitives/Icon.fixtures';

parity('Text', Text, TextSvelte, textStories);
parity('Stack', Stack, StackSvelte, stackStories);
parity('Opaque', Opaque, OpaqueSvelte, opaqueStories);
parity('Hole', Hole, HoleSvelte, holeStories);
parity('Surface', Surface, SurfaceSvelte, surfaceStories);
parity('Icon', Icon, IconSvelte, iconStories);
