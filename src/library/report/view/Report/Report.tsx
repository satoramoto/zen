import { useId, type ReactNode } from 'react';
import { Stack } from '../../../primitives/Stack';
import { Text } from '../../../primitives/Text';
import { formatReportDate, type LeadFilter, type Report as ReportData } from '../../model/report';
import { Brief } from '../Brief/Brief';
import { Findings } from '../Findings/Findings';
import { LeadTable } from '../LeadTable/LeadTable';
import { Segments } from '../Segments/Segments';
import { Sources } from '../Sources/Sources';
import { Summary } from '../Summary/Summary';
import './Report.css';

/** How wide the prose runs: about 60, 70 or 80 characters a line. */
export type ReportMeasure = 'narrow' | 'normal' | 'wide';

export interface ReportProps {
  report: ReportData;
  /** The prose's line length. Default `normal`. The lead table always takes the full width. */
  measure?: ReportMeasure;
  /** Narrows the lead table (`LeadTable`'s `filter`). */
  filter?: LeadFilter;
  /** Formats the ISO `date` for the masthead. Default: `19 October 2026`, read as a calendar date (no time zone). */
  formatDate?: (iso: string) => string;
  className?: string;
}

function Section({ id, title, wide, children }: { id: string; title: string; wide?: boolean; children: ReactNode }) {
  const headingId = `${useId()}-${id}`;
  return (
    <section className="lib-report__section" data-part="section" data-section={id} {...(wide ? { 'data-wide': '' } : {})} aria-labelledby={headingId}>
      <Stack direction="column" gap={4}>
        <Text role="heading" as="h2" tone="primary" id={headingId} className="lib-report__section-title">
          {title}
        </Text>
        {children}
      </Stack>
    </section>
  );
}

/**
 * **Job.** A market research report as one document, read top to bottom then scanned: the
 * masthead (date, title, subtitle), then `Brief`, `Summary`, `Segments`, `Findings`, the
 * `LeadTable` and `Sources`, each under its own heading. Parts the data leaves out (`segments`,
 * `sources`, an empty list) are left out.
 *
 * **Behaviour.** Prose holds a reading measure (`measure`: about 60, 70 or 80 characters); the lead
 * table takes the document's full width. It knows nothing about any one market: every word but
 * the section headings comes from the data.
 *
 * **Parts** (`data-part`). `root` the `article`; `masthead`; `section` each part (`data-section`
 * names it: `brief`, `summary`, `segments`, `findings`, `leads`, `sources`; `data-wide` on the leads).
 *
 * **Tuning knobs.** `--lib-report-measure` (the prose's line length, set from `measure`).
 */
export function Report({ report, measure = 'normal', filter, formatDate = formatReportDate, className }: ReportProps) {
  const segments = report.segments ?? [];
  const sources = report.sources ?? [];
  return (
    <article className={`lib-report${className ? ` ${className}` : ''}`} data-measure={measure} data-part="root">
      <Stack direction="column" gap={6}>
        <Stack as="header" direction="column" gap={2} className="lib-report__masthead" data-part="masthead">
          <Text as="time" role="label" tone="muted" dateTime={report.date}>
            {formatDate(report.date)}
          </Text>
          <Text as="h1" role="display" tone="primary">
            {report.title}
          </Text>
          {report.subtitle && (
            <Text as="p" role="heading" weight="body" tone="secondary">
              {report.subtitle}
            </Text>
          )}
        </Stack>
        <Section id="brief" title="Brief">
          <Brief brief={report.brief} />
        </Section>
        {report.summary.length > 0 && (
          <Section id="summary" title="Summary" wide>
            <Summary stats={report.summary} />
          </Section>
        )}
        {segments.length > 0 && (
          <Section id="segments" title="Segments">
            <Segments segments={segments} />
          </Section>
        )}
        {report.findings.length > 0 && (
          <Section id="findings" title="Findings">
            <Findings findings={report.findings} />
          </Section>
        )}
        <Section id="leads" title="Leads" wide>
          <LeadTable leads={report.leads} filter={filter} />
        </Section>
        {sources.length > 0 && (
          <Section id="sources" title="Sources">
            <Sources sources={sources} />
          </Section>
        )}
      </Stack>
    </article>
  );
}
