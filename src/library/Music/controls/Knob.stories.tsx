import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { ParameterHarness } from './KnobHarness.story';
import ParameterHarnessSvelte from './KnobHarness.svelte';
import { exerciseDisabled, exerciseParameter, percentage } from './Knob.interactions';
import { knobStories as s } from './Knob.fixtures';
const meta = {
  id: 'music-controls-knob',
  title: 'Music/Controls/Knob', component: ParameterHarness,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { control: 'knob', param: percentage, value: 25, onChange: fn(), onRelease: fn() },
  argTypes: { control: { table: { disable: true } }, value: { control: 'number' }, disabled: { control: 'boolean' }, layout: { control: 'radio', options: ['stacked', 'inline', 'inside'] }, side: { control: 'radio', options: ['left', 'right'] }, origin: { control: 'radio', options: ['min', 'center'] } },
} satisfies Meta<typeof ParameterHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ParameterHarness, ParameterHarnessSvelte);
export const Default: Story = story(s.Default, { play: exerciseParameter });
export const Disabled: Story = story(s.Disabled, { play: exerciseDisabled });
export const Bipolar: Story = story(s.Bipolar);
export const Tapered: Story = story(s.Tapered);
export const Inline: Story = story(s.Inline);
