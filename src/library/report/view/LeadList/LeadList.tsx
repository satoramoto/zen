import { useId, type MouseEvent, type ReactNode } from 'react';
import { Icon } from '../../../primitives/Icon';
import { Text, type TextTone } from '../../../primitives/Text';
import { TIERS, filterLeads, safeHref, type Lead, type LeadFilter, type Tier } from '../../model/report';
import { TIER_HUE } from '../hues';
import { Tag } from '../LeadTable/LeadTable';
import './LeadList.css';

/** What an action asks: `go` do something now, `done` nothing left, `soon` coming up, `urgent` overdue or pressing. */
export type LeadActionTone = 'go' | 'done' | 'soon' | 'urgent';

/** A lead's next step, in the app's words: a label in a tone, an optional note under it and an optional icon (a default glyph per tone otherwise). */
export interface LeadAction {
  label: string;
  tone: LeadActionTone;
  note?: string | null;
  icon?: ReactNode;
}

/** A date block: a small line on top, a large numeral line, a muted caption under. Blank lines are left out. */
export interface WhenBlock {
  top: string;
  big: string;
  foot?: string | null;
}

export interface LeadListProps {
  leads: readonly Lead[];
  /** Narrows the rows (`filterLeads`). */
  filter?: LeadFilter;
  /** What stands in for the list when no lead passes the filter. Default `No leads match.` */
  empty?: ReactNode;
  /** The list's accessible name. Default `Leads`. */
  label?: string;
  /** Each lead's next step (the first column); `null` leaves the column empty. `index` is the lead's index in `leads`. */
  action?: (lead: Lead, index: number) => LeadAction | null;
  /** Each lead's date block (the second column). Default: `lead.when` as the top line, nothing else (the app passes a parser). */
  when?: (lead: Lead, index: number) => WhenBlock | null;
  /** Each lead's details (muted caption text, up to three lines). Default: the angle, or the skip reason, quiet. */
  details?: (lead: Lead, index: number) => ReactNode;
  /** Anything the app adds at the end of each row (counts, say). */
  trailing?: (lead: Lead, index: number) => ReactNode;
  /** When set, every row opens: the name becomes a button (Enter or Space), a click anywhere on the row
   *  but another control opens it too, and the name no longer links to the lead's `url`. */
  onOpen?: (lead: Lead, index: number) => void;
  /** The index in `leads` of the open lead: its row carries `aria-current` and `data-selected`. */
  selected?: number | null;
  /** Group the rows by tier under LeadTable's group heading. Default `false`. */
  grouped?: boolean;
  /** Drop the details column and the action note: for a sidebar. Default `false`. */
  compact?: boolean;
  className?: string;
}

/** Each action tone's ink. */
const ACTION_TONE: Record<LeadActionTone, TextTone> = { go: 'success', done: 'muted', soon: 'warning', urgent: 'danger' };

/** Each action tone's default glyph (24-unit strokes): an arrow, a check, a clock, an exclamation mark. */
const GLYPH: Record<LeadActionTone, ReactNode> = {
  go: <path d="M5 12h14M13 6l6 6-6 6" />,
  done: <path d="M5 12.5l4.5 4.5L19 7" />,
  soon: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2" />
    </>
  ),
  urgent: <path d="M12 5v9M12 19v.01" />,
};

const defaultWhen = (lead: Lead): WhenBlock => ({ top: lead.when ?? '', big: '' });

function defaultDetails(lead: Lead): ReactNode {
  if (lead.skip)
    return (
      <Text tone="faint" data-part="skip">
        Skip: {lead.skip}
      </Text>
    );
  return lead.angle ? <span data-part="angle">{lead.angle}</span> : null;
}

