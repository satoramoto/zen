import type { Meta, StoryObj } from '@storybook/react-vite';
import { act } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { TransportHarness } from './TransportHarness.story';
import TransportHarnessSvelte from './TransportHarness.svelte';
import { transportStories as s } from './Transport.fixtures';

const meta = {
  id: 'music-transport',
  title: 'Music/Mixer/Transport',
  component: TransportHarness,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  parameters: {
    layout: 'centered',
    docs: { description: { component: 'Playback, tempo and position: the original mix[flow] header group, not an audio engine. Optional stop, loop, editable or read-only tempo, normal speed and latency. Press the beat counter to switch to the clock. Renderer and theme toolbars affect the same shared model.' } },
  },
  args: { ...s.Default.args, onPlay: fn(), onStop: fn(), onLoopChange: fn(), onTempoChange: fn() },
  argTypes: {
    playing: { control: 'boolean' },
    disabled: { control: 'boolean', description: 'Nothing to play: disables play/stop, not loop or tempo.' },
    withStop: { control: 'boolean', table: { category: 'Parts' } },
    withLoop: { control: 'boolean', table: { category: 'Parts' } },
    looping: { control: 'boolean', table: { category: 'Parts' } },
    loopingPart: { control: 'boolean', table: { category: 'Parts' } },
    tempo: { control: 'inline-radio', options: ['none', 'reading', 'field'], table: { category: 'Parts' } },
    bpm: { control: { type: 'range', min: 60, max: 200, step: 0.5 }, table: { category: 'Parts' } },
    tempoDisabled: { control: 'boolean', table: { category: 'Parts' } },
    withNormalSpeed: { control: 'boolean', table: { category: 'Parts' } },
    seconds: { control: { type: 'number', min: 0, step: 0.1 }, table: { category: 'Position' } },
    withBeats: { control: 'boolean', table: { category: 'Position' } },
    bar: { control: { type: 'number', min: 0, step: 0.0625 }, table: { category: 'Position' } },
    bars: { control: { type: 'number', min: 1, step: 1 }, table: { category: 'Position' } },
    fine: { control: 'boolean', table: { category: 'Position' } },
    latency: { control: { type: 'range', min: 0, max: 0.2, step: 0.001 } },
    playTitle: { control: 'text' }, stopTitle: { control: 'text' }, remember: { control: 'text' },
    onPlay: { control: false }, onStop: { control: false }, onLoopChange: { control: false }, onTempoChange: { control: false }, className: { control: false },
  },
} satisfies Meta<typeof TransportHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(TransportHarness, TransportHarnessSvelte);

export const Default: Story = story(s.Default, {
  async play({ canvasElement, args }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Play' }));
    await expect(args.onPlay).toHaveBeenLastCalledWith(true);
    const pause = await canvas.findByRole('button', { name: 'Pause' });
    pause.focus();
    await userEvent.keyboard(' ');
    await expect(args.onPlay).toHaveBeenLastCalledWith(false);
    await canvas.findByRole('button', { name: 'Play' });
    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
    await expect(args.onStop).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('button', { name: 'Beat position 1.1.1. Show elapsed time' })).toHaveTextContent('1.1.1');
  },
});

export const Playing: Story = story(s.Playing);

export const FullRow: Story = story(s.FullRow, {
  async play({ canvasElement, args }) {
    const canvas = within(canvasElement);
    const loop = canvas.getByRole('button', { name: 'Loop' });
    await expect(loop).toHaveAttribute('aria-pressed', 'true');
    await expect(loop.parentElement).toHaveClass('wdg-transport-looping-part');
    await userEvent.click(loop);
    await expect(args.onLoopChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(loop).toHaveAttribute('aria-pressed', 'false'));
    await expect(canvas.getByText('12 ms')).toHaveClass('wdg-transport-latency');
    await userEvent.click(canvas.getByRole('button', { name: 'Normal speed' }));
    await expect(args.onTempoChange).toHaveBeenLastCalledWith(124);
    await waitFor(() => expect(canvas.getByRole('slider', { name: 'Tempo' })).toHaveAttribute('aria-valuenow', '124'));
    await expect(canvas.getByRole('button', { name: 'Normal speed' })).toBeDisabled();
  },
});

