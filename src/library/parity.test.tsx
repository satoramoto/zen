// DOM parity: every component's React and Svelte renderers draw the same DOM for every story's
// fixture (parity.ts). One line per component: `parity(name, ReactComponent, SvelteComponent, fixtures)`.
import { parity } from './parity';
import { Text } from './primitives/Text';
import TextSvelte from './primitives/Text.svelte';
import { textStories } from './primitives/Text.fixtures';
import { Stack } from './primitives/Stack';
import StackSvelte from './primitives/Stack.svelte';
import { stackStories } from './primitives/Stack.fixtures';
import { Button } from './components/core/Button/Button';
import ButtonSvelte from './components/core/Button/Button.svelte';
import { buttonStories } from './components/core/Button/Button.fixtures';
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

parity('Text', Text, TextSvelte, textStories);
parity('Stack', Stack, StackSvelte, stackStories);
parity('Button', Button, ButtonSvelte, buttonStories);
parity('Region', Region, RegionSvelte, regionStories);
parity('Group', Group, GroupSvelte, groupStories);
parity('Layer', Layer, LayerSvelte, layerStories);
parity('Opaque', Opaque, OpaqueSvelte, opaqueStories);
parity('Hole', Hole, HoleSvelte, holeStories);
parity('Screen', Screen, ScreenSvelte, screenStories);
parity('Screen (assembled)', Screen, ScreenSvelte, assemblyStories);
