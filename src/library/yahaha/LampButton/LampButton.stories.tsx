import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { LampButton, type LampHue } from './LampButton';

const meta = {
  title: 'Library/Yahaha/Primitives/LampButton',
  component: LampButton,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { label: 'Accomp', onToggle: fn(), onLongPress: fn(), onLongRelease: fn(), tipAction: fn() },
  argTypes: {
    label: { control: 'text' },
    code: { control: 'text' },
    name: { control: 'text' },
    tip: { control: 'text' },
    on: { control: 'boolean' },
    disabled: { control: 'boolean' },
    rec: { control: 'boolean' },
    waiting: { control: 'boolean' },
    size: { control: 'select', options: ['md', 'sm', 'cell'] },
    hue: { control: 'select', options: ['t', 'r1', 'r2', 'r3', 'l', 'ok', 'lamp', 'transport'] },
    join: { control: 'select', options: ['none', 'start', 'end'], mapping: { none: undefined } },
    width: { control: 'number' },
  },
} satisfies Meta<typeof LampButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first LampButton on the Stage board: Accomp, lit, with its Genos code (section row). */
export const Board: Story = {
  args: { label: 'Accomp', code: 'ACMP', on: true, tip: 'transport.acmp' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Accomp ACMP' });
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveAttribute('data-face', 'on');
    await expect(button).toHaveAttribute('data-tip', 'transport.acmp');
    await expect(args.tipAction).toHaveBeenCalledWith(button, 'transport.acmp');
  },
};

/** Lit: the solid neutral fill, the label, LED and code in the fill's ink. */
export const On: Story = {
  args: { label: 'Accomp', code: 'ACMP', on: true },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Accomp ACMP' });
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveAttribute('data-face', 'on');
  },
};

/** Controlled: a click, Space or Enter asks for `!on` through `onToggle` and changes nothing itself. */
export const Toggles: Story = {
  args: { label: 'Unison' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Unison' });
    await userEvent.click(button);
    await expect(args.onToggle).toHaveBeenCalledTimes(1);
    await expect(args.onToggle).toHaveBeenLastCalledWith(true);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveAttribute('data-face', 'off');
    button.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    await expect(args.onToggle).toHaveBeenCalledTimes(3);
    for (const n of [1, 2, 3]) await expect(args.onToggle).toHaveBeenNthCalledWith(n, true);
    await expect(args.onLongPress).not.toHaveBeenCalled();
  },
};

/** Shown, not pressable: a dashed, unfilled key with a hollow LED, 64 wide (a settings row's On/Off). */
export const Disabled: Story = {
  args: { label: 'Off', size: 'sm', width: 64, disabled: true, name: 'Manual Bass, works with Upper on' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Manual Bass, works with Upper on' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAttribute('data-face', 'disabled');
    await expect(button).toHaveAttribute('data-contrast', 'dim');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onToggle).not.toHaveBeenCalled();
    const init = { pointerId: 1, button: 0, clientX: 0, clientY: 0 };
    await fireEvent.pointerDown(button, init);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(args.onLongPress).not.toHaveBeenCalled();
    await fireEvent.pointerUp(button, init);
    await expect(args.onLongRelease).not.toHaveBeenCalled();
  },
};

/** Off: a quiet raised key with an unlit LED (Metronome, Unison). */
export const Off: Story = {
  args: { label: 'Metronome' },
};

/** A part lamp, lit: the solid fill in the part's hue (Right 1 "On"). */
export const PartOn: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 'r1', name: 'Right 1 on' },
  parameters: { layout: 'padded' },
};

/** A part lamp, lit, in Right 2's hue. */
export const PartOnR2: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 'r2', name: 'Right 2 on' },
  parameters: { layout: 'padded' },
};

/** A part lamp, off: the key is neutral, the unlit LED keeps the part's hue (Right 3 "Off"). */
export const PartOff: Story = {
  args: { label: 'Off', size: 'cell', hue: 'r3', name: 'Right 3 off' },
  parameters: { layout: 'padded' },
};

/** The Left part lamp, lit. */
export const LeftOn: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 'l', name: 'Left on' },
  parameters: { layout: 'padded' },
};

/** A part lamp, absent: dashed and unfilled, the hollow LED still in Right 1's hue. */
export const PartDisabled: Story = {
  args: { label: 'On', size: 'cell', hue: 'r1', disabled: true, name: 'Right 1 on (no sound loaded)' },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Right 1 on (no sound loaded)' });
    await expect(button).toHaveAttribute('data-face', 'disabled');
    await expect(button).toHaveAttribute('data-hue', 'r1');
    await expect(button).toHaveAttribute('data-contrast', 'dim');
  },
};

/** A function lamp, off (Harm/Arp, L Hold, Looper). */
export const FunctionOff: Story = {
  args: { label: 'Harm/Arp', size: 'cell' },
  parameters: { layout: 'padded' },
};

/** A function lamp, latched: the solid neutral fill (Sound). */
export const FunctionOn: Story = {
  args: { label: 'Sound', size: 'cell', on: true },
  parameters: { layout: 'padded' },
};

/** The running lamp: the solid success fill (Start / Stop). */
export const Running: Story = {
  args: { label: 'Start / Stop', on: true, hue: 'ok' },
};

