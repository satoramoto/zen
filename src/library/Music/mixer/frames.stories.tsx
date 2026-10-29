import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../stories/story';
import type { StoryFixture } from '../../fixtures';
import { h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { FrameWaveform } from './frames';
import { frameMeterHandlers, frameMeterView, framePlayheadHandlers, framePlayheadView, frameWaveformHandlers, frameWaveformView, type FrameMeterProps, type FramePlayheadProps, type FrameWaveformProps } from './frames.model';
import { frameDeck, frameReading, frameTheme, frameStories as s } from './frames.fixtures';
import { frameCommandSpies } from './frames.story';

const meta = {
  id: 'music-mixer-frames',
  title: 'Music/Foundations/Frame bindings', component: FrameWaveform,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'padded' },
  args: { deck: frameDeck, index: 0, ink: 'var(--primary)', readFrame: () => frameReading, theme: frameTheme, commands: frameCommandSpies() },
} satisfies Meta<typeof FrameWaveform>;
export default meta;
type Story = StoryObj<typeof meta>;
// The real mixer supplies a sized flex lane. Preserve that containing geometry in isolation.
const story = (fixture: StoryFixture<FrameWaveformProps>, extra: Partial<Story>): Story => ({
  args: fixture.args,
  ...treeStory((args: FrameWaveformProps) => ({
    tree: h('div', { class: 'play-wave-lane', style: 'width: min(600px, calc(100vw - 32px)); height: 96px' }, frameWaveformView(args)),
    handlers: frameWaveformHandlers(args),
  })),
  ...extra,
});

export const IndependentSources: Story = story(s.IndependentSources, { play: async ({ canvasElement, args }) => {
  const drums = canvasElement.querySelector<HTMLElement>('[aria-label="Deck 1 Drums waveform"]')!;
  const bass = canvasElement.querySelector<HTMLElement>('[aria-label="Deck 1 Bass waveform"]')!;
  await expect(drums).toHaveAttribute('data-focused', 'true');
  await expect(bass).toHaveAttribute('data-focused', 'false');
  await expect(drums.getBoundingClientRect().height).toBeGreaterThan(0);
  await expect(bass.getBoundingClientRect().height).toBeGreaterThan(0);
  await expect(drums.querySelector<HTMLElement>('.play-wave-scroll')!.style.transform).not.toBe(bass.querySelector<HTMLElement>('.play-wave-scroll')!.style.transform);
  await expect(drums.querySelector('.play-slip-marker')).toHaveTextContent('SLIP 20.0');
  await expect(bass.querySelector('.play-slip-marker')).not.toBeVisible();
  await expect(drums.querySelectorAll('.play-cue-marker')).toHaveLength(2);
  await expect(drums.querySelector('.play-loop-region')).toHaveAttribute('data-enabled', 'true');
  await expect(within(canvasElement).getByText('0:08 · 5.1')).toBeInTheDocument();
  await fireEvent.pointerDown(bass, { button: 0, pointerId: 1 });
  await expect(args.commands.setFocus).toHaveBeenLastCalledWith('a', 'bass');
} });

export const WholeTrack: Story = story(s.WholeTrack, { play: async ({ canvasElement }) => {
  const strip = canvasElement.querySelector<HTMLElement>('.play-wave-scroll')!;
  await expect(strip.style.transform).toBe('none');
  await expect(canvasElement.querySelector<HTMLElement>('.play-playhead')!.style.left).toBe('12.5%');
  await expect(within(canvasElement).getByText('DECK CUE')).toBeInTheDocument();
  await expect(within(canvasElement).getByText('CUE')).toBeInTheDocument();
  await expect(within(canvasElement).getByText('↻ 8 beats')).toBeInTheDocument();
} });

// treeStory keeps the exact models under the Renderer toolbar, including the live stores.
export const SmoothedMeter: StoryObj<FrameMeterProps> = {
  ...treeStory((args: FrameMeterProps) => ({
    tree: h('div', { style: '--play-signal: var(--primary)' }, frameMeterView(args)), handlers: frameMeterHandlers(args),
  })),
  args: { sample: () => 0.8, label: 'Live output' },
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole('meter', { name: 'Live output' });
    await waitFor(() => expect(Number(meter.getAttribute('aria-valuenow'))).toBeGreaterThan(75));
    await expect(meter.getBoundingClientRect().height).toBe(210);
    await expect(getComputedStyle(meter.querySelector('.wdg-meter-level')!).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

export const NegativePlayhead: StoryObj<FramePlayheadProps> = {
  ...treeStory((args: FramePlayheadProps) => ({
    tree: h('div', { style: 'position: relative; width: 320px; height: 48px' }, framePlayheadView(args)),
    handlers: framePlayheadHandlers(args),
  })),
  args: { deckId: 'a', readFrame: () => ({ masterLevel: 0, decks: { a: { beat: -1, level: 0 } } }) },
  play: async ({ canvasElement }) => {
    await expect(parseFloat(canvasElement.querySelector<HTMLElement>('.play-playhead')!.style.left)).toBeCloseTo(99.21875, 3);
  },
};
