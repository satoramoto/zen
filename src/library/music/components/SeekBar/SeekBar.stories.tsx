import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import { scenario, type PlayContext } from 'story-spec';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { withLibraryTheme } from '../../../storybook';
import { withMusicScope } from '../../preview.story';
import { SeekBar } from './SeekBar';
import SeekBarSvelte from './SeekBar.svelte';
import { SeekBarHost } from './SeekBarHost.story';
import SeekBarHostSvelte from './SeekBarHost.story.svelte';

// The seek bar's spec is these stories: each is a scenario of one of two requirements, and
// `story-spec sync` writes the music-seek-bar spec from them. The play runs the scenario's When
// and Then as steps, in React and (Renderer: Svelte) in Svelte alike. A scenario that presses at
// a place on the slider measures its box, so it is tagged browser: it plays in a real browser,
// not on zen-stories' virtual DOM.
const meta = {
  id: 'music-seek-bar', title: 'Music/Components/SeekBar', component: SeekBar,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  args: { duration: 120, position: 20, label: 'Playback position', onSeek: fn() },
  parameters: {
    layout: 'padded',
    spec: {
      capability: 'music-seek-bar',
      purpose: 'A controlled slider over a track: the host holds the position, the bar reports where the listener wants to go.',
      requirement: 'Seeking by pointer and keyboard',
      shall: "The seek bar SHALL report every pointer press, drag and Home, End or arrow key as an onSeek call in seconds, SHALL show the dragged position while a press lasts and the host's position once it ends, and SHALL clamp what it shows to the duration.",
    },
  },
} satisfies Meta<typeof SeekBar>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SeekBar, SeekBarSvelte);
const host = fixtureStories<Story>(SeekBarHost, SeekBarHostSvelte);
/** The host story: a SeekBar whose host moves its own position with a button. */
const hosted = (): Story => ({ ...host({ args: {} }), render: args => <SeekBarHost {...args} /> });
const tick = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const slider = (c: PlayContext) => within(c.canvasElement).getByRole('slider');
const onSeek = (c: PlayContext) => c.args.onSeek as ReturnType<typeof fn>;
/** A pointer pressed on the slider `at` (0: its left edge, 1: its right), settled for a frame. */
async function press(c: PlayContext, at: number, pointerId = 71) {
  const el = slider(c);
  const box = el.getBoundingClientRect();
  const pointer = { pointerId, button: 0, clientY: box.y + box.height / 2 };
  await fireEvent.pointerDown(el, { ...pointer, clientX: box.x + box.width * at });
  await tick();
  return { el, box, pointer };
}
/** A press at the middle, dragged to the right edge and settled. */
async function drag(c: PlayContext) {
  const pressing = await press(c, 0.5);
  await fireEvent.pointerMove(pressing.el, { ...pressing.pointer, clientX: pressing.box.right });
  await tick();
  return pressing;
}

export const PressSeeks: Story = { ...scenario({
  when: 'the pointer presses the slider at its middle',
  then: 'onSeek is called with 60 and the slider reads 60 while the press lasts',
  act: c => press(c, 0.5),
  check: async c => {
    await expect(onSeek(c)).toHaveBeenLastCalledWith(60);
    await expect(slider(c)).toHaveAttribute('aria-valuenow', '60');
  },
}, story({ args: {} })), tags: ['browser'] };

export const DragFollows: Story = { ...scenario({
  given: 'a press at the middle',
  when: 'the pointer drags to the right edge',
  then: "onSeek's last call is 120, where the drag is",
  act: drag,
  check: async c => { await expect(onSeek(c).mock.lastCall?.[0]).toBeCloseTo(120, 5); },
}, story({ args: {} })), tags: ['browser'] };

export const ReleaseShowsTheHost: Story = { ...scenario({
  given: 'a drag from the middle to the right edge',
  when: 'the pointer releases',
  then: "the slider shows the host's position, 20, not where the drag ended",
  act: async c => {
    const { el, pointer } = await drag(c);
    await fireEvent.pointerUp(el, pointer);
  },
  check: async c => { await waitFor(() => expect(slider(c)).toHaveAttribute('aria-valuenow', '20')); },
}, story({ args: {} })), tags: ['browser'] };

export const KeysSeek: Story = scenario({
  when: 'Home, ArrowLeft, End and ArrowRight are pressed in turn',
  then: 'onSeek is called with 0, 0, 120 and 120',
  act: async c => { for (const key of ['Home', 'ArrowLeft', 'End', 'ArrowRight']) await fireEvent.keyDown(slider(c), { key }); },
  check: async c => {
    await expect(onSeek(c)).toHaveBeenCalledTimes(4);
    await expect(onSeek(c).mock.calls.map(call => call[0])).toEqual([0, 0, 120, 120]);
  },
}, story({ args: {} }));

