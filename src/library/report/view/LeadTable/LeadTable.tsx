import type { ReactNode } from 'react';
import { Surface } from '../../../primitives/Surface';
import { Text, type TextTone } from '../../../primitives/Text';
import { TIERS, filterLeads, safeHref, type Channel, type Lead, type LeadFilter, type Tier } from '../../model/report';
import { TIER_HUE } from '../hues';
import './LeadTable.css';

export interface LeadTableProps {
  leads: readonly Lead[];
  /** Narrows the rows (`filterLeads`): a tier, a channel, or only the leads ready to contact. */
  filter?: LeadFilter;
  /** What stands in for the table when no lead passes the filter. Default `No leads match.` */
  empty?: ReactNode;
  /** The table's accessible name. Default `Leads`. */
  label?: string;
  className?: string;
}

/** A small label in a pill outline: a tier or a channel. A use of Surface and Text, not a control. */
function Tag({ tone, children }: { tone: TextTone; children: ReactNode }) {
  return (
    <Surface as="span" radius="pill" border className="lib-report-tag" data-part="tag">
      <Text role="label" size="caption" tone={tone} leading="snug">
        {children}
      </Text>
    </Surface>
  );
}

const CHANNEL_TONE: Record<Channel, TextTone> = { email: 'primary', form: 'primary', invite: 'secondary', agency: 'secondary', unknown: 'faint' };

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

function Row({ lead }: { lead: Lead }) {
  const href = safeHref(lead.url);
  return (
    <tr className="lib-report-leads__row" data-part="row" data-tier={lead.tier} {...(lead.skip ? { 'data-skip': '' } : {})}>
      <th scope="row" className="lib-report-leads__cell" data-col="name">
        {href ? (
          <Text as="a" href={href} role="body" weight="strong" tone="primary" className="lib-report-leads__link" data-part="name">
            {lead.name}
          </Text>
        ) : (
          <Text role="body" weight="strong" tone="primary" data-part="name">
            {lead.name}
          </Text>
        )}
      </th>
      <td className="lib-report-leads__cell" data-col="location">
        <Text role="body" tone="secondary">
          {lead.location}
        </Text>
      </td>
      <td className="lib-report-leads__cell" data-col="when">
        {lead.when ? (
          <Text role="caption" tone="muted">
            {lead.when}
          </Text>
        ) : null}
      </td>
      <td className="lib-report-leads__cell" data-col="channel">
        <Tag tone={CHANNEL_TONE[lead.channel]}>{lead.channel}</Tag>
      </td>
      <td className="lib-report-leads__cell" data-col="angle">
        {lead.skip ? (
          <Text role="caption" tone="faint" data-part="skip">
            Skip: {lead.skip}
          </Text>
        ) : lead.angle ? (
          <Text role="body" tone="secondary" data-part="angle">
            {lead.angle}
          </Text>
        ) : null}
      </td>
      <td className="lib-report-leads__cell" data-col="contact">
        {lead.contact ? (
          mailable(lead.contact) ? (
            <Text as="a" href={`mailto:${lead.contact}`} role="caption" tone="secondary" className="lib-report-leads__link lib-report-leads__contact">
              <Address text={lead.contact} />
            </Text>
          ) : (
            <Text role="caption" tone="secondary" className="lib-report-leads__contact">
              {lead.contact}
            </Text>
          )
        ) : null}
      </td>
    </tr>
  );
}

const COLUMNS = [
  ['name', 'Name'],
  ['location', 'Location'],
  ['when', 'When'],
  ['channel', 'Channel'],
  ['angle', 'Angle'],
  ['contact', 'Contact'],
] as const;

/**
 * **Job.** The leads, to scan: one table grouped by tier (strongest first, each group headed by its
 * tier label and count), with columns name, location, when, channel, angle and contact. A lead with
 * a `url` links its name; a contact that is an address is a mail link; a lead marked `skip` shows
 * its reason, quiet, in place of the angle. Tier and channel are small outlined labels (`Tag`, a
 * Surface with a Text, not a control); a tier takes hue slot 1–3.
 *
 * **Behaviour.** `filter` narrows the rows (`filterLeads`); a tier with no rows left is dropped,
 * and with none at all `empty` stands in for the table. The table fills its container; under
 * 40rem of container width each row stacks into a block (name and channel, then location and
 * when, then the angle and the contact) and the column heads are kept for assistive tech only.
 *
 * **Parts** (`data-part`). `root`; `group` each tier's `tbody`; `group-head` its heading row;
 * `row` each lead (`data-tier`, `data-skip`); `name`, `angle`, `skip`; `tag` a tier or channel
 * label; `empty`. Cells carry `data-col`.
 */
export function LeadTable({ leads, filter, empty = 'No leads match.', label = 'Leads', className }: LeadTableProps) {
  const shown = filterLeads(leads, filter);
  const groups = TIERS.map((tier) => [tier, shown.filter((l) => l.tier === tier)] as [Tier, Lead[]]).filter(([, ls]) => ls.length > 0);
  return (
    <div className={`lib-report-leads${className ? ` ${className}` : ''}`} data-part="root">
      {shown.length === 0 ? (
        <Text as="p" role="body" tone="muted" className="lib-report-leads__empty" data-part="empty">
          {empty}
        </Text>
      ) : (
        <table className="lib-report-leads__table" aria-label={label}>
          <thead className="lib-report-leads__head">
            <tr>
              {COLUMNS.map(([col, title]) => (
                <th key={col} scope="col" className="lib-report-leads__cell" data-col={col}>
                  <Text role="label" tone="muted">
                    {title}
                  </Text>
                </th>
              ))}
            </tr>
          </thead>
          {groups.map(([tier, rows]) => (
            <tbody key={tier} className="lib-report-leads__group" data-part="group" data-tier={tier}>
              <tr className="lib-report-leads__group-head" data-part="group-head">
                <th scope="rowgroup" colSpan={COLUMNS.length} className="lib-report-leads__cell">
                  <span className="lib-report-leads__group-title">
                    <Tag tone={TIER_HUE[tier]}>Tier {tier}</Tag>
                    <Text role="caption" tone="muted" tabular>
                      {rows.length} {rows.length === 1 ? 'lead' : 'leads'}
                    </Text>
                  </span>
                </th>
              </tr>
              {rows.map((lead, i) => (
                <Row key={`${i} ${lead.name}`} lead={lead} />
              ))}
            </tbody>
          ))}
        </table>
      )}
    </div>
  );
}
