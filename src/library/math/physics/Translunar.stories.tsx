import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { OrbitSimulator } from './OrbitSimulator';
import { readout } from './stories/play';

/** A translunar trajectory in the Earth–Moon field, and the free return. */
const meta = {
  title: 'Math/Physics/Translunar',
  component: OrbitSimulator,
  decorators: [withLibraryTheme],
  parameters: { spec: { capability: 'physics-translunar', purpose: 'The Earth-Moon transfer and its free-return trajectory.', requirement: 'The transfer is integrated in the Earth-Moon field', shall: 'The translunar model SHALL integrate a spacecraft’s motion in the combined gravity of the Earth and a moving Moon with a fourth-order Runge-Kutta step, and SHALL state its accuracy: the drift of the Jacobi integral, the energy conserved in the frame turning with the Moon, over a full transfer at its default step, checked by a test.' } },
  args: { preset: 'transfer' },
} satisfies Meta<typeof OrbitSimulator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const EnergyIsKept = scenario(
  {
    name: 'Energy is kept',
    when: 'a transfer is integrated for its full duration at the default step',
    then: 'the drift in its Jacobi integral, the energy the model conserves, stays within 1 part in 100,000',
    requirement: 'The transfer is integrated in the Earth-Moon field',
    shall: 'The translunar model SHALL integrate a spacecraft’s motion in the combined gravity of the Earth and a moving Moon with a fourth-order Runge-Kutta step, and SHALL state its accuracy: the drift of the Jacobi integral, the energy conserved in the frame turning with the Moon, over a full transfer at its default step, checked by a test.',
    check: async ({ canvasElement }) => {
      expect(within(canvasElement).getByText('Jacobi drift (step 30 s)')).toBeInTheDocument();
      expect(readout(canvasElement, 'jacobi')).toBeLessThan(1e-5);
    },
  },
  {},
) as Story;

export const FreeReturn = scenario(
  {
    name: 'Free return',
    when: 'the free-return trajectory runs to its end',
    then: 'the spacecraft passes behind the Moon and comes back to Earth’s atmosphere without a burn',
    requirement: 'A free return comes home',
    shall: 'The simulator SHALL offer a free-return trajectory: launched from Earth orbit at the right moment and speed, the spacecraft swings around the Moon and returns to Earth without a further burn.',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('radio', { name: 'Free return' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(canvasElement.querySelector('[data-readout="free-return"]')).toHaveTextContent('yes'));
      expect(canvasElement.querySelector('[data-readout="behind"]')).toHaveTextContent('yes');
      expect(canvasElement.querySelector('[data-readout="returned"]')).toHaveTextContent(/^\d+(\.\d)? h$/);
      expect(within(canvasElement).getByRole('img', { name: /A free return: .* behind it, back at Earth's atmosphere/ })).toBeInTheDocument();
    },
  },
  {},
) as Story;
