import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Formula } from '../../components/Formula/Formula';
import { Mark } from '../../components/Mark/Mark';
import { Sidenote } from '../../components/Sidenote/Sidenote';
import { H, P, Reading, Wide } from './Reading';

/**
 * The reading column at a measure, a margin beside it for notes and marks, and wide blocks that
 * take both. Below 44rem the margin folds and notes sit inline.
 */
const meta = {
  title: 'Compendium/Layouts/Reading',
  component: Reading,
  decorators: [withLibraryTheme],
  args: { measure: 66 },
  argTypes: { measure: { control: { type: 'range', min: 44, max: 76, step: 1 } } },
  render: (args) => (
    <Reading {...args}>
      <H>The series</H>
      <P>
        <Mark standing="consequence" />
        The harmonic series adds the reciprocals of the counting numbers, and its sum is infinite. It gets there slowly: the sum of the first{' '}
        <Formula tex="n" /> terms grows like <Formula tex={String.raw`\ln n + \gamma`} />, so a million terms add up to only about 14.39.
        <Sidenote>Euler showed in 1734 that H(n) − ln n tends to a constant.</Sidenote>
      </P>
      <Formula block tex={String.raw`\sum_{n=1}^{\infty} \frac{1}{n} = \infty`} />
      <P>
        <Mark standing="conjecture" />
        The partial sums even reach the Riemann hypothesis: Lagarias showed it equivalent to an inequality in them.
        <Sidenote cite>J. C. Lagarias, American Mathematical Monthly 109 (2002).</Sidenote>
      </P>
      <Wide>
        <div style={{ blockSize: '6rem', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-card)' }} aria-label="A wide block" role="img" />
      </Wide>
    </Reading>
  ),
} satisfies Meta<typeof Reading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Column: Story = {
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('.cmp-reading');
    expect(root?.style.getPropertyValue('--cmp-measure')).toBe(`${args.measure}ch`);
  },
};

/** The measure is clamped to 44–76ch. */
export const Clamped: Story = {
  args: { measure: 120 },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.cmp-reading');
    expect(root?.style.getPropertyValue('--cmp-measure')).toBe('76ch');
  },
};
