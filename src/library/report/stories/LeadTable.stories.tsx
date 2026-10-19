import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { CHANNELS, TIERS, readyLeads, type Channel, type Lead, type LeadFilter, type Tier } from '../model/report';
import { LeadTable } from '../view/LeadTable/LeadTable';
import { REPORT } from './report.fixtures';

const ANY = 'any';

interface Args {
  tier: Tier | typeof ANY;
  channel: Channel | typeof ANY;
  ready: boolean;
  leads: readonly Lead[];
}

const filterOf = ({ tier, channel, ready }: Args): LeadFilter => ({
  ...(tier === ANY ? {} : { tier }),
  ...(channel === ANY ? {} : { channel }),
  ready,
});

const meta: Meta<Args> = {
  title: 'Design OS/Report/Lead Table',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The leads grouped by tier. The controls are the `filter` prop: a tier, a channel, and `ready` (tier A, reached by email or form, not marked skip). Narrow the canvas under 40rem and the rows stack.',
      },
    },
  },
  args: { tier: ANY, channel: ANY, ready: false, leads: REPORT.leads },
  argTypes: {
    tier: { control: 'inline-radio', options: [ANY, ...TIERS] },
    channel: { control: 'select', options: [ANY, ...CHANNELS] },
    ready: { control: 'boolean', description: 'Only the leads ready to contact now.' },
    leads: { table: { disable: true } },
  },
  render: (args) => <LeadTable leads={args.leads} filter={filterOf(args)} />,
};
export default meta;

type Story = StoryObj<Args>;

export const AllLeads: Story = {};

/** The preset: tier A leads that take an email or a form and are not marked skip. */
export const ReadyToContact: Story = {
  args: { ready: true },
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('[data-part="row"]');
    await expect(rows).toHaveLength(readyLeads(REPORT).length);
    for (const row of rows) await expect(row.getAttribute('data-tier')).toBe('A');
  },
};

/** No lead passes the filter: the empty state stands in for the table. */
export const Empty: Story = {
  args: { tier: 'C', channel: 'email' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No leads match.')).toBeTruthy();
    await expect(canvasElement.querySelector('table')).toBeNull();
  },
};
