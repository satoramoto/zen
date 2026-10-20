import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { instances } from '../../../fixtures';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { NumberField, type NumberFieldProps } from './NumberField';
import NumberFieldSvelte from './NumberField.svelte';
import { cutoff, numberFieldArgTypes, numberFieldStories as s } from './NumberField.fixtures';

// Every story is built from NumberField.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`. The field is controlled,
// so these show it at its fixture's value (each write is logged in Actions); `Row` is wired to
// state, so there a drag, the keys, a double-click and typing all move it.

/** Wired to state, so a drag, the keys, a double-click and typing all move it. */
function Controlled(props: NumberFieldProps) {
  const [value, setValue] = useState(props.value);
  return (
    <NumberField
      {...props}
      value={value}
      onChange={(next) => {
        props.onChange(next);
        setValue(next);
      }}
    />
  );
}

/**
 * `live.numbox`: a value box. Drag sideways (⌘/Ctrl for fine), arrows / Page / Home / End, double-click
 * resets to the default, and typing a digit or Enter opens the editor.
 */
const meta = {
  title: 'Design OS/Components/Core/NumberField',
  component: NumberField,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { param: cutoff, value: 1000, onChange: fn(), onRelease: fn() },
  argTypes: numberFieldArgTypes,
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(NumberField, NumberFieldSvelte);

/** A tapered frequency, filled from the bottom of its range. */
export const Default: Story = story(s.Default);

/** Pan: zero sits at the middle, so the fill grows from the centre. */
export const CenterOrigin: Story = story(s.CenterOrigin);

/** An int, one value per arrow key. */
export const Integer: Story = story(s.Integer);

/** An enum: not typeable, steps through its members. */
export const Enum: Story = story(s.Enum);

/** No fill: just the reading in its window. */
export const NoFill: Story = story(s.NoFill);

/** An authoritative reading from the engine wins over the parameter's own formatting. */
export const Display: Story = story(s.Display);

/** Read-only: no drag, no keys, no editor. */
export const Disabled: Story = story(s.Disabled);

/** Every kind side by side, the last at a fixed width, each live. Its own React `render` (live state), so it stays React-only. */
export const Row: Story = story(s.Row, {
  render: (args) => (
    <div className="lib-row">
      {instances(s.Row).map((item, i) => (
        <Controlled key={i} {...args} {...(item as NumberFieldProps)} />
      ))}
    </div>
  ),
});
