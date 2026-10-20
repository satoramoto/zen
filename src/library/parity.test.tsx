// DOM parity: every unconverted component's React and Svelte renderers draw the same DOM for every
// story's fixture, generated ids masked (parity.ts). One line per component:
// `parity(name, ReactComponent, SvelteComponent, fixtures)`. A component converted to a view tree
// moves from here to `view/snapshot.test.ts`. The Stage stays as the whole-screen check: every
// region and component drawn together by both renderers.
import { parity } from './parity';
import { Stage } from './yahaha/Stage/Stage';
import StageSvelte from './yahaha/Stage/Stage.svelte';
import { stageStories } from './yahaha/Stage/Stage.fixtures';

parity('Stage', Stage, StageSvelte, stageStories);
