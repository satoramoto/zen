import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { ComputeObservatory, ImpulseLaunch, StudioLaunchpad } from './Landing';

const meta = {
  title: 'Site/Screens/Landing',
  component: ComputeObservatory,
  parameters: {
    layout: 'fullscreen',
    spec: {
      capability: 'site-landing',
      purpose: 'Three reference-locked landing page directions built in Zen for compute fabric and impulse site hosting.',
    },
  },
} satisfies Meta<typeof ComputeObservatory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComputeObservatoryPage: Story = {
  name: '1. Compute Observatory (Modal dark)',
  render: () => <ComputeObservatory />,
  ...scenario({
    requirement: 'Technical compute fabric landing page',
    shall: 'The Compute Observatory landing screen SHALL present the spot GPU/CPU wire fabric, allow switching rate units between per-second and hourly/flat, and display the proof reversal band.',
    when: 'a visitor opens the Compute Observatory landing page and switches the billing unit',
    then: 'the rate table updates from per-second to hourly and flat pricing',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText('$0.00011 / s')).toBeVisible();
      await userEvent.click(canvas.getByRole('button', { name: /vast-fra-h100-07/i }));
      await userEvent.click(canvas.getByRole('button', { name: 'ZK Prover' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Hourly / flat' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('One Unix command across every idle GPU');
      await expect(canvas.getAllByText('EXEC_GRAPH · P0 · zk-prove').length).toBe(2);
      await expect(canvas.getByText('$0.39 / hr')).toBeVisible();
      await expect(canvas.getByText('$5.00 / mo flat')).toBeVisible();
    },
  }),
};

export const StudioLaunchpadPage: Story = {
  name: '2. Studio Launchpad (Expo light)',
  render: () => <StudioLaunchpad />,
  ...scenario({
    requirement: 'Light studio app hosting landing page',
    shall: 'The Studio Launchpad landing screen SHALL allow checking a custom domain and switching live mockup templates in the soft-machinery stage.',
    when: 'a visitor checks a domain name and selects the Landing + AI API template',
    then: 'the domain availability status and preview headline update immediately',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const input = canvas.getByLabelText('Domain name to check');
      await userEvent.clear(input);
      await userEvent.type(input, 'opalhost.com');
      await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Landing + AI API' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('status')).toHaveTextContent('opalhost.com');
      await expect(canvas.getAllByText('Turn voice memos into structured release notes.').length).toBe(2);
    },
  }),
};

export const ImpulseLaunchPage: Story = {
  name: '3. Impulse Launch (Linktree color blocks)',
  render: () => <ImpulseLaunch />,
  ...scenario({
    requirement: 'Bold impulse launchpad landing page',
    shall: 'The Impulse Launch landing screen SHALL let a visitor preview a custom .com handle inside the live floating card stack and inspect FAQ answers.',
    when: 'a visitor enters a new site name, clicks Preview my site, and opens the first FAQ question',
    then: 'the floating preview card and closing CTA reflect the claimed domain and reveal the FAQ answer',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const input = canvas.getByLabelText('Choose your site name');
      await userEvent.clear(input);
      await userEvent.type(input, 'latenightpizza');
      await userEvent.click(canvas.getByRole('button', { name: 'Preview my site' }));
      await userEvent.click(canvas.getByText('What happens if I only get 12 visitors all month?'));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('status')).toHaveTextContent('Live preview ready for latenightpizza.com');
      await expect(canvas.getByRole('link', { name: 'Claim latenightpizza.com' })).toBeVisible();
      await expect(canvas.getByText(/wakes in under 150ms/i)).toBeVisible();
    },
  }),
};
