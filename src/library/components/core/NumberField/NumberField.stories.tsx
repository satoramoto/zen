import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { enumParam, type Param } from '../Param/param';
import { NumberField, type NumberFieldProps } from './NumberField';

const cutoff: Param = { kind: 'float', min: 20, max: 20000, defaultValue: 1000, unit: 'hertz', exponent: 3, name: 'Cutoff', shortName: 'Freq' };
const pan: Param = { kind: 'float', min: -1, max: 1, defaultValue: 0, unit: 'pan', name: 'Pan' };
const voices: Param = { kind: 'int', min: 1, max: 16, defaultValue: 4, unit: 'int', name: 'Voices' };
const gain: Param = { kind: 'float', min: -70, max: 6, defaultValue: 0, unit: 'decibel', name: 'Gain' };
const shape = enumParam(['Sine', 'Triangle', 'Saw', 'Square'], { name: 'Shape' });

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
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { param: cutoff, value: 1000, onChange: fn(), onRelease: fn() },
  argTypes: {
    display: { control: 'text' },
    label: { control: 'text' },
    name: { control: 'text' },
    editable: { control: 'boolean' },
    showFill: { control: 'boolean' },
    origin: { control: 'inline-radio', options: ['min', 'center'] },
    width: { control: 'number' },
    disabled: { control: 'boolean' },
  },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A tapered frequency, filled from the bottom of its range. */
export const Default: Story = {};

/** Pan: zero sits at the middle, so the fill grows from the centre. */
export const CenterOrigin: Story = { args: { param: pan, value: -0.4 } };

/** An int, one value per arrow key. */
export const Integer: Story = { args: { param: voices, value: 6 } };

/** An enum: not typeable, steps through its members. */
export const Enum: Story = { args: { param: shape, value: 2 } };

/** No fill: just the reading in its window. */
export const NoFill: Story = { args: { param: gain, value: -12, showFill: false } };

/** An authoritative reading from the engine wins over the parameter's own formatting. */
export const Display: Story = { args: { param: gain, value: -70, display: '-inf dB' } };

/** Read-only: no drag, no keys, no editor. */
export const Disabled: Story = { args: { param: gain, value: -6, disabled: true } };

/** Every kind side by side, at a fixed width. */
export const Row: Story = {
  render: (args) => (
    <div className="lib-row">
      <Controlled {...args} param={cutoff} value={1000} />
      <Controlled {...args} param={pan} value={0.5} />
      <Controlled {...args} param={voices} value={4} />
      <Controlled {...args} param={shape} value={0} />
      <Controlled {...args} param={gain} value={0} width={72} />
    </div>
  ),
};
