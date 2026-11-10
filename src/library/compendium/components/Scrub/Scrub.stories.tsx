import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { P, Reading } from '../../layouts/Reading/Reading';
import type { Quantity } from '../../model/document';
import { Ref, Scrub } from './Scrub';

/** A quantity in the text and a read-out of it, sharing one value. */
function Linked({ quantity }: { quantity: Quantity }) {
  const [q, setQ] = useState(quantity);
  return (
    <Reading>
      <P>
        Mode <Scrub name="n" quantity={q} onChange={(value) => setQ({ ...q, value })} /> has <Ref quantity={q} format="{} loops" /> and{' '}
        <Ref quantity={{ ...q, value: q.value - 1 }} format="{} nodes" /> between the ends. Drag the number, or focus it and use the arrow keys.
      </P>
    </Reading>
  );
}

/** A number in running text the reader drags or steps; whatever reads the same quantity follows. */
const meta = {
  title: 'Compendium/Components/Scrub',
  component: Linked,
  decorators: [withLibraryTheme],
  args: { quantity: { value: 3, min: 1, max: 8, step: 1, label: 'Harmonic n' } },
} satisfies Meta<typeof Linked>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Arrow keys step it, Shift steps by ten, Home and End go to the ends; the read-outs follow. */
export const Keys: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scrub = canvas.getByRole('slider', { name: 'Harmonic n' });
    scrub.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(scrub).toHaveAttribute('aria-valuenow', '5');
    expect(canvas.getByText('5 loops')).toBeInTheDocument();
    expect(canvas.getByText('4 nodes')).toBeInTheDocument();
    await userEvent.keyboard('{End}');
    expect(scrub).toHaveAttribute('aria-valuenow', '8');
    await userEvent.keyboard('{Home}');
    expect(scrub).toHaveAttribute('aria-valuenow', '1');
    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(scrub).toHaveAttribute('aria-valuenow', '8');
  },
};

/** Steps count from the minimum: 1 to 101 in twos stays on the odd numbers. */
export const OddSteps: Story = {
  args: { quantity: { value: 21, min: 1, max: 101, step: 2, label: 'Arrows' } },
  play: async ({ canvasElement }) => {
    const scrub = within(canvasElement).getByRole('slider', { name: 'Arrows' });
    scrub.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(scrub).toHaveAttribute('aria-valuenow', '23');
    await userEvent.keyboard('{End}');
    expect(scrub).toHaveAttribute('aria-valuenow', '101');
    await userEvent.keyboard('{ArrowLeft}');
    expect(scrub).toHaveAttribute('aria-valuenow', '99');
  },
};

/** A fractional step shows its decimals and a unit. */
export const Fractional: Story = {
  args: { quantity: { value: 0.5, min: 0, max: 1, step: 0.05, unit: 'of the way', label: 'Position' } },
  play: async ({ canvasElement }) => {
    const scrub = within(canvasElement).getByRole('slider', { name: 'Position' });
    expect(scrub).toHaveTextContent('0.50 of the way');
    scrub.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(scrub).toHaveAttribute('aria-valuenow', '0.45');
  },
};
