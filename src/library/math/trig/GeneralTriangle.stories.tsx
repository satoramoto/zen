import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { GeneralTriangle } from './GeneralTriangle';

/** Any triangle: drag its corners; the law of sines, the law of cosines and the area follow. */
const meta = {
  title: 'Math/Trig/General Triangle',
  component: GeneralTriangle,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof GeneralTriangle>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The value shown beside a readout's label. */
function readout(root: HTMLElement, label: string): string {
  const el = [...root.querySelectorAll('.zen-trig__readout')].find((r) => r.firstElementChild?.textContent === label);
  if (!el) throw new Error(`No readout "${label}"`);
  return el.lastElementChild?.textContent ?? '';
}

const drawing = (root: HTMLElement) => root.querySelector('svg.zen-trig__plane')!.getAttribute('aria-label');

/** Move C about: the three ratios a/sin A, b/sin B and c/sin C read the same to two decimals. */
export const LawOfSines: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = drawing(canvasElement);
    const ratios = () => ['a / sin A', 'b / sin B', 'c / sin C'].map((l) => readout(canvasElement, l));
    const [r0] = ratios();
    const vertex = canvas.getByRole('button', { name: 'Vertex C' });
    vertex.focus();
    for (let i = 0; i < 3; i++) await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(drawing(canvasElement)).not.toBe(before));
    const [a, b, c] = ratios();
    expect(a).toMatch(/^\d+\.\d\d$/);
    expect(b).toBe(a);
    expect(c).toBe(a);
    expect(a).not.toBe(r0); // the triangle really changed size
    expect(readout(canvasElement, 'A + B + C')).toBe('180.0°');
    expect(canvas.getByText(/All three are equal: the law of sines/)).toBeInTheDocument();
  },
};

/** For angle C, c² equals a² + b² − 2ab·cos C, after moving a corner. */
export const LawOfCosines: Story = {
  args: { law: 'cosines' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = drawing(canvasElement);
    canvas.getByRole('button', { name: 'Vertex B' }).focus();
    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}{ArrowUp}{ArrowUp}');
    await waitFor(() => expect(drawing(canvasElement)).not.toBe(before));
    const lhs = readout(canvasElement, 'c²');
    const rhs = readout(canvasElement, 'a² + b² − 2ab·cos C');
    expect(rhs.split('= ').pop()).toBe(lhs);
    expect(canvas.getByText(/shrinks to zero when C is 90°/)).toBeInTheDocument();
  },
};

/** ½·a·b·sin C and the area worked out from the corners agree. */
export const Area: Story = {
  args: { law: 'area' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(readout(canvasElement, '½·a·b·sin C')).toBe(readout(canvasElement, 'Area from the corners'));
    canvas.getByRole('button', { name: 'Vertex A' }).focus();
    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}{ArrowRight}');
    await waitFor(() => expect(readout(canvasElement, '½·a·b·sin C')).toBe(readout(canvasElement, 'Area from the corners')));
  },
};

/** Side, side, angle: the same angle A and side b with side a swung to fit two, one or no triangles. */
export const AmbiguousCase: Story = {
  args: { ambiguous: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'One triangle' }));
    await waitFor(() => expect(canvas.getByText(/One triangle fits/)).toBeInTheDocument());
    await userEvent.click(canvas.getByRole('button', { name: 'Two triangles' }));
    await waitFor(() => expect(canvas.getByText(/Two triangles fit the same side, side, angle/)).toBeInTheDocument());
    expect(readout(canvasElement, 'Triangles')).toBe('2');
    expect(drawing(canvasElement)).toMatch(/Two triangles fit/);
    // The slider and the readout agree on side a.
    const slider = canvas.getByRole('slider', { name: /side a/i });
    expect(Number(slider.getAttribute('aria-valuenow'))).toBe(Number(readout(canvasElement, 'Side a')));
    await userEvent.click(canvas.getByRole('button', { name: 'No triangle' }));
    await waitFor(() => expect(canvas.getByText(/No triangle fits/)).toBeInTheDocument());
    expect(readout(canvasElement, 'Triangles')).toBe('0');
  },
};
