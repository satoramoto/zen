import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Switch } from './Toggle';
import SwitchSvelte from './Switch.svelte';
import { switchArgTypes, switchStories as s } from './Toggle.fixtures';

// Every story is built from Toggle.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.
// (These were the Toggle file's `Switch / …` stories; their own meta keeps the Toggle's args off them.)

/** A switch: on or off, taking effect at once; its own value from `defaultChecked`, or controlled. */
const meta = {
  title: 'Design OS/Components/Core/Switch',
  component: Switch,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onChange: fn() },
  argTypes: switchArgTypes,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Switch, SwitchSvelte);

/** One to try. A click, Space or Enter flips it. */
export const Playground: Story = {
  ...story(s.Playground),
  play: async ({ canvasElement, args }) => {
    const sw = within(canvasElement).getByRole('switch', { name: 'Follow the beat' });
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard(' ');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.keyboard('{Enter}');
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard(' ');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
  },
};

/** On, every size, enabled and disabled: the track lit, the thumb at the trailing end. */
export const On: Story = {
  ...story(s.On),
  play: async ({ canvasElement }) => {
    const sw = within(canvasElement).getByRole('switch', { name: 'regular, idle' });
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  },
};

/** Off, every size: the track a well, the thumb at the leading end. A disabled one doesn't flip. */
export const Off: Story = {
  ...story(s.Off),
  play: async ({ canvasElement }) => {
    const disabled = within(canvasElement).getByRole('switch', { name: 'regular, disabled' });
    await expect(disabled).toBeDisabled();
    await userEvent.click(disabled, { pointerEventsCheck: 0 });
    await expect(disabled).toHaveAttribute('aria-checked', 'false');
  },
};

/** Labelled (the app's `SwitchRow`): the name at the start of the line labels the switch at the end. */
export const Labelled: Story = {
  ...story(s.Labelled),
  play: async ({ canvasElement, args }) => {
    const sw = within(canvasElement).getByRole('switch', { name: 'Reduced motion' });
    await userEvent.click(within(canvasElement).getByText('Reduced motion'));
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'false');
  },
};
