import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Button, type ButtonHue } from './Button';

const NONE = 'none';
const SIZES = ['icon', 'md', 'band', 'pair', 'cell', 'caret'];
/** The hues that draw a distinct look (the deprecated `t2` and `m` draw as `t`, so they're left out). */
const HUES: ButtonHue[] = ['t', 'a', 'lamp', 'rec', 'ok', 'role-2', 1, 2, 3, 4, 'intro', 'main', 'ending', 'brk', 'fill'];
const SYMBOLS = ['prev', 'next', 'up', 'down', 'plus', 'minus', 'caret'];
/** A select whose first option is `none` (undefined), so the control can go back to "no value". */
const optional = (options: string[]) => ({ control: 'select' as const, options: [NONE, ...options], mapping: { [NONE]: undefined } });
/** none / false / true, for a boolean whose undefined means "no attribute". */
const threeWay = {
  control: 'select' as const,
  options: [NONE, 'false', 'true'],
  mapping: { [NONE]: undefined, false: false, true: true },
};

const meta = {
  title: 'Design OS/Components/Core/Button',
  component: Button,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onPress: fn(), onHold: fn(), onLongPress: fn(), onLongRelease: fn(), tipAction: fn() },
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    controls: { control: 'text' },
    tip: { control: 'text' },
    compact: { control: 'boolean' },
    strong: { control: 'boolean' },
    on: { control: 'boolean' },
    chosen: { control: 'boolean' },
    waiting: { control: 'boolean' },
    lit: { control: 'boolean' },
    tall: { control: 'boolean' },
    expanded: { control: 'boolean' },
    disabled: { control: 'boolean' },
    hold: { control: 'boolean' },
    size: { control: 'select', options: SIZES },
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'quiet'] },
    hue: { control: 'select', options: HUES },
    symbol: optional(SYMBOLS),
    join: optional(['start', 'end']),
    popup: optional(['dialog', 'menu']),
    bar: threeWay,
    pressed: threeWay,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A primary-button pointer event's init (jsdom has no pointer capture). */
const pointer = (pointerId: number) => ({ pointerId, button: 0, clientX: 0, clientY: 0 });
/** Real time, longer than the 350 ms long press. */
const pastLongPress = () => new Promise((resolve) => setTimeout(resolve, 500));

/** The first Button on the Stage board: the Metronome ▾ caret, joined to its lamp, closed. */
export const Board: Story = {
  args: {
    symbol: 'caret',
    size: 'caret',
    join: 'end',
    popup: 'dialog',
    expanded: false,
    name: 'Metronome settings',
    tip: 'metronome.settings',
  },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Metronome settings' });
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).not.toHaveAttribute('aria-pressed');
    await expect(button).not.toHaveAttribute('aria-disabled');
    await expect(button).toHaveAttribute('data-face', 'off');
    await expect(button).toHaveAttribute('data-tip', 'metronome.settings');
    await expect(args.tipAction).toHaveBeenCalledWith(button, 'metronome.settings');
    await userEvent.click(button);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
  },
};

/** Help mode's ?: a square key at rest (hairline outline, ink label), a switch that is off. */
export const Icon: Story = {
  args: { label: '?', size: 'icon', pressed: false, name: 'Help mode' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Help mode' });
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveAttribute('data-face', 'off');
  },
};

/** A band button switched on: Fade while fading, a ring and a lit dot in `--selected` (no fill: fading isn't sounding). */
export const BandOn: Story = {
  args: { label: 'Fade', size: 'band', on: true, pressed: true },
};

/** The on face: help mode switched on, a ring and a lit dot in `--selected`. */
export const On: Story = {
  args: { label: '?', size: 'icon', on: true, pressed: true, name: 'Help mode' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Help mode' });
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveAttribute('data-face', 'on');
  },
};

