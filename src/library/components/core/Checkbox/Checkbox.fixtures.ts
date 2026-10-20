// Checkbox's stories as plain props: Checkbox.stories.tsx draws them (with either renderer's `Tree`),
// and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance. Radio's sheets
// are built the same way (`checkSheet`).
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { CONTROL_SIZES } from '../Toggle/sizes';
import type { CheckModelProps, ToggleValue } from './Checkbox.model';

/** The controls, the same in both Storybooks. */
export const checkArgTypes = {
  size: { control: 'select', options: CONTROL_SIZES },
  disabled: { control: 'boolean' },
} as const;

/** Every size, enabled and disabled, at one value; each its own (no shared name). */
export const checkSheet = (value: ToggleValue): FixtureProps<CheckModelProps>[] =>
  CONTROL_SIZES.flatMap((size) => [
    { size, defaultChecked: value, children: `${size}, idle` },
    { size, defaultChecked: value, disabled: true, children: `${size}, disabled` },
  ]);

export const checkboxStories = defineFixtures<CheckModelProps>()({
  Playground: { args: { children: 'Show the frame rate', size: 'regular', defaultChecked: false, disabled: false } },
  Checked: { items: checkSheet(true) },
  Unchecked: { items: checkSheet(false) },
  Mixed: { items: checkSheet('mixed') },
});
