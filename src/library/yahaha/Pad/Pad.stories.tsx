import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { Pad, type PadProps } from './Pad';

/**
 * One band pad, redesigned on the library contract. Compare each story with its namesake under
 * "Yahaha baseline / Primitives / Pad": same names, same sample data.
 */
const meta = {
  title: 'Library/Yahaha/Primitives/Pad',
  component: Pad,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: 'Main B',
    index: '10',
    family: 'main',
    state: 'playing',
    lit: true,
    tip: 'section.lamps',
    onPress: fn(),
    tipAction: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    index: { control: 'text' },
    family: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill', 'util', 'start', 'r1', 'r2', 'r3', 'l'] },
    state: { control: 'select', options: ['idle', 'dark', 'playing', 'next', 'armed', 'running'] },
    lit: { control: 'boolean' },
    tagCorner: { control: 'boolean' },
    transport: { control: 'boolean' },
    accentNext: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fillCell: { control: 'boolean' },
    name: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof Pad>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Main B playing: the solid `--selected` fill, pressed. */
export const Board: Story = {
  args: { name: 'Main B, playing' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Main B')).toBeInTheDocument();
    await expect(canvas.queryByText('10')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('aria-pressed', 'true');
  },
};

/** An idle section pad: a raised face with an edge, the label in primary text. */
export const Idle: Story = { args: { label: 'Intro I', index: '1', family: 'intro', state: 'idle' } };

/** A pad the style lacks: a dashed edge, no face, a muted label. */
export const Dark: Story = {
  args: { label: 'Intro III', index: '3', family: 'intro', state: 'dark', name: 'Intro III (not in this style)' },
  play: async ({ canvasElement }) => {
    const pad = within(canvasElement).getByRole('button', { name: 'Intro III (not in this style)' });
    await expect(pad).toHaveAttribute('data-state', 'dark');
  },
};

/** An absent utility pad: the same dashed, faceless structure. */
export const DarkUtility: Story = {
  args: { label: 'Auto Fill', index: '12', family: 'util', state: 'dark', name: 'Auto Fill (unavailable)' },
};

/** Queued: Main C, a heavier ring and faint wash, a NEXT chip above the centred label. */
export const Next: Story = {
  args: { label: 'Main C', index: '11', state: 'next', name: 'Main C, queued after bar 4 (flashing)' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('NEXT')).toBeInTheDocument();
    await expect(canvas.queryByText('11')).toBeNull();
  },
};

/** Queued with `tagCorner`: NEXT hangs on the top edge at the right, so the label stays centred. */
export const NextCorner: Story = {
  args: { label: 'Main C', index: '11', state: 'next', tagCorner: true, name: 'Main C, queued after bar 4 (flashing)' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('NEXT')).toHaveClass('yh-pad__tag--corner');
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tag', 'corner');
  },
};

/** The cells the Stage puts pads in: a song-form step, 4 × 4 and 2 × 8 bank cells, a narrow eight-a-row cell. */
const CELLS: { name: string; width: string; height: string; label: string; font?: string; tagCorner?: boolean }[] = [
  { name: 'Song-form step', width: 'calc(var(--control-h) * 1.1)', height: 'calc(var(--control-h) * 1.3)', label: 'C', font: 'var(--size-heading)', tagCorner: true },
  { name: '4 × 4 cell', width: 'calc(var(--control-h) * 2.6)', height: 'calc(var(--control-h) * 1.25)', label: 'Main A' },
  { name: '2 × 8 cell', width: 'calc(var(--control-h) * 1.95)', height: 'calc(var(--control-h) * 1.5)', label: 'Rack 4' },
  { name: 'Narrow cell', width: 'calc(var(--control-h) * 1.6)', height: 'calc(var(--control-h) * 1.5)', label: 'Bank +', font: 'var(--size-caption)' },
];

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
      {(['next', 'armed'] as const).map((state) => (
        <div key={state} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'end' }}>
          {CELLS.map((cell) => (
            <div
              key={cell.name}
              className="yh-pad-cell"
              style={{ display: 'grid', width: cell.width, height: cell.height, ['--yh-pad-cell-font' as string]: cell.font }}
            >
              <Pad label={cell.label} state={state} tagCorner={cell.tagCorner} fillCell name={`${cell.label}, ${state}, ${cell.name}`} />
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
  args: { label: 'Main C', index: '11', state: 'next', lit: false, name: 'Main C, queued after bar 4 (flashing)' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('NEXT')).toBeInTheDocument();
  },
};

/** Armed: Ending I, a `--warning` ring and ARMED chip. */
export const Armed: Story = {
  args: { label: 'Ending I', index: '5', family: 'ending', state: 'armed', name: 'Ending I, armed (pulsing)' },
};

/** A utility pad: Sync Start, neutral, its label one step quieter than a section's. */
export const Utility: Story = {
  args: { label: 'Sync Start', index: '4', family: 'util', state: 'idle' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'neutral');
  },
};

/** A lit utility pad: Auto Fill on, the `--selected` fill. */
export const UtilityOn: Story = { args: { label: 'Auto Fill', index: '12', family: 'util', state: 'playing' } };

/** Start / Stop running: a solid `--success` fill. */
export const Running: Story = {
  args: { label: 'Start / Stop', index: '16', family: 'start', state: 'running', name: 'Start / Stop, running (pad 16)' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'success');
  },
};

