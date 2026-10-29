import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { ParameterHarness } from './KnobHarness.story';
import ParameterHarnessSvelte from './KnobHarness.svelte';
import { exerciseDisabled, exerciseParameter, percentage } from './Knob.interactions';
import { sliderStories as s } from './Slider.fixtures';
const meta = {
  id: 'music-controls-fader',
  title: 'Music/Controls/Fader', component: ParameterHarness,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { control: 'slider', param: percentage, value: 25, onChange: fn(), onRelease: fn(), onDepth: fn() },
  argTypes: { control: { table: { disable: true } }, orientation: { control: 'radio', options: ['vertical', 'horizontal'] }, layout: { control: 'radio', options: ['stacked', 'inline', 'inside'] }, disabled: { control: 'boolean' }, value: { control: 'number' }, length: { control: 'number' } },
} satisfies Meta<typeof ParameterHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ParameterHarness, ParameterHarnessSvelte);
export const Default: Story = story(s.Default, { play: exerciseParameter });
export const Disabled: Story = story(s.Disabled, { play: exerciseDisabled });
export const Horizontal: Story = story(s.Horizontal, { play: exerciseParameter });
export const Crossfader: Story = story(s.Crossfader);
export const Channel: Story = story(s.Channel);
export const DrivenRow: Story = story(s.DrivenRow, {
  async play({ canvasElement, args }) {
    const canvas = within(canvasElement);
    const surface = canvas.getByRole('slider');
    await expect(canvasElement.querySelectorAll('.wdg-slider-wake')).toHaveLength(6);
    await fireEvent.pointerDown(surface, { pointerId: 5, button: 0, clientX: 100, clientY: 100 });
    await fireEvent.pointerMove(surface, { pointerId: 5, clientX: 130, clientY: 100, shiftKey: true });
    await fireEvent.pointerUp(surface, { pointerId: 5 });
    await waitFor(() => expect(args.onDepth).toHaveBeenCalled());
    await expect(surface).toHaveAttribute('aria-valuenow', '25');
  },
});
