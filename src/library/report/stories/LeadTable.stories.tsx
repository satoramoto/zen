import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
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

function OpenableTable({ leads, filter }: { leads: readonly Lead[]; filter: LeadFilter }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <Stack direction="column" gap={3}>
      <Text role="caption" tone="muted" data-testid="opened">
        {selected === null ? 'None open' : `Open: ${leads[selected]?.name}`}
      </Text>
      <LeadTable leads={leads} filter={filter} onOpen={(_, i) => setSelected(i)} selected={selected} />
    </Stack>
  );
}

/** `onOpen` and `selected`: each name is a button (click, Enter or Space), a click on the row opens it too, and the open row is marked current. */
export const Openable: Story = {
  args: { tier: 'A' },
  render: (args) => <OpenableTable leads={args.leads} filter={filterOf(args)} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('[data-part="row"]')];
    const [first, second, third] = rows;
    const nameOf = (row: HTMLElement) => row.querySelector('[data-part="name"]')!.textContent!;
    // No row is current, and names don't link out.
    await expect(canvasElement.querySelector('[aria-current]')).toBeNull();
    await expect(first!.querySelector('[data-col="name"] a')).toBeNull();
    // A click on the name opens it.
    await userEvent.click(within(first!).getByRole('button', { name: nameOf(first!) }));
    await expect(c.getByTestId('opened').textContent).toBe(`Open: ${nameOf(first!)}`);
    await expect(first!.getAttribute('aria-current')).toBe('true');
    await expect(first!.hasAttribute('data-selected')).toBe(true);
    // Enter on the next name moves the selection.
    within(second!).getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    await expect(c.getByTestId('opened').textContent).toBe(`Open: ${nameOf(second!)}`);
    await expect(first!.hasAttribute('aria-current')).toBe(false);
    await expect(second!.getAttribute('aria-current')).toBe('true');
    // Space works too, and a click elsewhere on the row opens it.
    within(third!).getByRole('button').focus();
    await userEvent.keyboard(' ');
    await expect(c.getByTestId('opened').textContent).toBe(`Open: ${nameOf(third!)}`);
    await userEvent.click(first!.querySelector<HTMLElement>('[data-col="location"]')!);
    await expect(first!.getAttribute('aria-current')).toBe('true');
    await expect(canvasElement.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};

/** `columns` picks and orders the built-in columns (`window` among them); `extra` adds one the app fills. */
export const Columns: Story = {
  render: (args) => (
    <LeadTable
      leads={args.leads}
      filter={filterOf(args)}
      columns={['name', 'channel', 'window', 'fee', 'travel']}
      extra={{ title: 'Row', render: (_, i) => i + 1 }}
    />
  ),
  play: async ({ canvasElement }) => {
    const heads = [...canvasElement.querySelectorAll('thead th')].map((th) => th.getAttribute('data-col'));
    await expect(heads).toEqual(['name', 'channel', 'window', 'fee', 'travel', 'extra']);
    const first = canvasElement.querySelector('[data-part="row"]')!;
    await expect(first.querySelectorAll('[data-col]')).toHaveLength(6);
    await expect(first.querySelector('[data-col="extra"]')!.textContent).toBe('1');
    await expect(canvasElement.querySelector('[data-part="group-head"] th')!.getAttribute('colspan')).toBe('6');
  },
};
