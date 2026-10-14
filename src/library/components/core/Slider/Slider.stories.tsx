import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { EveryPack, withLibraryTheme } from '../../../storybook';
import type { ModeChoice } from '../../../theme';
import { packs } from '../../../themes/packs';
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

/** A multiplier as text: 0.5 → "½×", 1.5 → "1.5×". */
const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };
const times = (doublings: number) => {
  const m = Number((2 ** doublings).toPrecision(3));
  return `${FRACTIONS[String(m)] ?? m}×`;
};
/** Typed multipliers ("2", "2x", "½", "1/2") as doublings; null for anything else. */
const parseTimes = (text: string): number | null => {
  const t = text.trim().replace(/[x×]$/i, '');
  const glyph = Object.entries(FRACTIONS).find(([, g]) => g === t)?.[0];
  const [a, b] = (glyph ?? t).split('/');
  const m = b === undefined ? Number(a) : Number(a) / Number(b);
  return Number.isFinite(m) && m > 0 ? Math.log2(m) : null;
};

/** The inspector's tune slider, built from zen alone: a log rail with labelled doublings and a readout you can type into. */
function Tune(props: SliderProps) {
  const [value, setValue] = useState(props.value);
  return (
    <div style={{ width: 'calc(var(--control-h) * 7)' }}>
      <Slider
        {...props}
        value={value}
        display={times(value)}
        onChange={(next) => {
          props.onChange(next);
          setValue(next);
        }}
      />
    </div>
  );
}

/**
 * New: `typed` and `detentLabel`, in every pack. Click a readout (or Enter on it) and type "2",
 * "1/2" or "½x": Enter sets it, Escape leaves it, clicking away sets it. Under the rail, a word at
 * each doubling, the default (1×) in full ink.
 */
export const TypedAndLabelled: Story = {
  args: {
    layout: 'row',
    length: 'auto',
    param: tune,
    origin: 'center',
    value: 0,
    detents: doublings,
    snap: 1 / 6,
    detentLabel: times,
    typed: { parse: parseTimes, format: (v) => String(Number((2 ** v).toPrecision(3))) },
  },
  render: (args, { globals }) => (
    <EveryPack mode={globals.mode as ModeChoice}>
      <Tune {...args} />
    </EveryPack>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const readouts = canvas.getAllByRole('button', { name: 'Speed 1×, type a value' });
    await expect(readouts).toHaveLength(packs.length);
    const first = readouts[0];
    const root = first.closest('.lib-slider')!;
    const labels = root.querySelectorAll('[data-part="detent-label"]');
    await expect([...labels].map((l) => l.textContent)).toEqual(['¼×', '½×', '1×', '2×', '4×']);
    await expect(labels[2]).toHaveAttribute('data-default');

    // Type, Enter: set.
    await userEvent.click(first);
    const entry = within(root as HTMLElement).getByRole('textbox', { name: 'Speed, type a value' });
    await expect(entry).toHaveValue('1');
    await userEvent.clear(entry);
    await userEvent.type(entry, '1/2{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(-1);
    await expect(args.onRelease).toHaveBeenCalled();
    const back = within(root as HTMLElement).getByRole('button', { name: 'Speed ½×, type a value' });
    await waitFor(() => expect(back).toHaveFocus());

    // Type, Escape: nothing set.
    const calls = (args.onChange as ReturnType<typeof fn>).mock.calls.length;
    await userEvent.keyboard('{Enter}');
    await userEvent.type(within(root as HTMLElement).getByRole('textbox'), '4{Escape}');
    await expect(args.onChange).toHaveBeenCalledTimes(calls);
    await expect(within(root as HTMLElement).getByRole('button', { name: 'Speed ½×, type a value' })).toBeInTheDocument();
  },
};

/** `typed: true` on a plain parameter: a plain number, clamped to the range (type 500: 100%). */
export const TypedPlain: Story = {
  args: { orientation: 'horizontal', param: amount, value: 35, length: 160, typed: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /type a value/ }));
    const entry = canvas.getByRole('textbox');
    await userEvent.clear(entry);
    await userEvent.type(entry, '500{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(100);
  },
};
