import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import type { Param } from '../Param/param';
import { stepDetent } from '../Param/useParamGesture';
import { Slider, type SliderProps } from './Slider';

const volume: Param = { kind: 'float', min: -70, max: 6, defaultValue: 0, unit: 'decibel', name: 'Volume', shortName: 'Vol' };
const pan: Param = { kind: 'float', min: -1, max: 1, defaultValue: 0, unit: 'pan', name: 'Pan' };
const amount: Param = { kind: 'float', min: 0, max: 100, defaultValue: 50, unit: 'percent', name: 'Amount' };
const steps: Param = { kind: 'int', min: 0, max: 7, defaultValue: 0, steps: 8, name: 'Step' };

/** Wired to state, so a drag, the keys, a double-click and shift-drag (depth) all move it. */
function Controlled(props: SliderProps) {
  const [value, setValue] = useState(props.value);
  const [depth, setDepth] = useState(props.depth);
  return (
    <Slider
      {...props}
      value={value}
      depth={depth}
      onChange={(next) => {
        props.onChange(next);
        setValue(next);
      }}
      onDepth={
        props.onDepth &&
        ((next) => {
          props.onDepth?.(next);
          setDepth(next);
        })
      }
    />
  );
}

/**
 * `live.slider`: drag along the track (⌘/Ctrl for fine), arrows / Page / Home / End, double-click
 * resets to the default. The track is a `well`, the fill lit, the thumb a `handle`.
 */
const meta = {
  title: 'Design OS/Components/Core/Slider',
  component: Slider,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { param: volume, value: -6, length: 120, onChange: fn(), onRelease: fn() },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    layout: { control: 'inline-radio', options: ['stacked', 'inline', 'inside', 'row'] },
    side: { control: 'inline-radio', options: ['left', 'right'] },
    origin: { control: 'inline-radio', options: ['min', 'center'] },
    fill: { control: 'boolean' },
    showValue: { control: 'boolean' },
    disabled: { control: 'boolean' },
    length: { control: 'number' },
    width: { control: 'number' },
    live: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    display: { control: 'text' },
    ink: { control: 'text' },
  },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A vertical fader: caption, track, reading. */
export const Vertical: Story = {};

/** The widget's own default length, 27px. */
export const Compact: Story = { args: { length: undefined } };

/** Horizontal, stacked. */
export const Horizontal: Story = { args: { orientation: 'horizontal', param: amount, value: 35 } };

/** Pan: zero is the middle, so the fill grows from the centre. */
export const CenterOrigin: Story = { args: { orientation: 'horizontal', param: pan, value: 0.3 } };

/** Inline: caption over reading beside the track, on the left or the right. */
export const Inline: Story = {
  render: (args) => (
    <div className="lib-specimens">
      <Controlled {...args} orientation="horizontal" layout="inline" side="left" param={amount} value={60} />
      <Controlled {...args} orientation="horizontal" layout="inline" side="right" param={amount} value={20} />
    </div>
  ),
};

/** A row: caption and reading inside a full-width track, the value a thin lit mark (no fill). */
export const Inside: Story = {
  args: { orientation: 'horizontal', layout: 'inside', param: amount, value: 42 },
  render: (args) => (
    <div style={{ width: 'calc(var(--control-h) * 7)' }}>
      <Controlled {...args} />
    </div>
  ),
};

/** A row that asks for its fill back. */
export const InsideFilled: Story = { ...Inside, args: { ...Inside.args, fill: true } };

/** Apple's slider: the name leading and the reading trailing above a thin groove, a knob proud of it. */
export const Row: Story = {
  args: { layout: 'row', length: 'auto', param: amount, value: 42 },
  render: (args) => (
    <div style={{ width: 'calc(var(--control-h) * 7)' }}>
      <Controlled {...args} />
    </div>
  ),
};

/** A row filled from the middle, as the inspector's tune sliders are (1× in the middle). */
export const RowCenter: Story = { ...Row, args: { ...Row.args, param: pan, value: 0.3 } };

/** Depth: shift-drag sets how far a modulator may carry it; the span runs the sign's way, `live` marks where it is. */
export const Depth: Story = {
  args: { orientation: 'horizontal', param: amount, value: 40, depth: 0.3, onDepth: fn(), live: 0.55, length: 160 },
};

/** Stepped: eight reachable values, one per arrow key. */
export const Stepped: Story = { args: { param: steps, value: 3 } };

/** An authoritative reading and a custom ink. */
export const DisplayAndInk: Story = { args: { display: '-inf dB', value: -70, ink: 'var(--hue-2)' } };

/** A log rail, ¼× to 4× as doublings (−2 to 2) on twelfths, 1× the default in the middle. */
const tune: Param = { kind: 'float', min: -2, max: 2, defaultValue: 0, steps: 49, name: 'Speed' };
const doublings = [-2, -1, 0, 1, 2];

/** `mixed`: several things that differ. No thumb or fill, it reads "Mixed"; any drag, key or double-click sets a value. */
export const Mixed: Story = {
  args: { layout: 'row', length: 'auto', param: tune, origin: 'center', value: 0, mixed: true },
  render: function Render(args) {
    const [value, setValue] = useState<number | null>(null);
    return (
      <div style={{ width: 'calc(var(--control-h) * 7)' }}>
        <Slider
          {...args}
          value={value ?? args.value}
          mixed={value === null}
          onChange={(next) => {
            args.onChange(next);
            setValue(next);
          }}
        />
      </div>
    );
  },
};

/** `detents`: a tick at each doubling, the default (1×) tallest; with `snap` a drag catches within a sixth of one. */
export const Detents: Story = {
  args: { layout: 'row', length: 'auto', param: tune, origin: 'center', value: 0.5, detents: doublings, snap: 1 / 6 },
  render: Row.render,
};

/** `keyStep`: the arrows step between detents (`stepDetent`), Shift+arrow a twelfth, Delete back to 1×; the rest default. */
export const KeySteps: Story = {
  args: {
    ...Detents.args,
    keyStep: ({ key, shiftKey }, value) => {
      const way = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 0;
      if (way !== 0) return shiftKey ? value + way / 12 : stepDetent(doublings, value, way);
      if (key === 'Delete' || key === 'Backspace') return 0;
      return undefined;
    },
  },
  render: Row.render,
};

/** Read-only. */
export const Disabled: Story = { args: { disabled: true } };

/** `length="auto"`: fills its container along the axis; the drag gears to the measured length. */
export const AutoLength: Story = {
  args: { orientation: 'horizontal', length: 'auto', param: amount, value: 70 },
  render: (args) => (
    <div style={{ width: 'calc(var(--control-h) * 8)' }}>
      <Controlled {...args} />
    </div>
  ),
};
