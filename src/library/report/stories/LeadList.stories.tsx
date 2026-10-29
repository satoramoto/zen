import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { isReady, type Lead } from '../model/report';
import { LeadList, type LeadAction, type WhenBlock } from '../view/LeadList/LeadList';
import { REPORT } from './report.fixtures';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A sample parser: `2026-07-16..2026-07-18 (…)` → `Jul` / `16` / `to 18 · 2026`; anything else as the top line. */
function whenOf(lead: Lead): WhenBlock | null {
  if (!lead.when) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:\.\.(\d{4})-(\d{2})-(\d{2}))?/.exec(lead.when);
  if (!m) return { top: lead.when, big: '' };
  const [, year, month, day, , , endDay] = m;
  const end = endDay ? `to ${Number(endDay)} · ` : '';
  return { top: MONTHS[Number(month) - 1] ?? '', big: String(Number(day)), foot: `${end}${year}` };
}

/** A sample next step in generic words. */
function actionOf(lead: Lead, index: number): LeadAction | null {
  if (lead.skip) return { label: 'Done', tone: 'done', note: 'Not pursuing' };
  if (isReady(lead)) return lead.channel === 'form' ? { label: 'Apply', tone: 'go', note: 'Form open' } : { label: 'Reach out', tone: 'go', note: lead.contact ?? null };
  if (lead.tier === 'A') return { label: 'Reach out soon', tone: 'soon', note: 'Find a contact' };
  if (index % 7 === 0) return { label: 'Follow up overdue', tone: 'urgent', note: 'No reply in two weeks' };
  return lead.tier === 'B' ? { label: 'Wait', tone: 'done' } : null;
}

interface Args {
  leads: readonly Lead[];
  grouped: boolean;
  compact: boolean;
}

const meta: Meta<Args> = {
  title: 'Design OS/Report/Lead List',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The leads as rows built for importance: an action, a date block, the lead and its details. The story passes a sample `when` parser and `action` function. Narrow the canvas under 40rem and the rows stack.',
      },
    },
  },
  args: { leads: REPORT.leads, grouped: false, compact: false },
  argTypes: { leads: { table: { disable: true } } },
  render: (args) => <LeadList leads={args.leads} grouped={args.grouped} compact={args.compact} when={whenOf} action={actionOf} />,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-part="row"]')).toHaveLength(REPORT.leads.length);
    await expect(canvasElement.querySelector('[data-part="action"][data-tone="go"]')).toBeTruthy();
    await expect(canvasElement.querySelector('[data-part="when-big"]')).toBeTruthy();
  },
};

export const Grouped: Story = {
  args: { grouped: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-part="group"]').length).toBeGreaterThan(0);
  },
};

/** For a sidebar: no details column, no action note. */
export const Compact: Story = {
  args: { compact: true },
  decorators: [(Story) => <div style={{ maxWidth: '36rem' }}>{Story()}</div>],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-col="details"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-part="action-note"]')).toBeNull();
  },
};

function OpenableList({ leads }: { leads: readonly Lead[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <Stack direction="column" gap={3}>
      <Text role="caption" tone="muted" data-testid="opened">
        {selected === null ? 'None open' : `Open: ${leads[selected]?.name}`}
      </Text>
      <LeadList
        leads={leads}
        filter={{ tier: 'A' }}
        when={whenOf}
        action={actionOf}
        trailing={(_, i) => (
          <Text role="caption" tone="muted" tabular>
            #{i + 1}
          </Text>
        )}
        onOpen={(_, i) => setSelected(i)}
        selected={selected}
      />
    </Stack>
  );
}

/** `onOpen` and `selected`: each name is a button (click, Enter or Space), a click on the row opens it too, and the open row is marked current. */
export const Openable: Story = {
  render: (args) => <OpenableList leads={args.leads} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('[data-part="row"]')];
    const [first, second, third] = rows;
    const nameOf = (row: HTMLElement) => row.querySelector('[data-part="name"]')!.textContent!;
    await expect(canvasElement.querySelector('[aria-current]')).toBeNull();
    await expect(first!.querySelector('[data-col="lead"] a')).toBeNull();
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
    // Space works too, and a click elsewhere on the row (the details) opens it.
    within(third!).getByRole('button').focus();
    await userEvent.keyboard(' ');
    await expect(c.getByTestId('opened').textContent).toBe(`Open: ${nameOf(third!)}`);
    await userEvent.click(first!.querySelector<HTMLElement>('[data-col="details"]')!);
    await expect(first!.getAttribute('aria-current')).toBe('true');
    await expect(canvasElement.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};

const RAIL_TONES: readonly (LeadAction | null)[] = [
  { label: 'Reach out', tone: 'go' },
  { label: 'Done', tone: 'done' },
  { label: 'Follow up soon', tone: 'soon' },
  { label: 'Overdue', tone: 'urgent' },
  null,
];

/** A sample next step cycling through every tone, and no action every fifth row. */
const railAction = (_: Lead, index: number) => RAIL_TONES[index % RAIL_TONES.length] ?? null;

function RailList({ leads, grouped }: { leads: readonly Lead[]; grouped: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <Stack direction="column" gap={3}>
      <Text role="caption" tone="muted" data-testid="opened">
        {selected === null ? 'None open' : `Open: ${leads[selected]?.name}`}
      </Text>
      <LeadList
        variant="rail"
        leads={leads}
        grouped={grouped}
        when={whenOf}
        action={railAction}
        trailing={(_, i) => (i % 3 === 0 ? `#${i + 1}` : null)}
        onOpen={(_, i) => setSelected(i)}
        selected={selected}
      />
    </Stack>
  );
}

/** `variant="rail"`: a narrow column for a sidebar beside a map. A tone bar, the date block as a rail, the lead stacked. */
export const Rail: Story = {
  render: (args) => <RailList leads={args.leads} grouped={args.grouped} />,
  argTypes: { compact: { table: { disable: true } } },
  decorators: [(Story) => <div style={{ width: '24rem', maxWidth: '100%' }}>{Story()}</div>],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(canvasElement.querySelector('[data-part="root"]')!.getAttribute('data-variant')).toBe('rail');
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('[data-part="row"]')];
    await expect(rows).toHaveLength(REPORT.leads.length);
    for (const tone of ['go', 'done', 'soon', 'urgent'])
      await expect(canvasElement.querySelector(`[data-part="tone"][data-tone="${tone}"]`)).toBeTruthy();
    await expect(rows.every((row) => row.querySelector('[data-part="tone"]'))).toBe(true);
    await expect(canvasElement.querySelector('[data-col="details"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-part="action-note"]')).toBeNull();
    const [first, second] = rows;
    const nameOf = (row: HTMLElement) => row.querySelector('[data-part="name"]')!.textContent!;
    // A click on the name opens it and marks the row current.
    await userEvent.click(within(first!).getByRole('button', { name: nameOf(first!) }));
    await expect(c.getByTestId('opened').textContent).toBe(`Open: ${nameOf(first!)}`);
    await expect(first!.getAttribute('aria-current')).toBe('true');
    await expect(first!.hasAttribute('data-selected')).toBe(true);
    // A click elsewhere on the next row (its date rail) moves the selection.
    await userEvent.click(second!.querySelector<HTMLElement>('[data-col="when"]')!);
    await expect(c.getByTestId('opened').textContent).toBe(`Open: ${nameOf(second!)}`);
    await expect(first!.hasAttribute('aria-current')).toBe(false);
    await expect(canvasElement.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};
