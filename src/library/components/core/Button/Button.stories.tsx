import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { EveryPack, withLibraryTheme } from '../../../storybook';
import type { ModeChoice } from '../../../theme';
import { packs } from '../../../themes/packs';
import { Icon as IconGlyph } from '../../../primitives/Icon';
import { Button, type ButtonProps } from './Button';
import { FACE_HUES, buttonArgTypes, buttonStories as s, faceRow, sizeRows } from './Button.fixtures';
import { instances } from '../../../fixtures';

// Every story's args come from Button.fixtures.ts, which the Svelte stories and the parity test share.
const meta = {
  title: 'Design OS/Components/Core/Button',
  component: Button,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onPress: fn(), onHold: fn(), onLongPress: fn(), onLongRelease: fn(), tipAction: fn() },
  argTypes: buttonArgTypes,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A primary-button pointer event's init (jsdom has no pointer capture). */
const pointer = (pointerId: number) => ({ pointerId, button: 0, clientX: 0, clientY: 0 });
/** Real time, longer than the 350 ms long press. */
const pastLongPress = () => new Promise((resolve) => setTimeout(resolve, 500));

/** The first Button on the Stage board: the Metronome ▾ caret, joined to its lamp, closed. */
export const Board: Story = {
  args: s.Board.args,
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
  args: s.Icon.args,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Help mode' });
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveAttribute('data-face', 'off');
  },
};

/** A band button switched on: Fade while fading, a ring and a lit dot in `--selected` (no fill: fading isn't sounding). */
export const BandOn: Story = {
  args: s.BandOn.args,
};

/** The on face: help mode switched on, a ring and a lit dot in `--selected`. */
export const On: Story = {
  args: s.On.args,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Help mode' });
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveAttribute('data-face', 'on');
  },
};

/** The chosen face: the applied One Touch, ink and a `--selected` rule along the bottom on the rest outline. */
export const Chosen: Story = {
  args: s.Chosen.args,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'One Touch 2, applied' });
    await expect(button).toHaveAttribute('data-face', 'chosen');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};

/** A band button: a wide transport key, the label left-aligned (Stop). */
export const Band: Story = {
  args: s.Band.args,
};

/** Start / Stop running (`bar`): the on face in `--success`, lit with the palette's bloom. */
export const Running: Story = {
  args: s.Running.args,
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
  args: s.Stopped.args,
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
  args: s.Waiting.args,
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
      {instances(s.WaitingFlash).map((item, i) => (
        <Button key={i} {...args} {...item} />
      ))}
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
      {instances(s.Role2).map((item, i) => (
        <Button key={i} {...args} {...item} />
      ))}
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
  args: s.Tall.args,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Start / Stop' });
    await expect(button).toHaveAttribute('data-tall', '');
  },
};

/** Shown, not pressable: a dashed edge and a `--text-3` label, a not-allowed cursor. No press, hold or long press. */
export const Disabled: Story = {
  args: s.Disabled.args,
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
  args: s.DisabledHue.args,
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
  args: s.Hold.args,
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
  args: s.LongPress.args,
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
      {instances(s.Hierarchy).map((item, i) => (
        <Button key={i} {...args} {...item} />
      ))}
    </div>
  ),
};

/** New: the quiet toggle (a panel's JSON switch) off, chosen and disabled. Chosen, it takes the pack's chosen-tab face. */
export const Quiet: Story = {
  render: (args) => (
    <div style={row}>
      {instances(s.Quiet).map((item, i) => (
        <Button key={i} {...args} {...item} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'JSON off' })).toHaveAttribute('data-face', 'off');
    await expect(canvas.getByRole('button', { name: 'JSON chosen' })).toHaveAttribute('data-face', 'chosen');
    await expect(canvas.getByRole('button', { name: 'JSON chosen' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'JSON disabled' })).toHaveAttribute('data-face', 'disabled');
  },
};

/** A sidebar glyph: a window with its left pane ruled off (the caller's own icon in an app). */
const sidebarIcon = (
  <IconGlyph size="body">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="9" y1="5" x2="9" y2="19" />
  </IconGlyph>
);

/** A panel's show/hide key: an icon-only quiet toggle with a name and a hover hint; chosen while the panel shows. */
function PanelToggle(props: Partial<ButtonProps>) {
  const [open, setOpen] = useState(false);
  return (
    <Button
      {...props}
      icon={sidebarIcon}
      size="icon"
      variant="quiet"
      name="Inspector"
      title={`${open ? 'Hide' : 'Show'} the inspector (⌘I)`}
      pressed={open}
      chosen={open}
      onPress={() => {
        props.onPress?.();
        setOpen((was) => !was);
      }}
    />
  );
}

/**
 * New: `icon` and `title`. An icon-only quiet toggle (visuals' sidebar and inspector keys), off and
 * chosen, in every pack: at rest a quiet glyph, chosen the pack's chosen-tab face (an underline, a
 * `--selected` block, a raised chip, or in visuals the ink alone), never the lit accent key. Press
 * the first to toggle it.
 */
export const IconToggle: Story = {
  render: (args, { globals }) => (
    <EveryPack mode={globals.mode as ModeChoice}>
      <div style={row}>
        <PanelToggle onPress={args.onPress} />
        {instances(s.IconToggle).slice(1).map((item, i) => (
          <Button key={i} icon={sidebarIcon} {...item} />
        ))}
      </div>
    </EveryPack>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const toggles = canvas.getAllByRole('button', { name: 'Inspector' });
    await expect(toggles).toHaveLength(packs.length);
    const first = toggles[0];
    await expect(first).toHaveAttribute('title', 'Show the inspector (⌘I)');
    await expect(first).toHaveAttribute('data-face', 'off');
    await expect(first.querySelector('[data-part="icon"]')).toHaveAttribute('aria-hidden', 'true');
    await expect(first.querySelector('[data-part="label"]')).toBeNull();
    await userEvent.click(first);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
    await expect(first).toHaveAttribute('aria-pressed', 'true');
    await expect(first).toHaveAttribute('data-face', 'chosen');
    await expect(first).toHaveAttribute('title', 'Hide the inspector (⌘I)');
    for (const chosen of canvas.getAllByRole('button', { name: 'Sources' })) {
      await expect(chosen).toHaveAttribute('data-face', 'chosen');
      await expect(chosen).toHaveAttribute('data-variant', 'quiet');
    }
  },
};

/** New: every face in every tone, to compare rest, waiting, on, chosen and disabled across hues. */
export const Faces: Story = {
  render: (args) => (
    <div style={grid}>
      {FACE_HUES.map((hue) => (
        <div key={hue} style={row}>
          {faceRow(hue).map((item, i) => (
            <Button key={i} {...args} {...item} />
          ))}
        </div>
      ))}
    </div>
  ),
};

/** New: the sizes in a row, plus the joined caret split (Metronome ▾) and a cell filling its track. */
export const Sizes: Story = {
  render: (args) => (
    <div style={grid}>
      {sizeRows.map((items, r) => (
        <div key={r} style={r === 0 ? row : r === 1 ? { ...row, gap: 0 } : { display: 'flex', width: 240 }}>
          {items.map((item, i) => (
            <Button key={i} {...args} {...item} />
          ))}
        </div>
      ))}
    </div>
  ),
};
