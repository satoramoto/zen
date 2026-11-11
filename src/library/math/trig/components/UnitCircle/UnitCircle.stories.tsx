import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { UnitCircle } from './UnitCircle';

/** The unit circle: drag the point round; sine is its height, cosine its reach, and the signs follow the quadrant. */
const meta = {
  title: 'Math/Trig/Components/Unit Circle',
  component: UnitCircle,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof UnitCircle>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Into the third quadrant: sine and cosine go negative, tangent positive, the reference angle reads 30°. */
export const ThirdQuadrant: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('slider', { name: 'Angle' });
    expect(handle).toHaveAttribute('aria-valuenow', '30');
    handle.focus();
    // Shift steps 15°: 30 → 210 is twelve big steps.
    for (let i = 0; i < 12; i++) await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '210'));
    expect(canvas.getByText(/Quadrant III: sine −, cosine −, tangent \+/)).toBeInTheDocument();
    expect(canvas.getByText(/Reference angle 30°/)).toBeInTheDocument();
    expect(canvas.getByRole('img', { name: /210° \(7π\/6\)/ })).toBeInTheDocument();
  },
};

// Stories tagged browser below need a laid-out page: they play in a real browser, not on zen-stories' virtual DOM.
/** Dragging the point by hand: a pointer drag to the top of the circle reads 90°. */
export const Drag: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const svg = canvasElement.querySelector('svg.zen-trig__plane')!;
    const handle = canvas.getByRole('slider', { name: 'Angle' });
    const box = svg.getBoundingClientRect();
    const grip = handle.querySelector('circle:last-child')!.getBoundingClientRect();
    const start = { clientX: grip.x + grip.width / 2, clientY: grip.y + grip.height / 2, pointerId: 1, bubbles: true };
    handle.dispatchEvent(new PointerEvent('pointerdown', start));
    handle.dispatchEvent(new PointerEvent('pointermove', { ...start, clientX: box.x + box.width / 2, clientY: box.y + box.height * 0.1 }));
    handle.dispatchEvent(new PointerEvent('pointerup', { ...start, clientX: box.x + box.width / 2, clientY: box.y + box.height * 0.1 }));
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '90'));
  },
  tags: ['browser'],
};

/** Snapping lands the point on a special angle; the tangent segment and a sine guide show on request. */
export const SnapAndTangent: Story = {
  args: { angle: 43, tangent: true, guideSin: 0.5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', { name: /snap/i }));
    const handle = canvas.getByRole('slider', { name: 'Angle' });
    handle.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '45'));
    expect(canvas.getAllByText(/tan 1/).length).toBeGreaterThan(0);
  },
};
