import type { MouseEvent, ReactNode } from 'react';
import { Surface } from '../../../primitives/Surface';
import { Text, type TextTone } from '../../../primitives/Text';
import { TIERS, filterLeads, safeHref, type Channel, type Lead, type LeadFilter, type Tier } from '../../model/report';
import { TIER_HUE } from '../hues';
import './LeadTable.css';

/** A built-in column of the lead table: one field of the lead (`angle` shows the skip reason in its place). */
export type LeadColumn = 'name' | 'location' | 'when' | 'channel' | 'window' | 'angle' | 'contact' | 'comparable' | 'fee' | 'travel';

export interface LeadTableProps {
  leads: readonly Lead[];
  /** Narrows the rows (`filterLeads`): a tier, a channel, or only the leads ready to contact. */
  filter?: LeadFilter;
  /** What stands in for the table when no lead passes the filter. Default `No leads match.` */
  empty?: ReactNode;
  /** The table's accessible name. Default `Leads`. */
  label?: string;
  /** Which columns show, in order. Default `name, location, when, channel, angle, contact`. */
  columns?: readonly LeadColumn[];
  /** One trailing column the app fills (counts, a status): its head and each row's cell. `index` is the lead's index in `leads`. */
  extra?: { title: string; render: (lead: Lead, index: number) => ReactNode };
  /** When set, every row opens: the name becomes a button (Enter or Space), a click anywhere on the row
   *  but a link opens it too, and the name no longer links to the lead's `url`. `index` is the lead's index in `leads`. */
  onOpen?: (lead: Lead, index: number) => void;
  /** The index in `leads` of the open lead: its row carries `aria-current` and `data-selected`. */
  selected?: number | null;
  className?: string;
}

/** A small label in a pill outline: a tier or a channel. A use of Surface and Text, not a control. */
export function Tag({ tone, children }: { tone: TextTone; children: ReactNode }) {
  return (
    <Surface as="span" radius="pill" border className="lib-report-tag" data-part="tag">
      <Text role="label" size="caption" tone={tone} leading="snug">
        {children}
      </Text>
    </Surface>
  );
}

/** Each channel's ink: the direct ones primary, the indirect ones secondary, the unknown faint. */
export const CHANNEL_TONE: Record<Channel, TextTone> = { email: 'primary', form: 'primary', invite: 'secondary', agency: 'secondary', unknown: 'faint' };

