import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Text } from '../../../primitives/Text/Text';
import { Formula } from './Formula';

/** A formula in native MathML: TeX typeset by temml, set in the contract's math face. */
const meta = {
  title: 'Compendium/Components/Formula',
  component: Formula,
  decorators: [withLibraryTheme],
  args: { tex: String.raw`\sum_{n=1}^{\infty} \frac{1}{n} = \infty`, block: false, label: 'The sum over n from 1 to infinity of 1 over n is infinite' },
} satisfies Meta<typeof Formula>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Inline, in running text: it takes the size of the text around it. */
export const Inline: Story = {
  render: (args) => (
    <Text as="p" role="body">
      The harmonic series <Formula {...args} /> adds the reciprocals of the counting numbers; its partial sums <Formula tex="H_n" /> grow like{' '}
      <Formula tex={String.raw`\ln n + \gamma`} />.
    </Text>
  ),
  play: async ({ canvasElement }) => {
    // Plain DOM checks: jest-dom's matchers refuse MathML elements.
    const maths = canvasElement.querySelectorAll('math');
    expect(maths).toHaveLength(3);
    expect(maths[0].getAttribute('aria-label')).toBe(meta.args.label);
    expect(maths[0].querySelector('annotation')?.textContent).toBe(meta.args.tex);
  },
};

/** Displayed on its own line, centred in the reading column. */
export const Display: Story = {
  args: { block: true, tex: String.raw`1 + \frac{1}{2} + \left(\frac{1}{3} + \frac{1}{4}\right) + \left(\frac{1}{5} + \cdots + \frac{1}{8}\right) + \cdots \ge 1 + \frac{1}{2} + \frac{1}{2} + \frac{1}{2} + \cdots` },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('math')?.getAttribute('display')).toBe('block');
  },
};