export const Mixer: Story = story(s.Mixer, {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('slider')).not.toBeInTheDocument();
    await expect(canvas.getByLabelText('Tempo')).toHaveTextContent('128');
    await userEvent.click(canvas.getByRole('button', { name: 'Normal speed' }));
    await waitFor(() => expect(canvas.getByLabelText('Tempo')).toHaveTextContent('124'));
    await expect(canvas.getByRole('button', { name: 'Normal speed' })).toBeDisabled();
  },
});

export const Harness: Story = story(s.Harness, {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Elapsed time 0:12.346')).toHaveTextContent('0:12.346');
    await expect(canvas.queryByRole('button', { name: /Show elapsed time|Show beat position/ })).not.toBeInTheDocument();
    await expect(canvas.getByText('12 ms')).toBeInTheDocument();
  },
});

export const Disabled: Story = story(s.Disabled, {
  async play({ canvasElement, args }) {
    const canvas = within(canvasElement);
    for (const name of ['Play', 'Stop']) {
      const button = canvas.getByRole('button', { name });
      await expect(button).toBeDisabled();
      await userEvent.click(button);
    }
    await expect(args.onPlay).not.toHaveBeenCalled();
    await expect(args.onStop).not.toHaveBeenCalled();
    // Reference semantics: availability only gates playback, not these independent controls.
    await expect(canvas.getByRole('slider', { name: 'Tempo' })).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Loop' }));
    await expect(args.onLoopChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Beat position 1.1.1. Show elapsed time' }));
    await expect(await canvas.findByRole('button', { name: 'Elapsed time 0:00. Show beat position' })).toHaveTextContent('0:00');
  },
});

export const ClockToggle: Story = story(s.ClockToggle, {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Beat position 3.2.2. Show elapsed time' }));
    const clock = await canvas.findByRole('button', { name: 'Elapsed time 3:07. Show beat position' });
    await expect(clock).toHaveTextContent('3:07');
    clock.focus();
    await userEvent.keyboard('{Enter}');
    await expect(await canvas.findByRole('button', { name: 'Beat position 3.2.2. Show elapsed time' })).toHaveTextContent('3.2.2');
  },
});

export const TempoField: Story = story(s.TempoField, {
  async play({ canvasElement, args }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Normal speed' })).toBeDisabled();
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'Tempo' }), { key: 'Enter' });
    const input = await canvas.findByRole('textbox', { name: 'Tempo' });
    await expect(input).toHaveFocus();
    await userEvent.type(input, '126.5');
    // Committing replaces the editor and updates the controlled host. Storybook's synchronous
    // eventWrapper discards act's thenable; explicitly await the complete React commit here.
    await act(async () => { await userEvent.keyboard('{Enter}'); });
    await expect(args.onTempoChange).toHaveBeenLastCalledWith(126.5);
    await waitFor(() => expect(canvas.getByRole('slider', { name: 'Tempo' })).toHaveAttribute('aria-valuenow', '126.5'));
    await expect(canvas.getByRole('button', { name: 'Normal speed' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Normal speed' }));
    await waitFor(() => expect(canvas.getByRole('slider', { name: 'Tempo' })).toHaveAttribute('aria-valuenow', '124'));
  },
});

export const TempoDisabled: Story = story(s.TempoDisabled, {
  async play({ canvasElement, args }) {
    const tempo = within(canvasElement).getByRole('slider', { name: 'Tempo' });
    await expect(tempo).toHaveAttribute('aria-disabled', 'true');
    await fireEvent.keyDown(tempo, { key: 'ArrowUp' });
    await expect(args.onTempoChange).not.toHaveBeenCalled();
  },
});

export const Minimal: Story = story(s.Minimal);
