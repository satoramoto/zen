import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { FieldShape } from './FieldShape';

/** The box field in 3D: a height surface, or the same values wrapped onto a sphere. */
const meta = {
  title: 'Math/Primes/Components/Field Shape',
  component: FieldShape,
  decorators: [withLibraryTheme],
  argTypes: {
    count: { control: { type: 'range', min: 1, max: 2000, step: 1 } },
    shape: { control: 'inline-radio', options: ['plane', 'sphere'] },
    turn: { control: { type: 'range', min: 0, max: 359, step: 1 } },
    tilt: { control: { type: 'range', min: -60, max: 60, step: 1 } },
  },
} satisfies Meta<typeof FieldShape>;
export default meta;
type Story = StoryObj<typeof meta>;

const description = (canvasElement: HTMLElement) => canvasElement.querySelector('[data-part="description"]')?.textContent ?? '';

/** The field as a height surface; the turn buttons rotate it from the keyboard. */
export const Plane: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(description(canvasElement)).toMatch(/200 primes'.*as a plane/);
    expect(description(canvasElement)).toContain('turned 30°');
    expect(canvas.getByRole('group', { name: /200 primes' box field as a plane/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Turn right' }));
    await waitFor(() => expect(description(canvasElement)).toContain('turned 45°'));
  },
};

/** The same values on a sphere: across round the equator, up from pole to pole. */
export const Sphere: Story = {
  args: { shape: 'sphere' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(description(canvasElement)).toContain('on a sphere'));
    await userEvent.click(canvas.getByRole('radio', { name: 'Plane' }));
    await waitFor(() => expect(description(canvasElement)).toContain('as a plane'));
  },
};