/** New: the metronome, a key that moves time, lit in the `transport` role hue with `--transport-text`. */
export const TransportOn: Story = {
  args: { label: 'Metronome', on: true, hue: 'transport' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Metronome' });
    await expect(button).toHaveAttribute('data-face', 'on');
    await expect(button).toHaveAttribute('data-hue', 'transport');
  },
};

/** New: the metronome off: a quiet key whose unlit LED keeps the transport hue. */
export const TransportOff: Story = {
  args: { label: 'Metronome', hue: 'transport' },
};

/** New: Auto Fill armed: the waiting ring and blinking LED in the transport hue. */
export const TransportWaiting: Story = {
  args: { label: 'Auto Fill', size: 'cell', waiting: true, hue: 'transport', name: 'Auto Fill, armed' },
  parameters: { layout: 'padded' },
};

/** The record lamp, lit: the solid danger fill. */
export const Recording: Story = {
  args: { label: 'Looper', size: 'cell', on: true, rec: true, name: 'Looper, recording' },
  parameters: { layout: 'padded' },
};

/** The Looper looping: lit as running (success), since looping is playback. */
export const Looping: Story = {
  args: { label: 'Looper', size: 'cell', on: true, hue: 'lamp', name: 'Looper, looping' },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Looper, looping' });
    await expect(button).toHaveAttribute('data-face', 'on');
    await expect(button).toHaveAttribute('data-hue', 'lamp');
  },
};

/** Loop armed: a 2px ring and blinking LED in the running colour over a faint wash of it. */
export const ArmedLoop: Story = {
  args: { label: 'Looper', size: 'cell', waiting: true, hue: 'lamp', name: 'Looper, loop armed' },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Looper, loop armed' });
    await expect(button).toHaveAttribute('data-face', 'waiting');
    await expect(button).toHaveAttribute('data-hue', 'lamp');
  },
};

/** Looper's Rec armed in the lamp row: the ring and blinking LED in record red. A click only asks. */
export const Armed: Story = {
  args: {
    label: 'Looper',
    size: 'cell',
    waiting: true,
    rec: true,
    name: 'Looper, rec armed. Long press: loop rec',
    tip: 'looper.rec',
  },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Looper, rec armed. Long press: loop rec' });
    await expect(button).toHaveAttribute('data-face', 'waiting');
    await expect(button).toHaveAttribute('data-hue', 'rec');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    await expect(args.onToggle).toHaveBeenCalledTimes(1);
    await expect(args.onToggle).toHaveBeenLastCalledWith(true);
    await expect(button).toHaveAttribute('data-face', 'waiting');
  },
};

/** Added: armed and pressed, Sync Start engaged and waiting for the first chord: the ring, sunk, LED blinking. */
export const ArmedPressed: Story = {
  args: { label: 'Sync Start', on: true, armed: true, name: 'Sync Start, waiting for a chord' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Sync Start, waiting for a chord' });
    await expect(button).toHaveAttribute('data-face', 'armed');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Added: `width` is a minimum, so a long label grows the key rather than clipping. */
export const MinWidth: Story = {
  args: { label: 'Off' },
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <LampButton label="Off" size="sm" width={64} />
      <LampButton label="Manual Bass" size="sm" width={64} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const long = within(canvasElement).getByRole('button', { name: 'Manual Bass' });
    const label = long.querySelector('.yh-lampbutton__label') as HTMLElement;
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
  },
};

/** Added: Metronome joined to its ▾ caret (the board's `join` pair), off and lit. */
export const JoinStart: Story = {
  args: { label: 'Metronome', join: 'start' },
  render: (args) => (
    <div className="lib-stack">
      {[false, true].map((on) => (
        <div key={String(on)} style={{ display: 'flex' }}>
          <LampButton {...args} on={on} />
          <LampButton label="▾" join="end" name="Metronome settings" width={32} />
        </div>
      ))}
    </div>
  ),
};

const HUES: LampHue[] = ['t', 'r1', 'r2', 'r3', 'l', 'ok', 'lamp'];
const FACES = [
  { face: 'Off', props: {} },
  { face: 'Armed', props: { waiting: true } },
  { face: 'On', props: { on: true } },
  { face: 'Armed on', props: { on: true, armed: true } },
  { face: 'Disabled', props: { disabled: true } },
] as const;

/** Added: every hue in every face, plus the record lamp, to judge the state language under each theme pack. */
export const AllFaces: Story = {
  args: { label: 'On' },
  parameters: { layout: 'padded' },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${HUES.length + 1}, minmax(0, 1fr))`,
        gap: 'var(--space-2)',
        alignItems: 'center',
        maxWidth: 760,
      }}
    >
      <span />
      {[...HUES, 'rec'].map((h) => (
        <span key={h} className="lib-field__label">{h}</span>
      ))}
      {FACES.map(({ face, props }) => (
        <div key={face} style={{ display: 'contents' }}>
          <span className="lib-field__label">{face}</span>
          {HUES.map((h) => (
            <LampButton key={h} label={face} size="cell" hue={h} name={`${h} ${face}`} {...props} />
          ))}
          <LampButton label={face} size="cell" rec name={`rec ${face}`} {...props} />
        </div>
      ))}
    </div>
  ),
};
