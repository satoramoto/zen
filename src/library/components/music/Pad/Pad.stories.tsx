import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../../stories/story';
import { Pad, type PadProps } from './Pad';
import PadSvelte from './Pad.svelte';
import {
  BANK,
  BANK_RING,
  FACES,
  padArgTypes,
  padBankSample,
  padBase,
  padFillCellSample,
  padStories as s,
  padTagClearanceSample,
} from './Pad.fixtures';

// Every story is built from Pad.fixtures.ts (`story(s.Name)`), which the tree snapshot shares; the
// toolbar's Renderer draws it with React's or Svelte's `Tree`. The stories laid out in a grid or a
// cell are view trees from the fixtures (`treeStory`).

/**
 * One bank pad, a library music component (redesigned from Yahaha's band pad; compare each story
 * with its namesake under "Yahaha baseline / Primitives / Pad": same names, same sample data).
 */
const meta = {
  title: 'Design OS/Components/Music/Pad',
  component: Pad,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...padBase, onPress: fn(), tipAction: fn() },
  argTypes: padArgTypes,
} satisfies Meta<typeof Pad>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Pad, PadSvelte);

/** Main B playing: the solid `--selected` fill, pressed. */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Main B')).toBeInTheDocument();
    await expect(canvas.queryByText('10')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('aria-pressed', 'true');
  },
};

/** An idle section pad: a raised face with an edge, the label in primary text. */
export const Idle: Story = story(s.Idle);

/** A pad the style lacks: a dashed edge, no face, a muted label. */
export const Dark: Story = {
  ...story(s.Dark),
  play: async ({ canvasElement }) => {
    const pad = within(canvasElement).getByRole('button', { name: 'Intro III (not in this style)' });
    await expect(pad).toHaveAttribute('data-state', 'dark');
  },
};

/** An absent utility pad: the same dashed, faceless structure. */
export const DarkUtility: Story = story(s.DarkUtility);

/** Queued: Main C, the wait ring and a faint wash in `--accent` (next, by default), a NEXT chip above the centred label. */
export const Next: Story = {
  ...story(s.Next),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('NEXT')).toBeInTheDocument();
    await expect(canvas.queryByText('11')).toBeNull();
  },
};

/** Queued with `tagCorner`: NEXT hangs on the top edge at the right, so the label stays centred. */
export const NextCorner: Story = {
  ...story(s.NextCorner),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('NEXT')).toHaveClass('yh-pad__tag--corner');
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tag', 'corner');
  },
};

/** Two boxes overlap (both laid out: jsdom lays nothing out, so there it checks nothing). */
const overlaps = (a: DOMRect, b: DOMRect) =>
  a.width > 0 && b.width > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/**
 * New: NEXT and ARMED at every size the Stage uses a pad, the smallest first. The chip never
 * covers the label: at the top the pad keeps the chip's row clear; in the corner it hangs on the
 * top edge.
 */
export const TagClearance: Story = {
  ...treeStory(() => ({ tree: padTagClearanceSample() })),
  play: async ({ canvasElement }) => {
    for (const pad of canvasElement.querySelectorAll<HTMLElement>('.yh-pad')) {
      const tag = pad.querySelector('.yh-pad__tag')!.getBoundingClientRect();
      const label = pad.querySelector('.yh-pad__label')!.getBoundingClientRect();
      await expect(overlaps(tag, label), pad.getAttribute('aria-label') ?? '').toBe(false);
    }
  },
};

/** Queued, the flash's off phase: the idle face with a thin ring; the words stay. */
export const NextUnlit: Story = {
  ...story(s.NextUnlit),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('NEXT')).toBeInTheDocument();
  },
};

/** Armed: Ending I, a `--warning` ring and ARMED chip. */
export const Armed: Story = story(s.Armed);

/** A utility pad: Sync Start, neutral, its label one step quieter than a section's. */
export const Utility: Story = {
  ...story(s.Utility),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'neutral');
  },
};

/** A lit utility pad: Auto Fill on, the `--selected` fill (the default `onFace`; see `OnRing` for a bank's quieter on). */
export const UtilityOn: Story = story(s.UtilityOn);

/** Start / Stop running: a solid `--success` fill. */
export const Running: Story = {
  ...story(s.Running),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'success');
  },
};

/** A role pad running (Yahaha's transport: role 2): still `--success`, because running is a state, not the role's identity. */
export const RoleRunning: Story = {
  ...story(s.RoleRunning),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'success');
  },
};

/** A role pad stopped: a neutral edge. A role key wears `--role-n` only while active. */
export const RoleStopped: Story = {
  ...story(s.RoleStopped),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'role-2');
  },
};

/** A lit role pad (Auto Fill on): the solid `--role-2` fill with `--role-2-text`. */
export const RoleOn: Story = {
  ...story(s.RoleOn),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'role-2');
  },
};

