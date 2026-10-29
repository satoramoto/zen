import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { ParameterHarness } from './KnobHarness.story';
import ParameterHarnessSvelte from './KnobHarness.svelte';
import { exerciseDisabled, exerciseParameter, percentage } from './Knob.interactions';
import { numberFieldStories as s } from './NumberField.fixtures';
const meta = {
  id: 'music-controls-numberfield',
  title: 'Music/Controls/Number field', component: ParameterHarness,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { control: 'number', param: percentage, value: 25, onChange: fn(), onRelease: fn() },
  argTypes: { control: { table: { disable: true } }, disabled: { control: 'boolean' }, editable: { control: 'boolean' }, showFill: { control: 'boolean' }, value: { control: 'number' }, width: { control: 'number' } },
} satisfies Meta<typeof ParameterHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ParameterHarness, ParameterHarnessSvelte);
export const Default: Story = story(s.Default, { play: exerciseParameter });
export const Disabled: Story = story(s.Disabled, { play: exerciseDisabled });
export const TypedEntry: Story = story(s.TypedEntry, {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await fireEvent.keyDown(canvas.getByRole('slider'), { key: 'Enter' });
    const input = await canvas.findByRole('textbox');
    await expect(input).toHaveFocus();
    await fireEvent.input(input, { target: { value: '72.5' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(canvas.getByRole('slider')).toHaveAttribute('aria-valuenow', '72.5'));
    await fireEvent.keyDown(canvas.getByRole('slider'), { key: '4' });
    const cancelled = await canvas.findByRole('textbox');
    await expect(cancelled).toHaveValue('4');
    await fireEvent.keyDown(cancelled, { key: 'Escape' });
    await waitFor(() => expect(canvas.getByRole('slider')).toHaveAttribute('aria-valuenow', '72.5'));
    await fireEvent.keyDown(canvas.getByRole('slider'), { key: 'Enter' });
    const blurred = await canvas.findByRole('textbox');
    await fireEvent.input(blurred, { target: { value: '150' } });
    await fireEvent.blur(blurred);
    await waitFor(() => expect(canvas.getByRole('slider')).toHaveAttribute('aria-valuenow', '100'));
  },
});
export const AuthoritativeDisplay: Story = story(s.AuthoritativeDisplay);
export const Integer: Story = story(s.Integer);
