// Toggle's and Switch's stories as plain props: Toggle.stories.tsx and Switch.stories.tsx draw them
// (with either renderer's `Tree`), and the tree snapshot (`src/library/view/snapshot.test.ts`)
// prints every instance. No callbacks: the stories add their own `onChange` spies.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { CONTROL_SIZES } from './sizes';
import type { SwitchModelProps, ToggleModelProps } from './Toggle.model';

/** The controls. */
export const toggleArgTypes = {
  on: { control: 'boolean' },
  disabled: { control: 'boolean' },
  momentary: { control: 'boolean' },
  label: { control: 'text' },
  name: { control: 'text' },
  width: { control: 'number' },
  layout: { control: 'inline-radio', options: ['stacked', 'inside'] },
  title: { control: 'text' },
  hint: { control: 'text' },
  ink: { control: 'text' },
} as const;

/** Every Toggle story starts from a stacked "sync" key, off, its face "On". */
export const toggleBase: FixtureProps<ToggleModelProps> = { on: false, name: 'sync', children: 'On' };

export const toggleStories = defineFixtures<ToggleModelProps>()({
  Stacked: { args: { ...toggleBase, hint: 'Follow the link’s tempo', title: 'Sync to Link' } },
  On: { args: { ...toggleBase, on: true, ink: 'var(--hue-2)' } },
  Inside: { args: { ...toggleBase, layout: 'inside', name: 'invert', label: 'invert', title: 'Flip the colours (I)', children: 'Off' } },
  Momentary: { args: { ...toggleBase, momentary: true, name: 'tap', children: 'Tap' } },
  Disabled: { args: { ...toggleBase, disabled: true }, items: [{ on: false }, { on: true }] },
});

/** The controls. */
export const switchArgTypes = {
  'aria-label': { control: 'text' },
  size: { control: 'select', options: CONTROL_SIZES },
  disabled: { control: 'boolean' },
  defaultChecked: { control: 'boolean' },
  title: { control: 'text' },
} as const;

/** Every size, enabled and disabled, at one value. */
const sheet = (on: boolean): FixtureProps<SwitchModelProps>[] =>
  CONTROL_SIZES.flatMap((size) => [
    { 'aria-label': `${size}, idle`, size, defaultChecked: on },
    { 'aria-label': `${size}, disabled`, size, defaultChecked: on, disabled: true },
  ]);

export const switchStories = defineFixtures<SwitchModelProps>()({
  Playground: { args: { 'aria-label': 'Follow the beat', size: 'regular', defaultChecked: false, disabled: false } },
  On: { items: sheet(true) },
  Off: { items: sheet(false) },
  Labelled: {
    args: { size: 'small', title: 'Turns the motion down' },
    items: [{ children: 'Reduced motion' }, { children: 'Follow the system', disabled: true }],
  },
});
