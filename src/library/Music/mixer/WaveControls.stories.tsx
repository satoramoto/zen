import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../stories/story';
import type { StoryFixture } from '../../fixtures';
import { h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { WaveControls } from './WaveControls';
import { waveControlsHandlers, waveControlsView, type WaveControlsProps as ModelProps } from './WaveControls.model';
import { frameWaveformHandlers, frameWaveformView } from './frames.model';
import { frameDeck, frameReading, frameTheme } from './frames.fixtures';
import { frameCommandSpies } from './frames.story';
import { waveControlsStories as s } from './WaveControls.fixtures';

const meta = {
  id: 'music-mixer-wave-controls',
  title: 'Music/Mixer/Wave controls', component: WaveControls,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'padded' },
  args: {
    deck: frameDeck, index: 0, readFrame: () => frameReading, children: 'Waveform gesture surface',
    commands: frameCommandSpies(),
  },
} satisfies Meta<typeof WaveControls>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = (fixture: StoryFixture<ModelProps>, extra: Partial<Story>): Story => ({
  args: fixture.args,
  ...treeStory((args: ModelProps) => {
    const frameProps = { ...args, ink: 'var(--primary)', theme: frameTheme };
    return {
      tree: h('div', { class: 'play-wave-lane', style: 'width: min(600px, calc(100vw - 32px)); height: 96px' },
        waveControlsView(args, frameWaveformView(frameProps))),
      handlers: { ...frameWaveformHandlers(frameProps), ...waveControlsHandlers(args) },
    };
  }),
  ...extra,
});

export const RelativeMovement: Story = story(s.RelativeMovement, { play: async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  const slider = canvas.getByRole('slider');
  const rect = slider.getBoundingClientRect();
  const from = rect.left + rect.width * 0.75;
  await expect(slider).toHaveAttribute('aria-valuenow', '8');
  await fireEvent.pointerDown(slider, { button: 0, pointerId: 41, clientX: from });
  await expect(slider).toHaveFocus();
  await fireEvent.pointerMove(slider, { pointerId: 41, clientX: from - rect.width / 4 });
  await fireEvent.pointerUp(slider, { pointerId: 41 });
  await expect(args.commands.moveDeck).toHaveBeenNthCalledWith(1, 'a', 'begin');
  await expect(args.commands.moveDeck).toHaveBeenNthCalledWith(2, 'a', 'move', 8);
  await expect(args.commands.moveDeck).toHaveBeenNthCalledWith(3, 'a', 'commit');
  const bass = canvasElement.querySelector<HTMLElement>('[aria-label="Deck 1 Bass waveform"]')!;
  await fireEvent.pointerDown(bass, { button: 0, pointerId: 45, clientX: from });
  await expect(args.commands.setFocus).toHaveBeenLastCalledWith('a', 'bass');
  await expect(slider).toHaveFocus();
  await expect(args.commands.moveDeck).toHaveBeenNthCalledWith(4, 'a', 'begin');
  await fireEvent.pointerCancel(slider, { pointerId: 45 });
  await fireEvent.click(canvas.getByRole('button', { name: 'Deck 1 show whole waveform' }));
  await expect(args.commands.setZoom).toHaveBeenLastCalledWith('a', 0);
  await fireEvent.click(canvas.getByRole('button', { name: 'Deck 1 focused play/pause' }));
  await expect(args.commands.setStemPlaying).toHaveBeenLastCalledWith('a', 'drums', false);
} });