/** The chosen face: the applied One Touch, ink and a `--selected` rule along the bottom on the rest outline. */
export const Chosen: Story = {
  args: { label: '2', size: 'icon', chosen: true, pressed: true, name: 'One Touch 2, applied' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'One Touch 2, applied' });
    await expect(button).toHaveAttribute('data-face', 'chosen');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};

/** A band button: a wide transport key, the label left-aligned (Stop). */
export const Band: Story = {
  args: { label: 'Stop', size: 'band', name: 'Stop (fade with hold)' },
};

/** Start / Stop running (`bar`): the on face in `--success`, lit with the palette's bloom. */
export const Running: Story = {
  args: {
    label: 'Start / Stop',
    size: 'band',
    compact: true,
    strong: true,
    bar: true,
    pressed: true,
    name: 'Start / Stop, running',
    tip: 'transport.start_stop',
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Start / Stop, running' });
    await expect(button).toHaveAttribute('data-bar');
    await expect(button).toHaveAttribute('data-face', 'on');
    await expect(button).toHaveAttribute('data-hue', 'ok');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Start / Stop stopped (`bar: false`): the rest face. */
export const Stopped: Story = {
  args: { ...Running.args, bar: false, pressed: false, name: 'Start / Stop' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Start / Stop' });
    await expect(button).not.toHaveAttribute('data-bar');
    await expect(button).toHaveAttribute('data-face', 'off');
    await expect(button).toHaveAttribute('data-hue', 't');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  },
};

/** The waiting face: Fade armed, a double-weight ring over a faint tint, the label in ink. */
export const Waiting: Story = {
  args: {
    label: 'Fade',
    size: 'pair',
    waiting: true,
    pressed: false,
    name: 'Fade, armed',
    tip: 'transport.fade',
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Fade, armed' });
    await expect(button).toHaveAttribute('data-face', 'waiting');
    await expect(button).toHaveAttribute('data-hue', 't');
  },
};

/** New: the waiting face's flash, both phases side by side; the parent drives `lit`, the label stays. */
export const WaitingFlash: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <Button {...args} label="Fade" size="pair" waiting lit name="Fade, armed, lit" />
      <Button {...args} label="Fade" size="pair" waiting lit={false} name="Fade, armed, unlit" />
      <Button {...args} label="On" size="pair" hue={1} waiting lit name="Hue 1, armed, lit" />
      <Button {...args} label="On" size="pair" hue={1} waiting lit={false} name="Hue 1, armed, unlit" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Fade, armed, unlit' })).toHaveAttribute('data-lit', 'false');
    await expect(canvas.getByRole('button', { name: 'Fade, armed, lit' })).not.toHaveAttribute('data-lit');
  },
};

/**
 * New: the `role-2` tone, the second role hue (in Yahaha, the keys that move time), worn only while
 * active. Start stopped is the primary key filled in `--role-2` with `--role-2-text`; Sync Start
 * and Tempo + at rest are neutral; Sync Start armed and a queued fill ring in it (the waiting ring
 * still says "armed" by shape); Tap on is a role-2 ring and dot; Stop running stays `ok`, solid,
 * because running is a state.
 */
