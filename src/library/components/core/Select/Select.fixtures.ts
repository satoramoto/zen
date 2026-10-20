// Select's stories as plain props: Select.stories.tsx draws them (with either renderer's `Tree`),
// and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance, closed.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { SelectModelProps } from './Select.model';

export const SELECT_MODES = ['neon', 'soft', 'band'];
export const SELECT_BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color dodge', 'color burn', 'hard light', 'soft light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];

/** The controls. */
export const selectArgTypes = {
  index: { control: { type: 'number', min: 0 } },
  label: { control: 'text' },
  name: { control: 'text' },
  width: { control: 'number' },
  disabled: { control: 'boolean' },
  title: { control: 'text' },
  hint: { control: 'text' },
} as const;

/** A mode: every story starts from it. */
const mode: FixtureProps<SelectModelProps> = { items: SELECT_MODES, index: 0, label: 'Mode' };

export const selectStories = defineFixtures<SelectModelProps>()({
  Closed: { args: mode },
  Open: { args: { ...mode, index: 1 } },
  Captioned: { args: { ...mode, label: undefined, name: 'Mode' } },
  LongList: { args: { ...mode, items: SELECT_BLENDS, index: 11, label: 'Blend', name: 'Blend' } },
  FixedWidth: { args: { ...mode, items: SELECT_BLENDS, index: 6, label: 'Blend', width: 96 } },
  Disabled: { args: { ...mode, disabled: true } },
});
