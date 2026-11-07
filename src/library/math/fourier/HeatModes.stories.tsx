import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { HeatModes } from './HeatModes';

/** Heat on a rod as cosine modes that keep their shape and shrink, faster by the square of their frequency. */
const meta = {
  title: 'Math/Fourier/Heat Modes',
  component: HeatModes,
  decorators: [withLibraryTheme],
  args: { time: 0, showModes: true },
  argTypes: { time: { control: { type: 'range', min: 0, max: 0.25, step: 0.001 } } },
} satisfies Meta<typeof HeatModes>;
export default meta;
type Story = StoryObj<typeof meta>;

/** At time 0 every mode is whole; later the high ones are gone first. */
export const Cooling: Story = {
  render: (args) => <HeatModes {...args} time={undefined} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('mode 4: 100%')).toBeInTheDocument();
    const slider = canvas.getByRole('slider', { name: /time/i });
    slider.focus();
    await userEvent.keyboard('{End}');
    expect(canvas.getByText('mode 0: 100%')).toBeInTheDocument();
    expect(canvas.getByText('mode 4: 0%')).toBeInTheDocument();
  },
};

/** Only the sum, which is what a thermometer would see. */
export const SumOnly: Story = { args: { showModes: false, time: 0.01 } };
