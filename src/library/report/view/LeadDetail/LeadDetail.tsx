import type { ReactNode } from 'react';
import { Button } from '../../../components/core/Button/Button';
import { Stack } from '../../../primitives/Stack';
import { Text } from '../../../primitives/Text';
import { safeContactHref, safeHref, type Lead, type Source } from '../../model/report';
import { CHANNEL_TONE, Tag } from '../LeadTable/LeadTable';
import { Sources } from '../Sources/Sources';
import './LeadDetail.css';

/** One line of a lead's research: a label and its value, as written. A value with an `href` (`http`, `https` or `mailto`) is a link. */
export interface DetailField {
  label: string;
  value: string;
  href?: string | null;
}

export interface LeadDetailProps {
  /** The opened lead: its header (name, linked to its `url`; location, when; channel). */
  lead: Lead;
  /** The research to show, in order. Blank values are the app's to drop: every field given is shown. */
  fields: readonly DetailField[];
  /** Where the facts came from, as a footnote list under the fields. */
  sources?: readonly Source[] | null;
  /** A line the app places above the fields. */
  note?: ReactNode;
  /** Anything the app adds at the end. */
  children?: ReactNode;
  /** When set, a close button calls it. */
  onClose?: () => void;
  /** The close button's label. Default `Close`. */
  closeLabel?: string;
  /** The region's accessible name. Default the lead's name. */
  label?: string;
  className?: string;
}

/**
 * **Job.** One opened lead, to read: a header with its name (a link to its `url`), location, when
 * and channel label as in the lead table, then the app's `note`, the research `fields` as a
 * definition list (label over value, line breaks kept), the `sources` as footnotes and the app's
 * `children` last. It knows a lead and labelled fields, never what they mean.
 *
 * **Behaviour.** A field's `href` makes its value a link (`safeContactHref`: `http`, `https` or
 * `mailto`; anything else stays text). With `onClose`, a close button sits in the header.
 *
 * **Parts** (`data-part`). `root` the region; `header`; `name`; `meta` location and when; `tag`
 * the channel; `close`; `note`; `fields` the list; `field` each pair; `value`; `sources`; `extra`
 * the app's children.
 */
export function LeadDetail({ lead, fields, sources, note, children, onClose, closeLabel = 'Close', label, className }: LeadDetailProps) {
  const href = safeHref(lead.url);
  const meta = [lead.location, lead.when].filter(Boolean).join(' · ');
  return (
    <Stack as="section" direction="column" gap={5} className={`lib-report-detail${className ? ` ${className}` : ''}`} aria-label={label ?? lead.name} data-part="root">
      <div className="lib-report-detail__header" data-part="header">
        <Stack direction="column" gap={1} className="lib-report-detail__title">
          {href ? (
            <Text as="h2" role="heading" tone="primary" data-part="name">
              <Text as="a" href={href} role="heading" size="inherit" tone="primary" className="lib-report-detail__link">
                {lead.name}
              </Text>
            </Text>
          ) : (
            <Text as="h2" role="heading" tone="primary" data-part="name">
              {lead.name}
            </Text>
          )}
          <Stack direction="row" gap={2} wrap align="center">
            {meta ? (
              <Text role="body" tone="secondary" data-part="meta">
                {meta}
              </Text>
            ) : null}
            <Tag tone={CHANNEL_TONE[lead.channel]}>{lead.channel}</Tag>
          </Stack>
        </Stack>
        {onClose ? (
          <span className="lib-report-detail__close" data-part="close">
            <Button label={closeLabel} variant="quiet" compact onPress={onClose} />
          </span>
        ) : null}
      </div>
      {note ? (
        <Text as="div" role="body" tone="secondary" className="lib-report-detail__note" data-part="note">
          {note}
        </Text>
      ) : null}
      {fields.length > 0 ? (
        <dl className="lib-report-detail__fields" data-part="fields">
          {fields.map((f, i) => {
            const link = safeContactHref(f.href);
            return (
              <div key={`${i} ${f.label}`} className="lib-report-detail__field" data-part="field">
                <Text as="dt" role="label" tone="muted">
                  {f.label}
                </Text>
                <Text as="dd" role="body" tone="primary" className="lib-report-detail__value" data-part="value">
                  {link ? (
                    <Text as="a" href={link} role="body" size="inherit" tone="primary" className="lib-report-detail__link">
                      {f.value}
                    </Text>
                  ) : (
                    f.value
                  )}
                </Text>
              </div>
            );
          })}
        </dl>
      ) : null}
      {sources && sources.length > 0 ? (
        <Stack direction="column" gap={2} data-part="sources">
          <Text as="h3" role="label" tone="muted">
            Sources
          </Text>
          <Sources sources={sources} />
        </Stack>
      ) : null}
      {children ? <div data-part="extra">{children}</div> : null}
    </Stack>
  );
}
