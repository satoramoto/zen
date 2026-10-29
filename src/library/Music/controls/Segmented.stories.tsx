import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { Segmented } from './Segmented';
import SegmentedSvelte from './Segmented.svelte';
import { segmentedStories as s } from './Segmented.fixtures';
import { PressableHarness } from './ToggleHarness';
import PressableHarnessSvelte from './ToggleHarness.svelte';
import { pressableHostStories } from './ToggleHarness.fixtures';

const meta = {
  id: 'music-controls-segmented',
  title: 'Music/Controls/Segmented', component: Segmented,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'centered' },
  args: { items: ['A', 'Thru', 'B'], index: 1, label: 'Crossfade assignment', name: 'Route', onChange: fn(), disabled: false },
  argTypes: { orientation: { control: 'radio', options: ['horizontal', 'vertical'] }, disabled: { control: 'boolean' }, index: { control: { type: 'number', min: 0, max: 2 } } },
} satisfies Meta<typeof Segmented>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Segmented, SegmentedSvelte);

export const Default: Story = story(s.Default, {
  play: async ({ canvasElement, args }) => {
    const radios = within(canvasElement).getAllByRole('radio');
    await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    await expect(radios[0]).toHaveAttribute('tabindex', '-1');
    radios[1]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
    await userEvent.keyboard('{ArrowLeft}');
    await expect(args.onChange).toHaveBeenLastCalledWith(0);
    await userEvent.click(radios[2]!);
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
  },
});
export const Vertical: Story = story(s.Vertical);
export const Live: Story = {
  ...fixtureStories<Story>(PressableHarness, PressableHarnessSvelte)(pressableHostStories.Segmented),
  render: args => <PressableHarness {...args} control="segmented" />,
  play: async ({ canvasElement, args }) => {
    const radios = within(canvasElement).getAllByRole('radio');
    radios[1]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    await expect(radios[2]).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
    await userEvent.keyboard('{ArrowLeft}');
    await expect(radios[1]).toHaveFocus();
    await expect(radios[1]).toHaveAttribute('tabindex', '0');
  },
};
export const AccessibleGlyphs: Story = story(s.AccessibleGlyphs);
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement, args }) => {
    for (const radio of within(canvasElement).getAllByRole('radio')) {
      await expect(radio).toBeDisabled();
      await userEvent.click(radio);
    }
    await expect(args.onChange).not.toHaveBeenCalled();
  },
});