/** An address with no spaces and an `@` is mailed; anything else is shown as written. */
const mailable = (contact: string) => /^[^\s@?&#%]+@[^\s@?&#%]+$/.test(contact);

/** An address that may break after its `@` (and nowhere else unless it must). */
function Address({ text }: { text: string }) {
  const at = text.indexOf('@');
  return at < 0 ? (
    <>{text}</>
  ) : (
    <>
      {text.slice(0, at + 1)}
      <wbr />
      {text.slice(at + 1)}
    </>
  );
}

/** A short field as found (a date, a window, a size), quiet; nothing when absent. */
const Quiet = ({ text }: { text: string | null | undefined }) =>
  text ? (
    <Text role="caption" tone="muted">
      {text}
    </Text>
  ) : null;

function NameCell({ lead, open }: { lead: Lead; open: boolean }) {
  if (open)
    return (
      <Text as="button" type="button" role="body" weight="strong" tone="primary" className="lib-report-leads__open" data-part="name">
        {lead.name}
      </Text>
    );
  const href = safeHref(lead.url);
  return href ? (
    <Text as="a" href={href} role="body" weight="strong" tone="primary" className="lib-report-leads__link" data-part="name">
      {lead.name}
    </Text>
  ) : (
    <Text role="body" weight="strong" tone="primary" data-part="name">
      {lead.name}
    </Text>
  );
}

function cellOf(col: LeadColumn, lead: Lead, open: boolean): ReactNode {
  switch (col) {
    case 'name':
      return <NameCell lead={lead} open={open} />;
    case 'location':
      return (
        <Text role="body" tone="secondary">
          {lead.location}
        </Text>
      );
    case 'channel':
      return <Tag tone={CHANNEL_TONE[lead.channel]}>{lead.channel}</Tag>;
    case 'angle':
      return lead.skip ? (
        <Text role="caption" tone="faint" data-part="skip">
          Skip: {lead.skip}
        </Text>
      ) : lead.angle ? (
        <Text role="body" tone="secondary" data-part="angle">
          {lead.angle}
        </Text>
      ) : null;
    case 'contact':
      return lead.contact ? (
        mailable(lead.contact) ? (
          <Text as="a" href={`mailto:${lead.contact}`} role="caption" tone="secondary" className="lib-report-leads__link lib-report-leads__contact">
            <Address text={lead.contact} />
          </Text>
        ) : (
          <Text role="caption" tone="secondary" className="lib-report-leads__contact">
            {lead.contact}
          </Text>
        )
      ) : null;
    default:
      return <Quiet text={lead[col]} />;
  }
}

interface RowProps extends Pick<LeadTableProps, 'extra' | 'onOpen'> {
  lead: Lead;
  index: number;
  columns: readonly LeadColumn[];
  selected: boolean;
}

function Row({ lead, index, columns, extra, onOpen, selected }: RowProps) {
  // The name button's click (from a press, Enter or Space) bubbles here, so the row is the one handler.
  // A click on any other control in the row (a link, or whatever the app put in the extra column) is that
  // control's own and does not open the lead.
  const open = onOpen
    ? (e: MouseEvent<HTMLTableRowElement>) => {
        const control = (e.target as Element).closest('a, button, input, select, textarea, label, [role="button"]');
        if (!control || control.classList.contains('lib-report-leads__open')) onOpen(lead, index);
      }
    : undefined;
  return (
    <tr
      className="lib-report-leads__row"
      data-part="row"
      data-tier={lead.tier}
      {...(lead.skip ? { 'data-skip': '' } : {})}
      {...(onOpen ? { 'data-openable': '' } : {})}
      {...(selected ? { 'data-selected': '', 'aria-current': 'true' as const } : {})}
      onClick={open}
    >
      {columns.map((col) =>
        col === 'name' ? (
          <th key={col} scope="row" className="lib-report-leads__cell" data-col={col}>
            {cellOf(col, lead, !!onOpen)}
          </th>
        ) : (
          <td key={col} className="lib-report-leads__cell" data-col={col}>
            {cellOf(col, lead, !!onOpen)}
          </td>
        ),
      )}
      {extra ? (
        <td className="lib-report-leads__cell" data-col="extra">
          {extra.render(lead, index)}
        </td>
      ) : null}
    </tr>
  );
}

const TITLES: Record<LeadColumn, string> = {
  name: 'Name',
  location: 'Location',
  when: 'When',
  channel: 'Channel',
  window: 'Window',
  angle: 'Angle',
  contact: 'Contact',
  comparable: 'Comparable',
  fee: 'Fee',
  travel: 'Travel',
};

const DEFAULT_COLUMNS: readonly LeadColumn[] = ['name', 'location', 'when', 'channel', 'angle', 'contact'];

/**
 * **Job.** The leads, to scan: one table grouped by tier (strongest first, each group headed by its
 * tier label and count), with columns name, location, when, channel, angle and contact by default
 * (`columns` picks others from the built-in set, and `extra` adds one the app fills). A lead with
 * a `url` links its name; a contact that is an address is a mail link; a lead marked `skip` shows
 * its reason, quiet, in place of the angle. Tier and channel are small outlined labels (`Tag`, a
 * Surface with a Text, not a control); a tier takes hue slot 1–3.
 *
 * **Behaviour.** `filter` narrows the rows (`filterLeads`); a tier with no rows left is dropped,
 * and with none at all `empty` stands in for the table. With `onOpen` each row opens a lead: its
 * name is a button (Enter or Space) and a click on the row opens it too; the lead at `selected`
 * is marked current. The table fills its container; under 40rem of container width each row
 * stacks into a block (name and channel, then each other column in order) and the column heads
 * are kept for assistive tech only.
 *
 * **Parts** (`data-part`). `root`; `group` each tier's `tbody`; `group-head` its heading row;
 * `row` each lead (`data-tier`, `data-skip`, `data-openable`, `data-selected`); `name`, `angle`,
 * `skip`; `tag` a tier or channel label; `empty`. Cells carry `data-col` (`extra` for the app's).
 */
export function LeadTable({ leads, filter, empty = 'No leads match.', label = 'Leads', columns = DEFAULT_COLUMNS, extra, onOpen, selected, className }: LeadTableProps) {
  const kept = new Set(filterLeads(leads, filter));
  const shown = leads.map((lead, index) => ({ lead, index })).filter(({ lead }) => kept.has(lead));
  const groups = TIERS.map((tier) => [tier, shown.filter(({ lead }) => lead.tier === tier)] as const).filter(([, rows]) => rows.length > 0);
  const span = columns.length + (extra ? 1 : 0);
  return (
    <div className={`lib-report-leads${className ? ` ${className}` : ''}`} data-part="root" {...(onOpen ? { 'data-openable': '' } : {})}>
      {shown.length === 0 ? (
        <Text as="p" role="body" tone="muted" className="lib-report-leads__empty" data-part="empty">
          {empty}
        </Text>
      ) : (
        <table className="lib-report-leads__table" aria-label={label}>
          <thead className="lib-report-leads__head">
            <tr>
              {columns.map((col) => (
                <th key={col} scope="col" className="lib-report-leads__cell" data-col={col}>
                  <Text role="label" tone="muted">
                    {TITLES[col]}
                  </Text>
                </th>
              ))}
              {extra ? (
                <th scope="col" className="lib-report-leads__cell" data-col="extra">
                  <Text role="label" tone="muted">
                    {extra.title}
                  </Text>
                </th>
              ) : null}
            </tr>
          </thead>
          {groups.map(([tier, rows]: readonly [Tier, { lead: Lead; index: number }[]]) => (
            <tbody key={tier} className="lib-report-leads__group" data-part="group" data-tier={tier}>
              <tr className="lib-report-leads__group-head" data-part="group-head">
                <th scope="rowgroup" colSpan={span} className="lib-report-leads__cell">
                  <span className="lib-report-leads__group-title">
                    <Tag tone={TIER_HUE[tier]}>Tier {tier}</Tag>
                    <Text role="caption" tone="muted" tabular>
                      {rows.length} {rows.length === 1 ? 'lead' : 'leads'}
                    </Text>
                  </span>
                </th>
              </tr>
              {rows.map(({ lead, index }) => (
                <Row key={`${index} ${lead.name}`} lead={lead} index={index} columns={columns} extra={extra} onOpen={onOpen} selected={selected === index} />
              ))}
            </tbody>
          ))}
        </table>
      )}
    </div>
  );
}
