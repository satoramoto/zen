import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Formula } from '../Formula/Formula';
import { Steps } from './Steps';

/** An argument the reader walks through one step at a time. */
const meta = {
  title: 'Compendium/Components/Steps',
  component: Steps,
  decorators: [withLibraryTheme],
  args: {
    title: 'Why the harmonic series diverges',
    steps: [
      <>
        Keep the first two terms, <Formula tex={String.raw`1 + \tfrac12`} />, as they are.
      </>,
      <>
        Group the next two: <Formula tex={String.raw`\tfrac13 + \tfrac14 > \tfrac12`} />.
      </>,
      <>
        Group the next four: <Formula tex={String.raw`\tfrac15 + \cdots + \tfrac18 > \tfrac12`} />.
      </>,
      <>Infinitely many groups, each at least a half: the partial sums pass every bound.</>,
    ],
    initial: 1,
  },
} satisfies Meta<typeof Steps>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Next step reveals one more; Show all the rest; the buttons go once every step shows. */
export const Reveal: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole('listitem')).toHaveLength(1);
    expect(canvas.getByText(`Step 1 of ${args.steps.length}`)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Next step' }));
    expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Show all' }));
    expect(canvas.getAllByRole('listitem')).toHaveLength(args.steps.length);
    expect(canvas.queryByRole('button', { name: 'Next step' })).toBeNull();
  },
};