export const Role2: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
      <Button {...args} label="Start" size="band" variant="primary" hue="role-2" tall name="Start / Stop, stopped" />
      <Button {...args} label="Stop" size="band" hue="role-2" bar tall name="Start / Stop, running" />
      <Button {...args} label="Sync Start" size="md" hue="role-2" name="Sync Start" />
      <Button {...args} label="Sync Start" size="md" hue="role-2" waiting name="Sync Start, armed" />
      <Button {...args} label="Fill" symbol="up" size="md" hue="role-2" waiting lit={false} name="Fill up, queued, unlit" />
      <Button {...args} label="Tap" size="pair" hue="role-2" on name="Tap, on" />
      <Button {...args} symbol="plus" size="icon" hue="role-2" name="Tempo up" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Start / Stop, stopped' })).toHaveAttribute('data-hue', 'role-2');
    await expect(canvas.getByRole('button', { name: 'Start / Stop, running' })).toHaveAttribute('data-hue', 'ok');
    await expect(canvas.getByRole('button', { name: 'Start / Stop, running' })).toHaveAttribute('data-solid');
    await expect(canvas.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('data-face', 'waiting');
    await expect(canvas.getByRole('button', { name: 'Tap, on' })).not.toHaveAttribute('data-solid');
    // At rest a role-2 key is neutral: its outline is the rest line, not the role hue.
    const rest = getComputedStyle(canvas.getByRole('button', { name: 'Sync Start' })).boxShadow;
    const armed = getComputedStyle(canvas.getByRole('button', { name: 'Sync Start, armed' })).boxShadow;
    await expect(rest).not.toBe(armed);
    // A key never truncates its name: the tall Start holds its whole label.
    const start = canvas.getByRole('button', { name: 'Start / Stop, stopped' });
    const label = start.querySelector('.yh-button__label') as HTMLElement;
    await expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(start.getBoundingClientRect().right);
  },
};

/** New: a tall primary key, Start / Stop leading the transport: two control rows high, the label at heading size. */
export const Tall: Story = {
  args: { label: 'Start', size: 'band', variant: 'primary', tall: true, name: 'Start / Stop' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Start / Stop' });
    await expect(button).toHaveAttribute('data-tall', '');
  },
};

/** Shown, not pressable: a dashed edge and a `--text-3` label, a not-allowed cursor. No press, hold or long press. */
export const Disabled: Story = {
  args: { label: 'Audition', size: 'md', compact: true, disabled: true, name: 'Audition (stop the band first)' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Audition (stop the band first)' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAttribute('data-face', 'disabled');
    await expect(button).toHaveAttribute('data-contrast', 'dim');
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPress).not.toHaveBeenCalled();
    await fireEvent.pointerDown(button, pointer(1));
    await pastLongPress();
    await fireEvent.pointerUp(button, pointer(1));
    await expect(args.onLongPress).not.toHaveBeenCalled();
    await expect(args.onHold).not.toHaveBeenCalled();
  },
};

/** A section button, absent: the same dashed edge and `--text-3` label as every disabled key; the label still names the Fill key. */
export const DisabledHue: Story = {
  args: { label: 'Fill', symbol: 'up', size: 'pair', hue: 'fill', disabled: true, name: 'Fill up (none in this style)' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Fill up (none in this style)' });
    await expect(button).toHaveAttribute('data-face', 'disabled');
    await expect(button).toHaveAttribute('data-hue', 'fill');
    await expect(button).toHaveAttribute('data-contrast', 'dim');
  },
};

/**
 * Repeat-while-held (Tempo +): pointer down and up call `onHold`, following only the pointer that
 * started the hold; a pointer click doesn't press, a keyboard click does; no long press.
 */
export const Hold: Story = {
  args: { label: 'Tempo', symbol: 'plus', size: 'band', hold: true, name: 'Tempo up (Scene Launch)', tip: 'tempo.up' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Tempo up (Scene Launch)' });
    await fireEvent.pointerDown(button, pointer(1));
    await expect(args.onHold).toHaveBeenCalledTimes(1);
    await expect(args.onHold).toHaveBeenLastCalledWith(true);
    await fireEvent.pointerDown(button, pointer(2));
    await fireEvent.pointerUp(button, pointer(2));
    await expect(args.onHold).toHaveBeenCalledTimes(1);
    await fireEvent.pointerUp(button, pointer(1));
    await expect(args.onHold).toHaveBeenCalledTimes(2);
    await expect(args.onHold).toHaveBeenLastCalledWith(false);
    await fireEvent.pointerUp(button, pointer(1));
    await expect(args.onHold).toHaveBeenCalledTimes(2);
    await fireEvent.pointerDown(button, pointer(3));
    await fireEvent.pointerCancel(button, pointer(3));
    await expect(args.onHold).toHaveBeenCalledTimes(4);
    await expect(args.onHold).toHaveBeenLastCalledWith(false);

    await fireEvent.click(button, { detail: 1 });
    await expect(args.onPress).not.toHaveBeenCalled();
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPress).toHaveBeenCalledTimes(1);

    await fireEvent.pointerDown(button, pointer(4));
    await pastLongPress();
    await expect(args.onLongPress).not.toHaveBeenCalled();
    await fireEvent.pointerUp(button, pointer(4));
    await expect(args.onLongRelease).not.toHaveBeenCalled();
  },
};

