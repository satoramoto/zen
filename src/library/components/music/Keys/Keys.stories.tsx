import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Keys } from './Keys';
import { keysArgTypes, keysStories as s, range61 } from './Keys.fixtures';
import { BLACK_WIDTH_RATIO, layout } from './keyLayout';

// Every story's args come from Keys.fixtures.ts, which the Svelte stories and the parity test share.
const meta = {
  title: 'Design OS/Components/Music/Keys',
  component: Keys,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    ...s.Board.args,
    tipAction: fn(),
    onSplit: fn(),
    onPick: fn(),
  },
  argTypes: keysArgTypes,
} satisfies Meta<typeof Keys>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A pointer event's client point `x` px from the strip's left and `yShare` of its height down, at whatever scale it is drawn. */
function at(strip: HTMLElement, width: number, x: number, yShare: number) {
  const box = strip.getBoundingClientRect();
  const scale = box.width > 0 ? box.width / width : 1;
  return { clientX: box.left + x * scale, clientY: box.top + yShare * box.height, button: 0, pointerId: 1 };
}

/** The Stage board: 61 keys, split F#2, the left hand's Am7 in hue 4, E4 and A4 in hue 1 ("Right 1"). */
export const Board: Story = {
  args: s.Board.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('slider', { name: /^Split point/ });
    await expect(handle).toHaveAttribute('aria-valuetext', 'F#2');
    await expect(handle).toHaveAttribute('data-tip', 'settings.split_strip');
    await expect(args.tipAction).toHaveBeenCalledWith(handle, 'settings.split_strip');
    // Arrows step one semitone, black keys included; PageUp an octave.
    handle.focus();
    await fireEvent.keyDown(handle, { key: 'ArrowRight' });
    await expect(args.onSplit).toHaveBeenLastCalledWith(55);
    await fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    await expect(args.onSplit).toHaveBeenLastCalledWith(53);
    await fireEvent.keyDown(handle, { key: 'PageUp' });
    await expect(args.onSplit).toHaveBeenLastCalledWith(66);
    // Unarmed, pressing on the keys picks nothing: there is no pick surface to press.
    await expect(canvasElement.querySelector('.yh-keys__pick')).toBeNull();
    // Drawn as keys: the faces are painted, and sharps differ from naturals, under every pack.
    const face = (selector: string) => getComputedStyle(canvasElement.querySelector(selector)!).backgroundColor;
    const white = face('.yh-keys__white:not([data-held])');
    await expect(white).not.toBe('rgba(0, 0, 0, 0)');
    await expect(face('.yh-keys__black:not([data-held])')).not.toBe(white);
  },
};

/** Nothing held: the split and the zones' unlit lamps only. */
export const Idle: Story = {
  args: s.Idle.args,
};

/**
 * A split on a black key, C#3: the left zone takes C#3, and the split line runs up C#3's right edge
 * beside the black keys, then steps across to the C|D white edge below them.
 */
export const BlackKeySplit: Story = {
  args: s.BlackKeySplit.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: /^Keys: split C#3/ })).toBeInTheDocument();
    await expect(canvasElement.querySelector('.yh-keys__split')).toHaveAttribute('data-step', '1');
    await expect(canvasElement.querySelector('.yh-keys__split-join')).not.toBeNull();
    await expect(canvas.getByRole('slider', { name: /^Split point/ })).toHaveAttribute('aria-valuetext', 'C#3');
  },
};

/**
 * Dragging the split flag: past a few px the key under the pointer (black keys by position) becomes
 * the split. Here from C3 to F#2, a black key.
 */
export const Drag: Story = {
  args: s.Drag.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('slider', { name: /^Split point/ });
    const strip = canvas.getByRole('img', { name: /^Keys:/ });
    const width = typeof args.width === 'number' ? args.width : 1392;
    const keys = layout(args.range ?? range61, width, 60, [], []);
    const fs2 = keys.blacks.find((key) => key.note === 54)?.x ?? 0;
    const c3 = keys.splitX ?? 0;
    await fireEvent.pointerDown(handle, at(strip, width, c3, 0.5));
    await fireEvent.pointerMove(handle, at(strip, width, fs2, 0.5));
    await fireEvent.pointerUp(handle, at(strip, width, fs2, 0.5));
    await expect(args.onSplit).toHaveBeenLastCalledWith(54);
    // A drag is not a click: it doesn't arm the pick.
    await expect(args.onPick).not.toHaveBeenCalled();
    // A click on the handle (no movement) arms it.
    await fireEvent.pointerDown(handle, at(strip, width, c3, 0.5));
    await fireEvent.pointerUp(handle, at(strip, width, c3, 0.5));
    await expect(args.onPick).toHaveBeenLastCalledWith(true);
  },
};

