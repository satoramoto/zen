import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { RadiusStrips } from './RadiusStrips';

function Comparison() {
  const [radius, setRadius] = useState(2);
  const [radians, setRadians] = useState(1);
  return <div>
    <button onClick={() => setRadius(radius === 2 ? 4 : 2)}>Double the radius</button>
    <button onClick={() => setRadians(radians === 1 ? 2 : 1)}>Add a second strip</button>
    <RadiusStrips radius={2} radians={radians} scaleRadius={4} unwrapped />
    <RadiusStrips radius={radius} radians={radians} scaleRadius={4} unwrapped />
  </div>;
}
const meta = { title: 'Math/Trig/Components/RadiusStrips', component: RadiusStrips, decorators: [withLibraryTheme] } satisfies Meta<typeof RadiusStrips>;
export default meta;
type Story = StoryObj<typeof meta>;
export const EqualScale: Story = {
  render: () => <Comparison />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Double the radius' }));
    const drawings = canvasElement.querySelectorAll('[data-radians]');
    expect(drawings[0]).toHaveAttribute('data-arc-length', '2');
    expect(drawings[1]).toHaveAttribute('data-arc-length', '4');
    expect(drawings[1]).toHaveAttribute('data-radians', '1');
    const circles = [...drawings].map((drawing) => Number(drawing.querySelector('circle')!.getAttribute('r')));
    expect(circles[1]).toBe(circles[0] * 2);
    await userEvent.click(canvas.getByRole('button', { name: 'Add a second strip' }));
    expect(drawings[1]).toHaveAttribute('data-arc-length', '8');
    expect(drawings[1]).toHaveAttribute('data-radians', '2');
  },
};
export const TwoRadiusLengths: Story = {
  render: () => <div><RadiusStrips radius={3} scaleRadius={6} radians={2} unwrapped /><RadiusStrips radius={6} scaleRadius={6} radians={2} unwrapped /></div>,
  play: ({ canvasElement }) => {
    const drawings = canvasElement.querySelectorAll('[data-radians]');
    expect(drawings[0]).toHaveAttribute('data-arc-length', '6');
    expect(drawings[1]).toHaveAttribute('data-arc-length', '12');
    for (const drawing of drawings) expect(drawing).toHaveAttribute('data-radians', '2');
  },
};
export const FullCircle: Story = { args: { radians: 2 * Math.PI, unwrapped: true } };