/** A transport pad running: the bank's one call to action, `--action`. */
export const TransportRunning: Story = {
  args: {
    label: 'Start / Stop',
    index: '16',
    family: 'start',
    state: 'running',
    transport: true,
    name: 'Start / Stop, running (pad 16)',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'action');
  },
};

/** Sync Start armed on a transport pad: the `--action` edge with the `--warning` armed ring. */
export const TransportArmed: Story = {
  args: { label: 'Sync Start', index: '4', family: 'util', state: 'armed', transport: true, name: 'Sync Start, armed' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'action');
  },
};

/** A pad the engine lights blue (a stored Quick Rack): `--hue-1`, solid when on. */
export const PartHue: Story = {
  args: { label: 'QUICK 1', index: '1', family: 'r1', state: 'playing', tip: 'padpage.racks' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'hue-1');
  },
};

/** A part-hue pad that isn't available: a dashed edge in its hue, muted label. */
export const PartHueDark: Story = {
  args: { label: 'BANK -', index: '13', family: 'r3', state: 'dark', tip: 'padpage.racks' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-tone', 'hue-3');
  },
};

/** New: `accentNext`, queued in `--accent` (hues.ts) instead of the pad's own colour, as the song form shows it. */
export const NextAccent: Story = {
  args: { label: 'Main C', index: '11', state: 'next', accentNext: true, name: 'Main C, queued after bar 4' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-next', 'accent');
  },
};

/** New: `disabled`, still focusable but marked unavailable; a press does nothing. */
export const Disabled: Story = {
  args: { label: 'Auto Fill', index: '12', family: 'util', state: 'idle', disabled: true, onPress: fn() },
  play: async ({ canvasElement, args }) => {
    const pad = within(canvasElement).getByRole('button');
    await expect(pad).toHaveAttribute('aria-disabled', 'true');
    pad.click();
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

/** New: `fillCell`, the pad filling a wide, short cell instead of its fixed square. */
export const FillCell: Story = {
  args: { label: 'Main B', index: '10', state: 'playing', fillCell: true },
  render: (args) => (
    <div style={{ display: 'grid', width: 'calc(var(--control-h) * 5)', height: 'calc(var(--control-h) * 1.5)' }}>
      <Pad {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-fill', 'true');
  },
};

const BANK: PadProps[] = [
  { label: 'Intro I', index: '1', family: 'intro', state: 'idle' },
  { label: 'Intro II', index: '2', family: 'intro', state: 'idle' },
  { label: 'Intro III', index: '3', family: 'intro', state: 'dark' },
  { label: 'Sync Start', index: '4', family: 'util', state: 'armed', transport: true },
  { label: 'Ending I', index: '5', family: 'ending', state: 'idle' },
  { label: 'Ending II', index: '6', family: 'ending', state: 'idle' },
  { label: 'Fill', index: '7', family: 'fill', state: 'idle' },
  { label: 'Break', index: '8', family: 'brk', state: 'idle' },
  { label: 'Main A', index: '9', family: 'main', state: 'idle' },
  { label: 'Main B', index: '10', family: 'main', state: 'playing' },
  { label: 'Main C', index: '11', family: 'main', state: 'next', tagCorner: true },
  { label: 'Auto Fill', index: '12', family: 'util', state: 'playing' },
  { label: 'QUICK 1', index: '13', family: 'r1', state: 'playing' },
  { label: 'QUICK 2', index: '14', family: 'r2', state: 'idle' },
  { label: 'BANK -', index: '15', family: 'r3', state: 'dark' },
  { label: 'Start / Stop', index: '16', family: 'start', state: 'running', transport: true },
];

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
