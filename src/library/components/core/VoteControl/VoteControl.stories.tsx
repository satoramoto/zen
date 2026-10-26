import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { VoteControl, type VoteControlProps } from './VoteControl';
import VoteControlSvelte from './VoteControl.svelte';
import { voteControlArgTypes, voteControlStories as s } from './VoteControl.fixtures';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Plays the app: keeps the viewer's choice and the tally, updating both once `onChange` saves. */
function App(args: VoteControlProps) {
  const [value, setValue] = useState(args.value);
  const [voters, setVoters] = useState(args.voters);
  return (
    <VoteControl
      {...args}
      value={value}
      voters={voters}
      onChange={async (next) => {
        await args.onChange(next);
        setValue(next);
        setVoters((all) => all.map((voter) => (voter.name === 'You' ? { ...voter, value: next } : voter)));
      }}
    />
  );
}

/**
 * A vote among a few choices, each with its meaning always in view, and who chose what. The app
 * passes the words and saves the choice in `onChange`; a failed save shows its message and the
 * control goes back to the saved choice.
 */
const meta = {
  title: 'Design OS/Components/Core/VoteControl',
  component: VoteControl,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { ...(s.Tally.args as VoteControlProps), onChange: fn() },
  argTypes: voteControlArgTypes,
} satisfies Meta<typeof VoteControl>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(VoteControl, VoteControlSvelte);

/** The row of the tally for `name`. */
const rowOf = (canvasElement: HTMLElement, name: string) => within(within(canvasElement).getByText(name).closest('li')!);

/**
 * The app saves after a short wait. The arrows move focus without picking; Enter picks; while the
 * save runs the choices wait; once saved, the viewer's line in the tally follows.
 */
export const Default: Story = {
  args: {
    onChange: fn(async () => {
      await wait(300);
    }),
  },
  render: (args) => <App {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radiogroup', { name: 'Are you coming?' })).toBeInTheDocument();
    // Every meaning is in view, not behind a hover.
    await expect(canvas.getByText('Count me in. Plan around me.')).toBeVisible();
    await expect(canvas.getByText("I can't this time.")).toBeVisible();
    const maybe = canvas.getByRole('radio', { name: 'Maybe' });
    await expect(maybe).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getAllByRole('radio').map((radio) => radio.tabIndex)).toEqual([-1, 0, -1]);

    // Arrows move focus only.
    maybe.focus();
    await userEvent.keyboard('{ArrowRight}');
    const no = canvas.getByRole('radio', { name: 'No' });
    await expect(no).toHaveFocus();
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Yes' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');

    // Enter picks: shown at once, the others wait while it saves.
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenCalledWith('no');
    await expect(no).toHaveAttribute('aria-checked', 'true');
    await expect(no).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(canvas.getByRole('radio', { name: 'Yes' }));
    await expect(args.onChange).toHaveBeenCalledTimes(1);

    // Saved: the tally follows, and the current choice can't be cleared by picking it again.
    await waitFor(() => expect(rowOf(canvasElement, 'You').getByText('No')).toBeInTheDocument());
    await expect(no).not.toHaveAttribute('aria-disabled');
    await userEvent.click(no);
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(no).toHaveAttribute('aria-checked', 'true');
  },
};

/** The save fails without a message: `That did not save.`, announced, and the saved choice stays. */
export const SaveFails: Story = {
  args: {
    onChange: fn(() => Promise.reject(new Error(''))),
  },
  render: (args) => <App {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Yes' }));
    await expect(args.onChange).toHaveBeenCalledWith('yes');
    const error = await canvas.findByText('That did not save.');
    await expect(error).toHaveAttribute('aria-live', 'polite');
    await expect(canvas.getByRole('radio', { name: 'Maybe' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('radio', { name: 'Yes' })).toHaveAttribute('aria-checked', 'false');
    await expect(rowOf(canvasElement, 'You').getByText('Maybe')).toBeInTheDocument();
  },
};

/** The tally: each name with its choice's label, `no vote yet`, or `no longer here`. */
export const Tally: Story = {
  ...story(s.Tally),
  play: async ({ canvasElement }) => {
    await expect(rowOf(canvasElement, 'Ada').getByText('Yes')).toBeInTheDocument();
    await expect(rowOf(canvasElement, 'Grace').getByText('No')).toBeInTheDocument();
    await expect(rowOf(canvasElement, 'Linus').getByText('no vote yet')).toBeInTheDocument();
    await expect(rowOf(canvasElement, 'Margaret').getByText(/\(no longer here\)$/)).toBeInTheDocument();
  },
};

/** No choice yet: none is checked, and the first takes Tab. */
export const NoVoteYet: Story = {
  ...story(s.NoVoteYet),
  play: async ({ canvasElement }) => {
    const radios = within(canvasElement).getAllByRole('radio');
    await expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false']);
    await expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1, -1]);
    await expect(rowOf(canvasElement, 'You').getByText('no vote yet')).toBeInTheDocument();
  },
};

/** `busy` from the app: the choices are disabled, and a click asks nothing. */
export const Busy: Story = {
  ...story(s.Busy),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const yes = canvas.getByRole('radio', { name: 'Yes' });
    await expect(yes).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(yes);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** `error` from the app, on the announced line. */
export const AppError: Story = {
  ...story(s.AppError),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Voting has closed.')).toHaveAttribute('aria-live', 'polite');
  },
};