/**
 * Armed (`picking`): an accent ring round the keys, a crosshair and a hint. Pressing a key makes it
 * the split (F#2 here, a black key, pressed up top; G2 below it, its white key) and lifting
 * disarms. Esc disarms too.
 */
export const Armed: Story = {
  args: s.Armed.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const strip = canvas.getByRole('img', { name: /^Keys:/ });
    const pick = canvasElement.querySelector('.yh-keys__pick') as HTMLElement;
    await expect(pick).not.toBeNull();
    await expect(canvas.getByRole('slider', { name: /click a key to set it/ })).toBeInTheDocument();
    const width = typeof args.width === 'number' ? args.width : 1392;
    const keys = layout(args.range ?? range61, width, 60, [], []);
    const fs2 = keys.blacks.find((key) => key.note === 54)?.x ?? 0;
    await fireEvent.pointerDown(pick, at(strip, width, fs2, 0.2));
    await expect(args.onSplit).toHaveBeenLastCalledWith(54);
    await fireEvent.pointerUp(pick, at(strip, width, fs2, 0.2));
    await expect(args.onPick).toHaveBeenLastCalledWith(false);
    const beside = fs2 + (keys.whiteWidth * BLACK_WIDTH_RATIO) / 4;
    await fireEvent.pointerDown(pick, at(strip, width, beside, 0.9));
    await expect(args.onSplit).toHaveBeenLastCalledWith(55);
    await fireEvent.keyDown(window, { key: 'Escape' });
    await expect(args.onPick).toHaveBeenLastCalledWith(false);
  },
};

/** Locked: the flag is dashed with no grip, the arrows and a drag ask for nothing, and the pick won't arm. */
export const Locked: Story = {
  args: s.Locked.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('slider', { name: 'Split point (locked)' });
    await expect(handle).toHaveAttribute('aria-disabled', 'true');
    await expect(canvasElement.querySelector('.yh-keys__pick')).toBeNull();
    handle.focus();
    await fireEvent.keyDown(handle, { key: 'ArrowRight' });
    await fireEvent.keyDown(handle, { key: 'Enter' });
    await expect(args.onSplit).not.toHaveBeenCalled();
    await expect(args.onPick).not.toHaveBeenCalled();
  },
};

/** No split: one zone, every held key in the right zone's hue (here hue 2, "Right 2", with a black key). */
export const NoSplit: Story = {
  args: s.NoSplit.args,
};

/** A 49-key keyboard at a narrower width, split B2, held black keys in both zones. */
export const Keys49: Story = {
  args: s.Keys49.args,
};

/** The full 61 keys with the right zone ("Right 1") playing high, split at C3. */
export const HighSplit: Story = {
  args: s.HighSplit.args,
};

/** Added: without `onSplit` the keys are a picture: the split's name sits on the ruler, nothing to grab. */
export const Picture: Story = {
  args: { ...s.Picture.args, onSplit: undefined },
};

/**
 * Added: `ruler={false}`, just the keys (as the Yahaha Stage draws them): no zone names, held
 * list or split name above; the held keys keep their zone's hue, so the split still reads.
 */
export const NoRuler: Story = {
  args: { ...s.NoRuler.args, onSplit: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.yh-keys__ruler')).toBeNull();
    await expect(canvasElement.querySelector(".yh-keys__white[data-held='left']")).toHaveAttribute('data-hue', '4');
  },
};

/**
 * Added: `width="fill"` in a container 80% of the canvas wide, resizable from its corner: the keys
 * fill it and re-lay on every resize, with nothing measured by the caller. Here in hue 5.
 */
export const Fluid: Story = {
  args: s.Fluid.args,
  argTypes: { width: { control: false } },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: '80%', minWidth: 240, resize: 'horizontal', overflow: 'hidden', paddingBottom: 8 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('.yh-keys') as HTMLElement;
    const container = root.parentElement as HTMLElement;
    await expect(root).toHaveAttribute('data-width', 'fill');
    await expect(root).not.toHaveAttribute('data-unmeasured');
    // The keys span the container: the last white key ends at its right edge.
    const whites = canvasElement.querySelectorAll<HTMLElement>('.yh-keys__white');
    const last = whites[whites.length - 1].getBoundingClientRect();
    await expect(Math.abs(last.right - root.getBoundingClientRect().right)).toBeLessThan(2);
    await expect(Math.abs(root.clientWidth - container.clientWidth)).toBeLessThan(2);
  },
};

/** Added: a narrow strip (49 keys at 480px), where the zone labels give way before the keys do. */
export const Narrow: Story = {
  args: s.Narrow.args,
};
