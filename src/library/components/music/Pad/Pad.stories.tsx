import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Pad } from './Pad';
import { BANK, BANK_RING, CELLS, TAG_STATES, padArgTypes, padBase, padStories as s, tagPad } from './Pad.fixtures';

// Every story's args come from Pad.fixtures.ts, which the Svelte stories and the parity test share.

/**
 * One bank pad, a library music component (redesigned from Yahaha's band pad; compare each story
 * with its namesake under "Yahaha baseline / Primitives / Pad": same names, same sample data).
 */
const meta = {
  title: 'Design OS/Components/Music/Pad',
  component: Pad,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...padBase, onPress: fn(), tipAction: fn() },
  argTypes: padArgTypes,
} satisfies Meta<typeof Pad>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Main B playing: the solid `--selected` fill, pressed. */
export const Board: Story = {
  args: s.Board.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Main B')).toBeInTheDocument();
    await expect(canvas.queryByText('10')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('aria-pressed', 'true');
  },
};

/** An idle section pad: a raised face with an edge, the label in primary text. */
export const Idle: Story = { args: s.Idle.args };

/** A pad the style lacks: a dashed edge, no face, a muted label. */
export const Dark: Story = {
  args: s.Dark.args,
  play: async ({ canvasElement }) => {
    const pad = within(canvasElement).getByRole('button', { name: 'Intro III (not in this style)' });
    await expect(pad).toHaveAttribute('data-state', 'dark');
  },
};

/** An absent utility pad: the same dashed, faceless structure. */
export const DarkUtility: Story = {
  args: s.DarkUtility.args,
};

/** Queued: Main C, the wait ring and a faint wash in `--accent` (next, by default), a NEXT chip above the centred label. */
export const Next: Story = {
  args: s.Next.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('NEXT')).toBeInTheDocument();
    await expect(canvas.queryByText('11')).toBeNull();
  },
};

/** Queued with `tagCorner`: NEXT hangs on the top edge at the right, so the label stays centred. */
export const NextCorner: Story = {
  args: s.NextCorner.args,
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
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-6)', paddingTop: 'var(--space-3)' }}>
      {/* The regions set the pad's type size on the pad itself; this stands in for them. */}
      <style>{'.yh-pad-cell .yh-pad { font-size: var(--yh-pad-cell-font, var(--size-label)); }'}</style>
      {TAG_STATES.map((state) => (
        <div key={state} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'end' }}>
          {CELLS.map((cell) => (
            <div
              key={cell.name}
              className="yh-pad-cell"
              style={{ display: 'grid', width: cell.width, height: cell.height, ['--yh-pad-cell-font' as string]: cell.font }}
            >
              <Pad {...tagPad(cell, state)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
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
  args: s.NextUnlit.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('NEXT')).toBeInTheDocument();
  },
};

/** Armed: Ending I, a `--warning` ring and ARMED chip. */
export const Armed: Story = {
  args: s.Armed.args,
};

/** A utility pad: Sync Start, neutral, its label one step quieter than a section's. */
export const Utility: Story = {
  args: s.Utility.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'neutral');
  },
};

/** A lit utility pad: Auto Fill on, the `--selected` fill (the default `onFace`; see `OnRing` for a bank's quieter on). */
export const UtilityOn: Story = { args: s.UtilityOn.args };

/** Start / Stop running: a solid `--success` fill. */
export const Running: Story = {
  args: s.Running.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'success');
  },
};

/** A role pad running (Yahaha's transport: role 2): still `--success`, because running is a state, not the role's identity. */
export const RoleRunning: Story = {
  args: s.RoleRunning.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'success');
  },
};

/** A role pad stopped: a neutral edge. A role key wears `--role-n` only while active. */
export const RoleStopped: Story = {
  args: s.RoleStopped.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'role-2');
  },
};

/** A lit role pad (Auto Fill on): the solid `--role-2` fill with `--role-2-text`. */
export const RoleOn: Story = {
  args: s.RoleOn.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'role-2');
  },
};

/** Sync Start armed on a role pad: the `--warning` armed ring and `--warning-text` chip. */
export const RoleArmed: Story = {
  args: s.RoleArmed.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'role-2');
  },
};

/** A pad in hue slot 1 (in Yahaha, a stored Quick Rack lit in its part's hue): `--hue-1`, solid when on. */
export const Hue: Story = {
  args: s.Hue.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'hue-1');
  },
};

/** A hue-slot pad that isn't available: a dashed edge in its hue, muted label. */
export const HueDark: Story = {
  args: s.HueDark.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'hue-3');
  },
};

/** New: `accentNext`, queued in `--accent` (the contract's "next" role) instead of the pad's own colour, as the song form shows it. Now the default. */
export const NextAccent: Story = {
  args: s.NextAccent.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-next', 'accent');
  },
};

/** New: `disabled`, still focusable but marked unavailable (a dashed edge, a `--text-3` label); a press does nothing. */
export const Disabled: Story = {
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
  render: (args) => (
    <div style={{ display: 'grid', width: 'calc(var(--control-h) * 5)', height: 'calc(var(--control-h) * 1.5)' }}>
      <Pad {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-fill', 'true');
  },
};

/** New: a whole 4 × 4 bank, every face at once, to judge hierarchy under each theme pack. */
export const Bank: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, max-content)', gap: 'var(--space-2)' }}>
      {BANK.map((p) => (
        <Pad key={p.index} {...p} />
      ))}
    </div>
  ),
};

/**
 * New: `onFace="ring"`, on but not sounding: a bank's pads, Auto Fill on. The raised face stays, its
 * edge and a ring take the pad's colour, and a lit dot sits top-left; the solid fill is left to what
 * plays. Shown beside a role pad, a hue slot and the default fill.
 */
export const OnRing: Story = {
  args: s.OnRing.args,
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      {(s.OnRing.items ?? []).map((item, i) => (
        <Pad key={i} {...args} {...item} />
      ))}
    </div>
  ),
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
export const BankRing: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, max-content)', gap: 'var(--space-2)' }}>
      {BANK_RING.map((p) => (
        <Pad key={p.index} {...p} />
      ))}
    </div>
  ),
};
