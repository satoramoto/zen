import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { WaveCalculator, calculatorPresets } from './WaveCalculator';
const meta = {
  title: 'Math/Calculator/Components/Wave Calculator', component: WaveCalculator, decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' }, args: { preset: 'interference' },
  argTypes: { preset: { control: 'select', options: Object.keys(calculatorPresets) } },
} satisfies Meta<typeof WaveCalculator>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const StandingWave: Story = { args: { preset: 'standing' } };
export const Cancellation: Story = { args: { preset: 'cancellation' } };
export const Beating: Story = { args: { preset: 'beats' } };
export const FunctionComposition: Story = { args: { preset: 'composition' } };
export const EditRelationships: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await waitFor(() => expect(c.getAllByRole('button', { name: 'Plain text' })[0]).toBeEnabled());
    for (const toggle of await c.findAllByRole('button', { name: 'Plain text' })) await userEvent.click(toggle);
    const g = c.getByRole('textbox', { name: 'g(x) expression' });
    await userEvent.clear(g); await userEvent.type(g, '-f(x)');
    await expect(c.getByLabelText('h at probe')).toHaveTextContent('0.000');
    await expect(c.queryByRole('slider', { name: 'Parameter c' })).not.toBeInTheDocument();
    const f = c.getByRole('textbox', { name: 'f(x) expression' });
    await userEvent.clear(f); await userEvent.type(f, 'q*sin(x)');
    const parameter = await c.findByRole('slider', { name: 'Parameter q' });
    parameter.focus(); await userEvent.keyboard('{ArrowRight}');
    await expect(c.getByLabelText('f at probe')).toHaveTextContent('1.050');
    await expect(c.getByLabelText('g at probe')).toHaveTextContent('-1.050');
    await expect(c.getByLabelText('h at probe')).toHaveTextContent('0.000');
    const probe = c.getByRole('slider', { name: 'Graph probe' });
    probe.focus(); await userEvent.keyboard('{ArrowRight}');
    await expect(c.getByLabelText('f at probe')).not.toHaveTextContent('1.050');
  },
};
export const KeepLastValidDrawing: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement), before = c.getByLabelText('h at probe').textContent;
    await waitFor(() => expect(c.getAllByRole('button', { name: 'Plain text' })[0]).toBeEnabled());
    for (const toggle of await c.findAllByRole('button', { name: 'Plain text' })) await userEvent.click(toggle);
    const f = c.getByRole('textbox', { name: 'f(x) expression' });
    await userEvent.click(f); await userEvent.keyboard('{End}'); await userEvent.type(f, '+');
    await expect(c.getByRole('alert')).toHaveTextContent('Drawing the last valid equations');
    await expect(c.getByLabelText('h at probe')).toHaveTextContent(before!);
    await expect(c.getByRole('button', { name: 'Play motion' })).toBeDisabled();
    await userEvent.click(c.getByRole('button', { name: 'restore them' }));
    await userEvent.clear(f); await userEvent.type(f, 'h(x)');
    await expect(c.getByRole('alert')).toHaveTextContent('Circular relationship');
    await userEvent.click(c.getByRole('button', { name: 'restore them' }));
    await expect(c.queryByRole('alert')).not.toBeInTheDocument();
  },
};
export const AnimateAndCompare: Story = {
  args: { preset: 'standing' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Pin result' }));
    await userEvent.click(c.getByRole('button', { name: 'Play motion' }));
    await waitFor(() => expect(Number((c.getByRole('slider', { name: 'Time' }) as HTMLInputElement).value)).toBeGreaterThan(.1));
    await userEvent.click(c.getByRole('button', { name: 'Pause motion' }));
    await expect(c.getByText('··· pinned result')).toBeInTheDocument();
    await expect(c.getByLabelText('h at probe')).not.toHaveTextContent('2.000');
    await userEvent.click(c.getByRole('button', { name: /^Cancellation$/ }));
    await expect(c.getByLabelText('h at probe')).toHaveTextContent('0.000');
    await expect(c.queryByText('··· pinned result')).not.toBeInTheDocument();
    await expect(canvasElement.querySelector('.zen-calculator')).toHaveAttribute('data-playing', 'false');
  },
};

export const FriendlyActions: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Half as tall' }));
    await expect(c.getByLabelText('f at probe')).toHaveTextContent('0.500');
    await userEvent.click(c.getByRole('button', { name: 'Fade from center' }));
    const envelope = await c.findByRole('slider', { name: 'Parameter k' });
    await expect(envelope).toHaveAttribute('aria-valuenow', '0.35');
    await userEvent.click(c.getByRole('button', { name: 'Explore k in f' }));
    await waitFor(() => expect(c.getByRole('slider', { name: 'Adjust k in f' })).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}');
    await expect(envelope).toHaveAttribute('aria-valuenow', '0.4');
    await expect(c.getByRole('button', { name: 'Explore k in h' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(c.getByRole('button', { name: 'Show all curves' }));
    await expect(c.getByRole('button', { name: 'Explore k in h' })).toHaveAttribute('aria-pressed', 'false');
  },
};

/** Selecting a subtree previews linked curves without modifying the live equations. */
export const ExploreParts: Story = {
  args: { preset: 'composition' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Explore parts of f' }));
    await userEvent.click(c.getByRole('button', { name: 'Select sin function, part 3' }));
    await userEvent.click(c.getByRole('button', { name: /^Half as large$/ }));
    await expect(c.getByLabelText('f at probe')).toHaveTextContent('1.000');
    await expect(c.getByText('– – proposal · not applied')).toBeInTheDocument();
    await userEvent.click(c.getByRole('button', { name: 'Apply change' }));
    await expect(c.getByLabelText('f at probe')).toHaveTextContent('0.500');
    await expect(c.getByLabelText('h at probe')).toHaveTextContent('0.500');
    await expect(c.queryByText('– – proposal · not applied')).not.toBeInTheDocument();
    await userEvent.click(c.getByRole('button', { name: 'Undo transformation' }));
    await expect(c.getByLabelText('f at probe')).toHaveTextContent('1.000');
    await userEvent.click(c.getByRole('button', { name: 'Explore parts of f' }));
    await userEvent.click(c.getByRole('button', { name: 'Flip its sign' }));
    await userEvent.click(c.getByRole('button', { name: 'Close equation exploration' }));
    await expect(c.getByLabelText('f at probe')).toHaveTextContent('1.000');
    await expect(c.queryByText('– – proposal · not applied')).not.toBeInTheDocument();
  },
};