export const RollbackAndKeys: Story = story(s.RollbackAndKeys, { play: async ({ canvasElement, args }) => {
  const slider = within(canvasElement).getByRole('slider');
  const pointer = { button: 0, pointerId: 42, clientX: slider.getBoundingClientRect().left + 10 };
  const start = () => fireEvent.pointerDown(slider, pointer);
  await start();
  await fireEvent.keyDown(slider, { key: 'Escape' });
  await expect(args.commands.moveDeck).toHaveBeenLastCalledWith('a', 'cancel');
  await start();
  await fireEvent.pointerCancel(slider, pointer);
  await expect(args.commands.moveDeck).toHaveBeenLastCalledWith('a', 'cancel');
  await start();
  slider.blur();
  await expect(args.commands.moveDeck).toHaveBeenLastCalledWith('a', 'cancel');
  await start();
  await fireEvent.blur(canvasElement.ownerDocument.defaultView!);
  await expect(args.commands.moveDeck).toHaveBeenLastCalledWith('a', 'cancel');
  await fireEvent.keyDown(slider, { key: 'ArrowRight' });
  await expect(args.commands.moveDeck).toHaveBeenCalledWith('a', 'move', 0.125);
  await fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
  await expect(args.commands.moveDeck).toHaveBeenCalledWith('a', 'move', -1);
  await fireEvent.keyDown(slider, { key: 'ArrowDown' });
  await expect(args.commands.setFocus).toHaveBeenLastCalledWith('a', 'bass');
  await fireEvent.keyDown(slider, { key: 'ArrowUp' });
  await expect(args.commands.setFocus).toHaveBeenLastCalledWith('a', 'bass');
} });

export const FullSource: Story = story(s.FullSource, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fireEvent.click(canvas.getByRole('button', { name: 'Deck 1 focused play/pause' }));
    await expect(args.commands.setDeckPlaying).toHaveBeenLastCalledWith('a', true);
    await fireEvent.click(canvas.getByRole('button', { name: 'Deck 1 show whole waveform' }));
    await expect(args.commands.setZoom).toHaveBeenLastCalledWith('a', 32);
    const cue = canvas.getByRole('button', { name: 'Deck 1 focused cue' });
    await fireEvent.pointerDown(cue, { button: 0, pointerId: 43 });
    await expect(args.commands.cueDeck).toHaveBeenLastCalledWith('a', true);
    await fireEvent.pointerUp(cue, { button: 0, pointerId: 43 });
    await expect(args.commands.cueDeck).toHaveBeenLastCalledWith('a', false);
  },
});

export const FocusedCueAndTakeover: Story = story(s.FocusedCueAndTakeover, {
  play: async ({ canvasElement, args }) => {
    const cue = within(canvasElement).getByRole('button', { name: 'Deck 1 focused cue' });
    await fireEvent.pointerDown(cue, { button: 0, pointerId: 44 });
    await expect(args.commands.cueStem).toHaveBeenLastCalledWith('a', 'drums', true);
    await fireEvent.keyDown(cue, { key: 'Enter' });
    await expect(args.commands.setStemPlaying).toHaveBeenLastCalledWith('a', 'drums', true);
    await fireEvent.pointerUp(cue, { button: 0, pointerId: 44 });
    await expect(args.commands.cueStem).toHaveBeenLastCalledWith('a', 'drums', false);
  },
});

export const ScopeAndZoom: Story = story(s.ScopeAndZoom, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fireEvent.click(canvas.getByRole('button', { name: 'Deck 1 waveform settings' }));
    const dialog = within(canvas.getByRole('dialog', { name: 'Deck 1 waveform settings' }));
    await fireEvent.click(dialog.getByRole('checkbox', { name: 'Move active stems together' }));
    await expect(args.commands.setMoveTogether).toHaveBeenLastCalledWith('a', true);
    await fireEvent.click(dialog.getByRole('button', { name: 'Deck 1 zoom in' }));
    await expect(args.commands.setZoom).toHaveBeenLastCalledWith('a', 16);
    await fireEvent.click(dialog.getByRole('button', { name: 'Deck 1 zoom out' }));
    await expect(args.commands.setZoom).toHaveBeenLastCalledWith('a', 64);
  },
});

export const Loading: Story = story(s.Loading, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'Deck 1 loading' })).toHaveTextContent('Reading source…');
    await expect(canvas.queryByRole('slider')).not.toBeInTheDocument();
  },
});
