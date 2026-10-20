import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Checkbox } from './Checkbox';
import CheckboxSvelte from './Checkbox.svelte';
import { checkArgTypes, checkboxStories as s } from './Checkbox.fixtures';

// Every story is built from Checkbox.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.

/**
 * A checkbox on the theme's materials: a `well` box, filled and lit with a check when on. A real
 * checkbox input sits over the box, so Space, the label and forms work.
 */
const meta = {
  title: 'Design OS/Components/Core/Checkbox',
  component: Checkbox,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onChange: fn() },
  argTypes: { ...checkArgTypes, defaultChecked: { control: 'select', options: [false, true, 'mixed'] } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Checkbox, CheckboxSvelte);

/** One checkbox to try. */
export const Playground: Story = {
  ...story(s.Playground),
  play: async ({ canvasElement, args }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Show the frame rate' });
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await expect(box).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(box).not.toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
  },
};

/** On: the box filled and lit, with a check. Every size, enabled and disabled. */
export const Checked: Story = {
  ...story(s.Checked),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disabled = canvas.getByRole('checkbox', { name: 'regular, disabled' });
    await expect(disabled).toBeDisabled();
    await userEvent.click(disabled.closest('label')!);
    await expect(disabled).toBeChecked();
    const idle = canvas.getByRole('checkbox', { name: 'regular, idle' });
    await userEvent.click(idle);
    await expect(idle).not.toBeChecked();
    await expect(getComputedStyle(idle.parentElement!.querySelector('[data-part="check"]')!).display).toBe('none');
    await userEvent.click(idle);
    await expect(idle).toBeChecked();
  },
};

/** Off: the empty well. Clicking the label checks it. */
export const Unchecked: Story = {
  ...story(s.Unchecked),
  play: async ({ canvasElement }) => {
    const idle = within(canvasElement).getByRole('checkbox', { name: 'regular, idle' });
    await expect(idle).not.toBeChecked();
    await userEvent.click(idle.closest('label')!.querySelector('[data-part="label"]')!);
    await expect(idle).toBeChecked();
    await expect(getComputedStyle(idle.parentElement!.querySelector('[data-part="check"]')!).display).toBe('block');
    await userEvent.click(idle);
    await expect(idle).not.toBeChecked();
  },
};

/** Mixed: a dash, for a box standing for things some of which are on. Clicking it checks it. */
export const Mixed: Story = {
  ...story(s.Mixed),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const idle = canvas.getByRole('checkbox', { name: 'regular, idle' });
    await expect(idle).toBePartiallyChecked();
    await userEvent.click(idle);
    await expect(idle).not.toBePartiallyChecked();
    await expect(idle).toBeChecked();
    // No click brings mixed back (only the app can): uncheck it and set it mixed again, as it started.
    await userEvent.click(idle);
    (idle as HTMLInputElement).indeterminate = true;
    await expect(idle).toBePartiallyChecked();
    const disabled = canvas.getByRole('checkbox', { name: 'small, disabled' });
    await userEvent.click(disabled.closest('label')!);
    await expect(disabled).toBePartiallyChecked();
  },
};
