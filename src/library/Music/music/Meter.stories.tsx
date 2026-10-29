import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { Meter } from './Meter';
import MeterSvelte from './Meter.svelte';
import { meterArgTypes, meterStories as s } from './Meter.fixtures';

const meta = {
  id: 'music-meter',
  title: 'Music/Displays/Meter', component: Meter, decorators: [withRenderer, withMusicScope, withLibraryTheme],
  tags: ['autodocs'], parameters: { layout: 'centered' }, argTypes: meterArgTypes,
  args: { value: 0.62, orientation: 'horizontal', layout: 'stacked', side: 'left', showValue: false, width: 6, length: 48, name: '' },
} satisfies Meta<typeof Meter>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Meter, MeterSvelte);

export const Level: Story = story(s.Level, { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const meter = canvas.getByRole('meter', { name: 'Output level' });
  await expect(meter).toHaveAttribute('aria-valuenow', '62');
  await expect(meter).not.toHaveAttribute('tabindex');
  await expect(canvas.queryByRole('slider')).not.toBeInTheDocument();
  await expect(meter.querySelector('.wdg-meter-level')).toBeInTheDocument();
  await expect(meter.querySelector('.wdg-meter-hold')).not.toBeInTheDocument();
} });
export const WithPeak: Story = story(s.WithPeak, { play: async ({ canvasElement }) => {
  const meter = within(canvasElement).getByRole('meter');
  await expect(meter.querySelector('.wdg-meter-hold')).toBeInTheDocument();
  await expect(meter.closest<HTMLElement>('.wdg-meter')!.style.getPropertyValue('--wdg-meter-peak')).toBe('0.83');
} });
export const Vertical: Story = story(s.Vertical, { play: async ({ canvasElement }) => {
  const meter = within(canvasElement).getByRole('meter');
  await expect(meter).toHaveClass('wdg-meter-vertical');
  await expect(meter.getBoundingClientRect().height).toBe(60);
  await expect(meter.getBoundingClientRect().width).toBe(6);
} });
export const Readout: Story = story(s.Readout, { play: async ({ canvasElement }) => {
  await expect(within(canvasElement).getByText('−4.2 dB')).toHaveClass('wdg-readout');
} });
export const Inside: Story = story(s.Inside);
export const Clamped: Story = story(s.Clamped, { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole('meter', { name: 'Over range' })).toHaveAttribute('aria-valuenow', '100');
  await expect(canvas.getByRole('meter', { name: 'Under range' })).toHaveAttribute('aria-valuenow', '0');
  await expect(canvas.getByRole('meter', { name: 'Not a number' })).toHaveAttribute('aria-valuenow', '0');
} });
