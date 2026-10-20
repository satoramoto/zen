import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Radio } from './Radio';
import RadioSvelte from './Radio.svelte';
import { radioArgTypes, radioStories as s } from './Radio.fixtures';

// Every story is built from Radio.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.
// The sheets' radios are each their own (no shared name), so none unchecks another.

/**
 * A radio button: Checkbox's well made round, filled and lit with a dot when on. A real radio input
 * sits over it, so radios sharing a name check one at a time and move with the arrows.
 */
const meta = {
  title: 'Design OS/Components/Core/Radio',
  component: Radio,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onChange: fn() },
  argTypes: radioArgTypes,
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Radio, RadioSvelte);

/** A group of three sharing a name. The arrows move the choice along it. */
export const Group: Story = {
  ...story(s.Group),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const [fill, fit, stretch] = ['Fill', 'Fit', 'Stretch'].map((name) => canvas.getByRole('radio', { name }));
    await expect(fill).toBeChecked();
    await userEvent.click(fit);
    await expect(fit).toBeChecked();
    await expect(fill).not.toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard('{ArrowDown}');
    await expect(stretch).toBeChecked();
    await expect(stretch).toHaveFocus();
    await expect(fit).not.toBeChecked();
    // Back to Fill, as it started.
    await userEvent.click(fill);
    await expect(fill).toBeChecked();
  },
};

/** On: filled and lit, with a dot. Picking it again keeps it checked. */
export const Checked: Story = {
  ...story(s.Checked),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disabled = canvas.getByRole('radio', { name: 'regular, disabled' });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toBeChecked();
    const idle = canvas.getByRole('radio', { name: 'regular, idle' });
    await expect(getComputedStyle(idle.parentElement!.querySelector('[data-part="dot"]')!).display).not.toBe('none');
    await userEvent.click(idle);
    await expect(idle).toBeChecked();
  },
};

/** Off: the empty well. Picking it checks it. */
export const Unchecked: Story = {
  ...story(s.Unchecked),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const idle = canvas.getByRole('radio', { name: 'large, idle' });
    await userEvent.click(idle.closest('label')!.querySelector('[data-part="label"]')!);
    await expect(idle).toBeChecked();
    // No click unchecks a radio: clear it, as it started.
    (idle as HTMLInputElement).checked = false;
    const disabled = canvas.getByRole('radio', { name: 'large, disabled' });
    await userEvent.click(disabled.closest('label')!);
    await expect(disabled).not.toBeChecked();
  },
};

/** Mixed: a dash, drawn only (HTML's radios have none): the input reads as unchecked, and picking it checks it. */
export const Mixed: Story = {
  ...story(s.Mixed),
  play: async ({ canvasElement }) => {
    const idle = within(canvasElement).getByRole('radio', { name: 'regular, idle' });
    await expect(idle).not.toBeChecked();
    const dash = idle.parentElement!.querySelector('[data-part="dash"]')!;
    await expect(getComputedStyle(dash).display).toBe('block');
    await userEvent.click(idle);
    await expect(idle).toBeChecked();
    await expect(getComputedStyle(dash).display).toBe('none');
  },
};