function Action({ action, compact }: { action: LeadAction; compact: boolean }) {
  const tone = ACTION_TONE[action.tone];
  return (
    <>
      <span className="lib-report-list__chip" data-part="action" data-tone={action.tone} title={action.label}>
        {action.icon ?? (
          <Icon size="label" tone={tone}>
            {GLYPH[action.tone]}
          </Icon>
        )}
        <Text role="label" tone={tone} leading="snug" truncate>
          {action.label}
        </Text>
      </span>
      {!compact && action.note ? (
        <Text role="caption" tone="muted" truncate data-part="action-note">
          {action.note}
        </Text>
      ) : null}
    </>
  );
}

function When({ block }: { block: WhenBlock }) {
  return (
    <>
      {block.top ? (
        <Text role="label" tone="muted" leading="snug" data-part="when-top">
          {block.top}
        </Text>
      ) : null}
      {block.big ? (
        <Text role="numeral" size="heading" tone="primary" leading="tight" data-part="when-big">
          {block.big}
        </Text>
      ) : null}
      {block.foot ? (
        <Text role="caption" tone="muted" leading="snug" data-part="when-foot">
          {block.foot}
        </Text>
      ) : null}
    </>
  );
}

function Name({ lead, open }: { lead: Lead; open: boolean }) {
  if (open)
    return (
      <Text as="button" type="button" role="body" weight="strong" tone="primary" className="lib-report-list__open" data-part="name">
        {lead.name}
      </Text>
    );
  const href = safeHref(lead.url);
  return href ? (
    <Text as="a" href={href} role="body" weight="strong" tone="primary" className="lib-report-list__link" data-part="name">
      {lead.name}
    </Text>
  ) : (
    <Text role="body" weight="strong" tone="primary" data-part="name">
      {lead.name}
    </Text>
  );
}

interface RowProps extends Pick<LeadListProps, 'action' | 'when' | 'details' | 'trailing' | 'onOpen'> {
  lead: Lead;
  index: number;
  selected: boolean;
  compact: boolean;
}

function Row({ lead, index, action, when = defaultWhen, details, trailing, onOpen, selected, compact }: RowProps) {
  // The name button's click (a press, Enter or Space) bubbles here, so the row is the one handler. A click
  // on any other control in the row (a link, or whatever the app put in a column) is that control's own.
  const open = onOpen
    ? (e: MouseEvent<HTMLLIElement>) => {
        const control = (e.target as Element).closest('a, button, input, select, textarea, label, [role="button"]');
        if (!control || control.classList.contains('lib-report-list__open')) onOpen(lead, index);
      }
    : undefined;
  const act = action?.(lead, index) ?? null;
  const date = when(lead, index);
  const more = trailing?.(lead, index);
  return (
    <li
      className="lib-report-list__row"
      data-part="row"
      data-tier={lead.tier}
      {...(lead.skip ? { 'data-skip': '' } : {})}
      {...(onOpen ? { 'data-openable': '' } : {})}
      {...(selected ? { 'data-selected': '', 'aria-current': 'true' as const } : {})}
      onClick={open}
    >
      <div className="lib-report-list__action" data-col="action">
        {act ? <Action action={act} compact={compact} /> : null}
      </div>
      <div className="lib-report-list__when" data-col="when">
        {date ? <When block={date} /> : null}
      </div>
      <div className="lib-report-list__lead" data-col="lead">
        <Name lead={lead} open={!!onOpen} />
        <Text role="caption" tone="secondary" data-part="location">
          {lead.location}
        </Text>
      </div>
      {compact ? null : (
        <Text as="div" role="caption" tone="muted" className="lib-report-list__details" data-col="details">
          {details ? details(lead, index) : defaultDetails(lead)}
        </Text>
      )}
      {trailing ? (
        <div className="lib-report-list__trailing" data-col="trailing">
          {more}
        </div>
      ) : null}
    </li>
  );
}

type Shown = { lead: Lead; index: number };