/** Sync Start armed on a role pad: the `--warning` armed ring and `--warning-text` chip. */
export const RoleArmed: Story = {
  ...story(s.RoleArmed),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'role-2');
  },
};

/** A pad in hue slot 1 (in Yahaha, a stored Quick Rack lit in its part's hue): `--hue-1`, solid when on. */
export const Hue: Story = {
  ...story(s.Hue),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'hue-1');
  },
};

/** A hue-slot pad that isn't available: a dashed edge in its hue, muted label. */
export const HueDark: Story = {
  ...story(s.HueDark),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'hue-3');
  },
};

/** New: `accentNext`, queued in `--accent` (the contract's "next" role) instead of the pad's own colour, as the song form shows it. Now the default. */
export const NextAccent: Story = {
  ...story(s.NextAccent),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-next', 'accent');
  },
};

/** New: `disabled`, still focusable but marked unavailable (a dashed edge, a `--text-3` label); a press does nothing. */
export const Disabled: Story = {
  ...story(s.Disabled),
  args: { ...s.Disabled.args, onPress: fn() },
  play: async ({ canvasElement, args }) => {
    const pad = within(canvasElement).getByRole('button');
    await expect(pad).toHaveAttribute('aria-disabled', 'true');
    pad.click();
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

/** New: `fillCell`, the pad filling a wide, short cell instead of its fixed square. */
export const FillCell: Story = {
  args: s.FillCell.args,
  ...treeStory(({ onPress, tipAction, ...data }: PadProps) => ({ tree: padFillCellSample(data), handlers: { press: onPress } })),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-fill', 'true');
  },
};

/** New: a whole 4 × 4 bank, every face at once, to judge hierarchy under each theme pack. */
export const Bank: Story = treeStory(() => ({ tree: padBankSample(BANK) }));

/**
 * New: `onFace="ring"`, on but not sounding: a bank's pads, Auto Fill on. The raised face stays, its
 * edge and a ring take the pad's colour, and a lit dot sits top-left; the solid fill is left to what
 * plays. Shown beside a role pad, a hue slot and the default fill.
 */
export const OnRing: Story = {
  ...story(s.OnRing),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = canvas.getByRole('button', { name: 'Auto Fill, on (ring)' });
    const fill = canvas.getByRole('button', { name: 'Main B, playing (fill)' });
    await expect(ring).toHaveAttribute('data-on-face', 'ring');
    await expect(ring).toHaveAttribute('aria-pressed', 'true');
    await expect(getComputedStyle(ring).backgroundColor).not.toBe(getComputedStyle(fill).backgroundColor);
  },
};

/** New: the Bank's sixteen pads with every pad but the sections on `onFace="ring"`: the playing section and Start / Stop are the only fills. */
export const BankRing: Story = treeStory(() => ({ tree: padBankSample(BANK_RING) }));

/** New: `chosen`, the picked option (a fingering, Stop ACMP's mode): the solid `--selected` block, no bloom, pressed. */
export const Chosen: Story = {
  ...story(s.Chosen),
  play: async ({ canvasElement }) => {
    const pad = within(canvasElement).getByRole('button', { name: 'Single, chosen (pad 1)' });
    await expect(pad).toHaveAttribute('aria-pressed', 'true');
    await expect(pad).toHaveAttribute('data-tone', 'neutral');
  },
};

/** New: `lamp`, a switch that is on (Kbd Transpose, OTS Link, Upper): a lit `--success` ring and dot on the key face. */
export const Lamp: Story = {
  ...story(s.Lamp),
  play: async ({ canvasElement }) => {
    const pad = within(canvasElement).getByRole('button', { name: 'OTS Link, on (pad 9)' });
    await expect(pad).toHaveAttribute('aria-pressed', 'true');
    await expect(pad).toHaveAttribute('data-tone', 'success');
  },
};

/** New: `unavailable`, here but unable to apply now (Manual Bass): the rest face dimmed, still focusable, a press does nothing. */
export const Unavailable: Story = {
  ...story(s.Unavailable),
  args: { ...s.Unavailable.args, onPress: fn() },
  play: async ({ canvasElement, args }) => {
    const pad = within(canvasElement).getByRole('button', { name: 'Manual Bass, unavailable (pad 9)' });
    await expect(pad).toHaveAttribute('aria-disabled', 'true');
    await expect(pad).toHaveAttribute('aria-pressed', 'false');
    pad.click();
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

/** New: chosen, lamp and unavailable beside idle and a ring-on pad, then each on a hued pad: the state wins, no hue shows. */
export const Faces: Story = {
  ...treeStory(() => ({ tree: padBankSample(FACES) })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Quick 1, chosen (hue 1)' })).toHaveAttribute('data-tone', 'neutral');
    await expect(canvas.getByRole('button', { name: 'Quick 2, on (lamp, hue 2)' })).toHaveAttribute('data-tone', 'success');
  },
};