/**
 * The long press: held past 350 ms it calls `onLongPress`, its release `onLongRelease`, and the
 * click that ends it is swallowed. A short click still presses; a right-click long-presses.
 */
export const LongPress: Story = {
  args: { label: 'Stop', size: 'band', tip: 'transport.stop' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Stop' });
    await fireEvent.pointerDown(button, pointer(1));
    await expect(args.onLongPress).not.toHaveBeenCalled();
    await waitFor(() => expect(args.onLongPress).toHaveBeenCalledTimes(1), { timeout: 1000 });
    await fireEvent.pointerUp(button, pointer(1));
    await expect(args.onLongRelease).toHaveBeenCalledTimes(1);
    await fireEvent.click(button);
    await expect(args.onPress).not.toHaveBeenCalled();
    await userEvent.click(button);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
    await fireEvent.contextMenu(button);
    await expect(args.onLongPress).toHaveBeenCalledTimes(2);
  },
};

const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' } as const;
const grid = { display: 'grid', gap: 'var(--space-3)' } as const;

/** New: the three ranks side by side. One primary per screen; secondary keys; quiet steps. */
export const Hierarchy: Story = {
  render: (args) => (
    <div style={row}>
      <Button {...args} label="Start" size="band" variant="primary" />
      <Button {...args} label="Stop" size="band" />
      <Button {...args} label="Reset" size="md" variant="quiet" />
      <Button {...args} symbol="prev" size="icon" variant="quiet" name="Previous style" />
      <Button {...args} symbol="next" size="icon" variant="quiet" name="Next style" />
    </div>
  ),
};

/** New: every face in every tone, to compare rest, waiting, on, chosen and disabled across hues. */
export const Faces: Story = {
  render: (args) => (
    <div style={grid}>
      {HUES.filter((h) => h !== 'lamp').map((hue) => (
        <div key={hue} style={row}>
          <Button {...args} hue={hue} label={String(hue)} size="pair" />
          <Button {...args} hue={hue} label={String(hue)} size="pair" waiting />
          <Button {...args} hue={hue} label={String(hue)} size="pair" on />
          <Button {...args} hue={hue} label={String(hue)} size="pair" chosen />
          <Button {...args} hue={hue} label={String(hue)} size="pair" disabled />
        </div>
      ))}
    </div>
  ),
};

/** New: the sizes in a row, plus the joined caret split (Metronome ▾) and a cell filling its track. */
export const Sizes: Story = {
  render: (args) => (
    <div style={grid}>
      <div style={row}>
        <Button {...args} label="?" size="icon" name="Help mode" />
        <Button {...args} label="Panic" size="md" />
        <Button {...args} label="Stop" size="band" />
        <Button {...args} label="Fill" symbol="up" size="pair" />
        <Button {...args} label="Fill" symbol="down" size="pair" />
      </div>
      <div style={{ ...row, gap: 0 }}>
        <Button {...args} label="Metronome" size="md" join="start" />
        <Button {...args} symbol="caret" size="caret" join="end" popup="dialog" name="Metronome settings" />
      </div>
      <div style={{ display: 'flex', width: 240 }}>
        <Button {...args} label="Audition" size="cell" />
      </div>
    </div>
  ),
};