/** How many onSeek calls EscapeCancels' press made, before its move and Escape. */
let callsOfThePress = 0;
export const EscapeCancels: Story = { ...scenario({
  given: 'a press at the left edge, which seeks to 0',
  when: 'the pointer moves to the right edge and Escape is pressed',
  then: 'no further onSeek call is made and the slider shows 20 again',
  act: async c => {
    const { el, box, pointer } = await press(c, 0);
    await expect(onSeek(c)).toHaveBeenLastCalledWith(0);
    callsOfThePress = onSeek(c).mock.calls.length;
    await fireEvent.pointerMove(el, { ...pointer, clientX: box.right });
    await fireEvent.keyDown(el, { key: 'Escape' });
    await tick();
  },
  check: async c => {
    await expect(onSeek(c)).toHaveBeenCalledTimes(callsOfThePress);
    await expect(slider(c)).toHaveAttribute('aria-valuenow', '20');
  },
}, story({ args: {} })), tags: ['browser'] };

/** A press at the left edge that ends with `type` instead of a pointerup. */
const endsWithout = (type: string) => async (c: PlayContext) => {
  const { el } = await press(c, 0);
  await fireEvent(el, new PointerEvent(type, { bubbles: true, pointerId: 71 }));
  await tick();
};
const showsTheHost = async (c: PlayContext) => { await expect(slider(c)).toHaveAttribute('aria-valuenow', '20'); };

export const PointerCancelRestores: Story = { ...scenario({
  given: 'a press at the left edge',
  when: 'the browser sends pointercancel instead of pointerup',
  then: 'the slider shows 20 again',
  act: endsWithout('pointercancel'),
  check: showsTheHost,
}, story({ args: {} })), tags: ['browser'] };

export const LostCaptureRestores: Story = { ...scenario({
  given: 'a press at the left edge',
  when: 'the browser sends lostpointercapture instead of pointerup',
  then: 'the slider shows 20 again',
  act: endsWithout('lostpointercapture'),
  check: showsTheHost,
}, story({ args: {} })), tags: ['browser'] };

export const OutOfRange: Story = scenario({
  given: 'a host position of 999 on a 120-second track',
  when: 'the slider is drawn',
  then: 'it reads the duration, 120',
  check: async c => { await expect(slider(c)).toHaveAttribute('aria-valuenow', '120'); },
}, story({ args: {} }, { args: { position: 999 } }));

/** A press at the middle, during which the host moves its position to 35. */
async function hostMoves(c: PlayContext) {
  await press(c, 0.5, 9);
  await expect(slider(c)).toHaveAttribute('aria-valuenow', '60');
  await fireEvent.click(within(c.canvasElement).getByRole('button', { name: 'Update host position' }));
  await tick();
}

export const HostUpdateWaits: Story = { ...scenario({
  given: 'a press at the middle, so the slider reads 60',
  when: 'the host moves its position to 35 during the press',
  then: "the slider keeps the press's 60",
  act: hostMoves,
  check: async c => { await expect(slider(c)).toHaveAttribute('aria-valuenow', '60'); },
}, hosted()), tags: ['browser'] };

export const HostUpdateShowsOnRelease: Story = { ...scenario({
  given: 'a press at the middle during which the host moved its position to 35',
  when: 'the pointer releases',
  then: "the slider shows the host's 35",
  act: async c => {
    await hostMoves(c);
    await fireEvent.pointerUp(slider(c), { pointerId: 9 });
  },
  check: async c => { await waitFor(() => expect(slider(c)).toHaveAttribute('aria-valuenow', '35')); },
}, hosted()), tags: ['browser'] };

/** The inert states: one requirement, three scenarios that differ only in why the bar is inert. */
const inert = (given: string, args: Story['args']) => scenario({
  requirement: 'Inert states',
  shall: 'The seek bar SHALL be inert, marked aria-disabled and never calling onSeek, when it is disabled, when the duration is zero, and when the duration or position is not finite.',
  given,
  when: 'the slider is pressed and End is pressed',
  then: 'onSeek is not called',
  and: ['the slider is aria-disabled'],
  act: async c => {
    await fireEvent.pointerDown(slider(c), { pointerId: 1, button: 0 });
    await fireEvent.keyDown(slider(c), { key: 'End' });
    await tick();
  },
  check: async c => {
    await expect(onSeek(c)).not.toHaveBeenCalled();
    await expect(slider(c)).toHaveAttribute('aria-disabled', 'true');
  },
}, story({ args: {} }, { args }));
export const Disabled: Story = inert('a disabled seek bar', { disabled: true });
export const ZeroDuration: Story = inert('a track of zero duration', { duration: 0 });
export const InvalidDuration: Story = inert('a duration of NaN and a position of Infinity', { duration: Number.NaN, position: Infinity });
