import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { LampButton, type LampHue } from './LampButton';

const meta = {
  title: 'Design OS/Components/Core/LampButton',
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
    hue: { control: 'select', options: ['t', 1, 2, 3, 4, 'ok', 'lamp', 'role-2'] },
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

/** Lit: a double-weight outline in ink and a lit LED; the key stays raised, no fill (it isn't sounding). */
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

/** A hued lamp, lit: the outline and LED in hue slot 1 (in Yahaha, a part's "On"). */
export const HueOn: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 1, name: 'Channel 1 on' },
  parameters: { layout: 'padded' },
};

/** A hued lamp, lit, in hue slot 2. */
export const HueOn2: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 2, name: 'Channel 2 on' },
  parameters: { layout: 'padded' },
};

/** A hued lamp, off: the key is neutral, the unlit LED keeps its hue (slot 3). */
export const HueOff: Story = {
  args: { label: 'Off', size: 'cell', hue: 3, name: 'Channel 3 off' },
  parameters: { layout: 'padded' },
};

/** A hued lamp in slot 4, lit. */
export const HueOn4: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 4, name: 'Channel 4 on' },
  parameters: { layout: 'padded' },
};

/** A hued lamp, absent: dashed and unfilled, the hollow LED still in hue slot 1. */
export const HueDisabled: Story = {
  args: { label: 'On', size: 'cell', hue: 1, disabled: true, name: 'Channel 1 on (no sound loaded)' },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Channel 1 on (no sound loaded)' });
    await expect(button).toHaveAttribute('data-face', 'disabled');
    await expect(button).toHaveAttribute('data-hue', '1');
    await expect(button).toHaveAttribute('data-contrast', 'dim');
  },
};

/** A function lamp, off (Harm/Arp, L Hold, Looper). */
export const FunctionOff: Story = {
  args: { label: 'Harm/Arp', size: 'cell' },
  parameters: { layout: 'padded' },
};

/** A function lamp, latched: the neutral outline and a lit LED (Sound). */
export const FunctionOn: Story = {
  args: { label: 'Sound', size: 'cell', on: true },
  parameters: { layout: 'padded' },
};

/** The running lamp: the solid success fill (Start / Stop), one of the few faces that fill, because the band is running. */
export const Running: Story = {
  args: { label: 'Start / Stop', on: true, hue: 'ok' },
};

/** New: a `role-2` lamp lit (in Yahaha, the metronome): the outline and LED in the second role hue. */
export const Role2On: Story = {
  args: { label: 'Metronome', on: true, hue: 'role-2' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Metronome' });
    await expect(button).toHaveAttribute('data-face', 'on');
    await expect(button).toHaveAttribute('data-hue', 'role-2');
  },
};

/** New: a `role-2` lamp off: a quiet key with a neutral unlit LED. A role-2 key wears its hue only while active. */
export const Role2Off: Story = {
  args: { label: 'Metronome', hue: 'role-2' },
};

/** New: a `role-2` lamp armed: the waiting ring and blinking LED in the role hue. */
export const Role2Waiting: Story = {
  args: { label: 'Auto Fill', size: 'cell', waiting: true, hue: 'role-2', name: 'Auto Fill, armed' },
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

/** Added: armed and pressed, Sync Start engaged and waiting for the first chord: the on outline with its LED blinking. */
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
    <div className="lib-specimens">
      {[false, true].map((on) => (
        <div key={String(on)} style={{ display: 'flex' }}>
          <LampButton {...args} on={on} />
          <LampButton label="▾" join="end" name="Metronome settings" width={32} />
        </div>
      ))}
    </div>
  ),
};

const HUES: LampHue[] = ['t', 1, 2, 3, 4, 'ok', 'lamp', 'role-2'];
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
        gridTemplateColumns: `auto repeat(${HUES.length + 1}, minmax(max-content, 1fr))`,
        gap: 'var(--space-2)',
        alignItems: 'center',
        justifyContent: 'start',
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
