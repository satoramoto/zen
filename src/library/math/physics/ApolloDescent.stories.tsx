import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { ApolloDescentSimulator } from './ApolloDescentSimulator';
import { INITIAL_APOLLO_11_DESCENT_STATE } from './model/apolloDescent';
import { vec2 } from './model/vector2';

const meta = {
  title: 'Math/Physics/Apollo Lunar Descent',
  component: ApolloDescentSimulator,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ApolloDescentSimulator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultBrakingP63: Story = {
  args: {
    autoPlay: false,
  },
};

export const HighGateP64Approach: Story = {
  args: {
    initialState: {
      ...INITIAL_APOLLO_11_DESCENT_STATE,
      pos: vec2(-5000, 2300),
      vel: vec2(150, -25),
      propellantMass: 3200,
      pitchAngle: (120 * Math.PI) / 180,
      program: 'P64',
      flightStatus: 'APPROACH',
    },
    autoPlay: false,
  },
};

export const LowGateP66ManualROD: Story = {
  args: {
    initialState: {
      ...INITIAL_APOLLO_11_DESCENT_STATE,
      pos: vec2(-200, 140),
      vel: vec2(12, -2.5),
      propellantMass: 950,
      pitchAngle: (85 * Math.PI) / 180,
      program: 'P66',
      flightStatus: 'TERMINAL_ROD',
      commandedROD: -1.0,
    },
    autoPlay: false,
  },
};

export const DskyInteractions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Verify DSKY exists
    const dsky = await canvas.findByRole('region', { name: 'Apollo Guidance Computer DSKY' });
    await expect(dsky).toBeInTheDocument();

    // Trigger 1202 alarm
    const alarmBtn = canvas.getByRole('button', { name: 'TEST 1202 OVERFLOW' });
    await userEvent.click(alarmBtn);
    await expect(canvas.getByText('1202 ALARM')).toHaveClass('zen-dsky__lamp--alarm');

    // Acknowledge alarm
    const ackBtn = canvas.getByRole('button', { name: 'ACK 1202 (KEY REL)' });
    await userEvent.click(ackBtn);
    await expect(canvas.getByText('1202 ALARM')).not.toHaveClass('zen-dsky__lamp--alarm');
  },
};
