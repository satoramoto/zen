import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { exact, numeric } from '../../model/exercise';
import { Formula } from '../Formula/Formula';
import { Exercise } from './Exercise';

/** A question with an answer field, a checker's verdict, and a hint and solution on request. */
const meta = {
  title: 'Compendium/Components/Exercise',
  component: Exercise,
  decorators: [withLibraryTheme],
  args: {
    number: 'Exercise 1',
    prompt: (
      <>
        Mode <Formula tex="n" /> of a string has how many nodes strictly between its ends, for <Formula tex="n = 5" />?
      </>
    ),
    placeholder: 'a whole number',
    check: (given: string) => numeric(given, '4', {}),
    hint: 'Every loop ends in a node, except that the ends themselves don’t count.',
    solution: 'Mode n has n loops and n − 1 nodes between the ends: for n = 5, four.',
    onResult: fn(),
  },
} satisfies Meta<typeof Exercise>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A wrong answer says so with the checker's feedback; the right one locks the field and reports. */
export const WrongThenRight: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Your answer' });
    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
    expect(canvas.getByText(/type a number/i)).toBeInTheDocument();
    await userEvent.type(field, '5');
    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
    expect(canvas.getByText(/not yet/i)).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Hint' }));
    expect(canvas.getByText(/every loop ends in a node/i)).toBeInTheDocument();
    await userEvent.clear(field);
    await userEvent.type(field, '4{Enter}');
    expect(canvas.getByText(/correct/i)).toBeInTheDocument();
    expect(field).toHaveAttribute('readonly');
    expect(args.onResult).toHaveBeenLastCalledWith({ correct: true });
  },
};

/** Words, matched against the alternatives the author allows. */
export const Words: Story = {
  args: {
    number: 'Exercise 2',
    prompt: 'Harmonics 3 and 2 sound together. What interval do they make?',
    placeholder: 'the interval’s name',
    check: (given: string) => exact(given, 'perfect fifth|a perfect fifth|fifth', {}),
    hint: 'Their frequencies are in the ratio 3:2.',
    solution: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Your answer' }), 'A Perfect Fifth.{Enter}');
    expect(canvas.getByText(/correct/i)).toBeInTheDocument();
  },
};

/** Already done, from restored progress: the tick shows and the field is locked. */
export const Done: Story = {
  args: { done: true },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByText(/correct/i)).toBeInTheDocument();
  },
};
