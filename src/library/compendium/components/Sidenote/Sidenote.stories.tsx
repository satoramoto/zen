import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { P, Reading } from '../../layout/Reading/Reading';
import { Sidenote } from './Sidenote';

/** A numbered note hung in the margin beside its line; a citation reads the same, as a source. */
const meta = {
  title: 'Compendium/Components/Sidenote',
  component: Sidenote,
  decorators: [withLibraryTheme],
  args: { children: 'Euler showed in 1734 that H(n) − ln n tends to a constant, and computed it to several places.', cite: false },
  render: (args) => (
    <Reading>
      <P>
        It gets there slowly: a million terms add up to only about 14.39.
        <Sidenote {...args} />
      </P>
      <P>
        The partial sums even reach the Riemann hypothesis.
        <Sidenote cite>J. C. Lagarias, “An elementary problem equivalent to the Riemann hypothesis”, American Mathematical Monthly 109 (2002).</Sidenote>
      </P>
    </Reading>
  ),
  play: async ({ canvasElement }) => {
    const notes = canvasElement.querySelectorAll('.cmp-sidenote');
    expect(notes).toHaveLength(2);
    expect(notes[1]).toHaveAttribute('data-cite');
  },
} satisfies Meta<typeof Sidenote>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Aside: Story = {};
export const Citation: Story = { args: { cite: true, children: 'J. Sauveur, “Système général des intervalles des sons” (1701).' } };
