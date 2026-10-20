import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { EveryPack, withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import type { ModeChoice } from '../../../theme';
import { packs } from '../../../themes/packs';
import { stepDetent } from '../Param/paramGesture';
import { Slider, type SliderProps } from './Slider';
import SliderSvelte from './Slider.svelte';
import { doublings, sliderArgTypes, sliderStories as s } from './Slider.fixtures';

// Every story is built from Slider.fixtures.ts (`story(s.Name)`), which the tree snapshot shares; the
// toolbar's Renderer draws it with React's or Svelte's `Tree`. Those are controlled and stay where
// they are (the spies hear the drag, the keys and the typing). The stories with a `render` of their
// own (a width to fill, or wired to state so the control moves) stay React, with a note.

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

/** A row the width of seven controls, the slider wired to state inside it. */
const Wide = (args: SliderProps) => (
  <div style={{ width: 'calc(var(--control-h) * 7)' }}>
    <Controlled {...args} />
  </div>
);

/**
 * `live.slider`: drag along the track (⌘/Ctrl for fine), arrows / Page / Home / End, double-click
 * resets to the default. The track is a `well`, the fill lit, the thumb a `handle`.
 */
const meta = {
  title: 'Design OS/Components/Core/Slider',
  component: Slider,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...(s.Vertical.args as SliderProps), onChange: fn(), onRelease: fn() },
  argTypes: sliderArgTypes,
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Slider, SliderSvelte);

/** A vertical fader: caption, track, reading. */
export const Vertical: Story = story(s.Vertical);

/** The widget's own default length, 27px. */
export const Compact: Story = story(s.Compact);

/** Horizontal, stacked. */
export const Horizontal: Story = story(s.Horizontal);

/** Pan: zero is the middle, so the fill grows from the centre. */
export const CenterOrigin: Story = story(s.CenterOrigin);

/** Inline: caption over reading beside the track, on the left or the right. */
export const Inline: Story = story(s.Inline);

/** A row: caption and reading inside a full-width track, the value a thin lit mark (no fill). React only: a width to fill, wired to state. */
export const Inside: Story = story(s.Inside, { render: Wide });

/** A row that asks for its fill back. React only, as Inside. */
export const InsideFilled: Story = story(s.InsideFilled, { render: Wide });

/** Apple's slider: the name leading and the reading trailing above a thin groove, a knob proud of it. React only, as Inside. */
export const Row: Story = story(s.Row, { render: Wide });

/** A row filled from the middle, as the inspector's tune sliders are (1× in the middle). React only, as Inside. */
export const RowCenter: Story = story(s.RowCenter, { render: Wide });

/** Depth: shift-drag sets how far a modulator may carry it; the span runs the sign's way, `live` marks where it is. */
export const Depth: Story = { ...story(s.Depth), args: { ...s.Depth.args, onDepth: fn() } };

/** Stepped: eight reachable values, one per arrow key. */
export const Stepped: Story = story(s.Stepped);

/** An authoritative reading and a custom ink. */
export const DisplayAndInk: Story = story(s.DisplayAndInk);

/** `mixed`: several things that differ. No thumb or fill, it reads "Mixed"; any drag, key or double-click sets a value. React only: wired to state. */
export const Mixed: Story = story(s.Mixed, {
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
});

/** `detents`: a tick at each doubling, the default (1×) tallest; with `snap` a drag catches within a sixth of one. React only, as Inside. */
export const Detents: Story = story(s.Detents, { render: Wide });

/** `keyStep`: the arrows step between detents (`stepDetent`), Shift+arrow a twelfth, Delete back to 1×; the rest default. React only, as Inside. */
export const KeySteps: Story = {
  ...story(s.KeySteps, { render: Wide }),
  args: {
    ...s.KeySteps.args,
    keyStep: ({ key, shiftKey }, value) => {
      const way = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 0;
      if (way !== 0) return shiftKey ? value + way / 12 : stepDetent(doublings, value, way);
      if (key === 'Delete' || key === 'Backspace') return 0;
      return undefined;
    },
  },
};

/** Read-only. */
export const Disabled: Story = story(s.Disabled);

/** `length="auto"`: fills its container along the axis; the drag gears to the measured length. React only: a width to fill, wired to state. */
export const AutoLength: Story = story(s.AutoLength, {
  render: (args) => (
    <div style={{ width: 'calc(var(--control-h) * 8)' }}>
      <Controlled {...args} />
    </div>
  ),
});

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
 * each doubling, the default (1×) in full ink. React only: every pack, wired to state.
 */
export const TypedAndLabelled: Story = {
  ...story(s.TypedAndLabelled, {
    render: (args, { globals }) => (
      <EveryPack mode={globals.mode as ModeChoice}>
        <Tune {...args} />
      </EveryPack>
    ),
  }),
  args: {
    ...s.TypedAndLabelled.args,
    detentLabel: times,
    typed: { parse: parseTimes, format: (v) => String(Number((2 ** v).toPrecision(3))) },
  },
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
  ...story(s.TypedPlain),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /type a value/ }));
    const entry = canvas.getByRole('textbox');
    await userEvent.clear(entry);
    await userEvent.type(entry, '500{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(100);
  },
};
