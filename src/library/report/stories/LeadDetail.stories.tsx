import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import type { Lead } from '../model/report';
import { LeadDetail, type DetailField } from '../view/LeadDetail/LeadDetail';
import { LeadTable } from '../view/LeadTable/LeadTable';
import { REPORT } from './report.fixtures';

const LEAD: Lead = REPORT.leads.find((l) => l.window && l.comparable && l.contact && l.url) ?? REPORT.leads[0]!;

/** What an app might show of a lead: its own labels, blank values dropped, a contact as a mail link. */
const fieldsOf = (lead: Lead): DetailField[] =>
  [
    { label: 'Angle', value: lead.skip ? `Skip: ${lead.skip}` : (lead.angle ?? '') },
    { label: 'Window', value: lead.window ?? '' },
    { label: 'Contact', value: lead.contact ?? '', href: lead.contact?.includes('@') ? `mailto:${lead.contact}` : null },
    { label: 'Comparable', value: lead.comparable ?? '' },
    { label: 'Size', value: lead.fee ?? '' },
    { label: 'Travel', value: lead.travel ?? '' },
    { label: 'Status', value: lead.status },
  ].filter((f) => f.value);

const NOTES: DetailField = { label: 'Notes', value: 'First pass done.\nCheck the page again in spring for the new dates.' };

const meta: Meta<typeof LeadDetail> = {
  title: 'Design OS/Report/Lead Detail',
  component: LeadDetail,
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "One opened lead: its header (name linked to its page, location, when, channel), the app's note, the research fields as a definition list in the order given (line breaks kept; a field with an `href` is a link, `mailto:` included), the sources and whatever the app adds last.",
      },
    },
  },
  args: {
    lead: LEAD,
    fields: [...fieldsOf(LEAD), NOTES],
    sources: REPORT.sources?.slice(0, 2) ?? null,
    note: 'Researched from the lead’s own page and two listings.',
  },
  render: (args) => (
    <div style={{ maxWidth: '60ch' }}>
      <LeadDetail {...args} />
    </div>
  ),
};
export default meta;

type Story = StoryObj<typeof LeadDetail>;

/** The fixture's richest lead with hand-written fields; a mail link, a multi-line note, two sources. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole('region', { name: LEAD.name })).toBeTruthy();
    await expect(c.getByRole('link', { name: LEAD.name }).getAttribute('href')).toBe(LEAD.url);
    await expect(canvasElement.querySelectorAll('[data-part="field"]')).toHaveLength(fieldsOf(LEAD).length + 1);
    await expect(c.getByRole('link', { name: LEAD.contact! }).getAttribute('href')).toBe(`mailto:${LEAD.contact}`);
  },
};

function Board() {
  const [open, setOpen] = useState<number | null>(null);
  const lead = open === null ? null : REPORT.leads[open];
  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '2 1 32rem', minWidth: 0 }}>
        <LeadTable
          leads={REPORT.leads}
          filter={{ tier: LEAD.tier }}
          columns={['name', 'location', 'channel', 'window']}
          extra={{ title: 'Fields', render: (l) => fieldsOf(l).length }}
          onOpen={(_, i) => setOpen(i)}
          selected={open}
        />
      </div>
      {lead ? (
        <div style={{ flex: '1 1 20rem', minWidth: 0 }}>
          <LeadDetail lead={lead} fields={fieldsOf(lead)} onClose={() => setOpen(null)} />
        </div>
      ) : null}
    </div>
  );
}

/** A board an app composes: the table with `onOpen`, `selected`, `columns` and `extra`, the opened lead beside it. */
export const InABoard: Story = {
  render: () => <Board />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: LEAD.name }));
    await expect(c.getByRole('region', { name: LEAD.name })).toBeTruthy();
    await userEvent.click(c.getByRole('button', { name: 'Close' }));
    await expect(c.queryByRole('region', { name: LEAD.name })).toBeNull();
  },
};
