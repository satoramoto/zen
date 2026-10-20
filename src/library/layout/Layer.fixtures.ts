// Layer's stories (and Opaque's and Hole's, shown under the same title) as plain data:
// Layer.stories.tsx (React) and Layer.stories.svelte.ts (Svelte) both draw them, and
// parity.test.tsx renders every instance in both.
import { LAYERS, type AmbientRegion } from '../contract';
import { defineFixtures } from '../fixtures';
import type { LayerModelProps } from './Layer.model';

/** A Layer's props in parity fixtures: the model's, plus the Surface and native props the stories set. */
export type LayerFixtureProps = LayerModelProps & { ambient?: AmbientRegion; role?: string; 'aria-label'?: string };

export const layerArgTypes = {
  level: { control: 'inline-radio', options: [...LAYERS] },
} as const;

export const layerStories = defineFixtures<LayerFixtureProps>()({
  Levels: { items: LAYERS.map((level) => ({ level, children: level })) },
  Popover: { args: { level: 'float', role: 'dialog', 'aria-label': 'Tempo', ambient: 'right', children: 'Tempo 128' } },
});

/** Opaque: every layer inside draws its solid fill and no backdrop. */
export const opaqueStories = defineFixtures<{ children?: string }>()({
  OpaqueScope: { args: { children: 'Over the preview' } },
});

/** Hole: a cut-out to what's behind the page, named for assistive tech. */
export const holeStories = defineFixtures<{ name?: string; children?: string }>()({
  HoleCutOut: { items: [{ name: 'Preview' }, { children: 'Behind the page' }] },
});