function Group({ tier, rows, render }: { tier: Tier; rows: Shown[]; render: (row: Shown) => ReactNode }) {
  const id = useId();
  return (
    <section className="lib-report-list__group" data-part="group" data-tier={tier}>
      <div className="lib-report-list__group-head" data-part="group-head" id={id}>
        <Tag tone={TIER_HUE[tier]}>Tier {tier}</Tag>
        <Text role="caption" tone="muted" tabular>
          {rows.length} {rows.length === 1 ? 'lead' : 'leads'}
        </Text>
      </div>
      <ul className="lib-report-list__rows" aria-labelledby={id}>
        {rows.map(render)}
      </ul>
    </section>
  );
}

/**
 * **Job.** The leads as rows built for a hierarchy of importance, an alternative to `LeadTable`:
 * what to do (`action`: a coloured icon and label, the tone's colour carrying go, done, soon or
 * urgent, with an optional note), when (`when`: a date block, a small line, a large numeral, a
 * caption), the lead (its name, its location under it), the details (`details`, muted, up to three
 * lines; the angle or the skip reason by default) and anything the app adds (`trailing`). Every
 * word comes from the lead or the app's functions.
 *
 * **Behaviour.** `filter` narrows the rows (`filterLeads`); with none left `empty` stands in. One
 * list in input order, or with `grouped` one per tier under LeadTable's group heading (a tier with
 * no rows is dropped). With `onOpen` each row opens a lead: its name is a button (Enter or Space)
 * and a click anywhere on the row but another control opens it too; the lead at `selected` (its
 * index in `leads`) is marked current. `compact` drops the details column and the action note.
 * The first columns are fixed widths, so rows align without a table; under 40rem of container
 * width each row stacks (action and when, then the lead, then the details).
 *
 * **Tuning knobs.** `--lib-leadlist-action-w` (9rem), `--lib-leadlist-when-w` (5.25rem),
 * `--lib-leadlist-details-w` (14rem), `--lib-leadlist-trailing-w` (`auto`).
 *
 * **Parts** (`data-part`). `root`; `group` and `group-head` when grouped; `row` each lead
 * (`data-tier`, `data-skip`, `data-openable`, `data-selected`); `action` (`data-tone`),
 * `action-note`, `when-top`, `when-big`, `when-foot`, `name`, `location`, `angle`, `skip`; `empty`.
 * Each column carries `data-col` (`action`, `when`, `lead`, `details`, `trailing`).
 */
export function LeadList({
  leads,
  filter,
  empty = 'No leads match.',
  label = 'Leads',
  action,
  when,
  details,
  trailing,
  onOpen,
  selected,
  grouped = false,
  compact = false,
  className,
}: LeadListProps) {
  const kept = new Set(filterLeads(leads, filter));
  const shown: Shown[] = leads.map((lead, index) => ({ lead, index })).filter(({ lead }) => kept.has(lead));
  const render = ({ lead, index }: Shown) => (
    <Row
      key={`${index} ${lead.name}`}
      lead={lead}
      index={index}
      action={action}
      when={when}
      details={details}
      trailing={trailing}
      onOpen={onOpen}
      selected={selected === index}
      compact={compact}
    />
  );
  return (
    <div
      className={`lib-report-list${className ? ` ${className}` : ''}`}
      data-part="root"
      {...(onOpen ? { 'data-openable': '' } : {})}
      {...(compact ? { 'data-compact': '' } : {})}
    >
      {shown.length === 0 ? (
        <Text as="p" role="body" tone="muted" data-part="empty">
          {empty}
        </Text>
      ) : grouped ? (
        <div role="group" aria-label={label}>
          {TIERS.map((tier) => [tier, shown.filter(({ lead }) => lead.tier === tier)] as const)
            .filter(([, rows]) => rows.length > 0)
            .map(([tier, rows]) => (
              <Group key={tier} tier={tier} rows={rows} render={render} />
            ))}
        </div>
      ) : (
        <ul className="lib-report-list__rows" aria-label={label}>
          {shown.map(render)}
        </ul>
      )}
    </div>
  );
}
