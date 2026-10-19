import { Text } from '../../../primitives/Text';
import type { Finding } from '../../model/report';
import './Findings.css';

export interface FindingsProps {
  findings: readonly Finding[];
  className?: string;
}

/**
 * **Job.** What the research found: numbered headed paragraphs, the number hung in the margin so
 * the headings and their prose share one left edge.
 *
 * **Parts** (`data-part`). `root` the ordered list; `finding` each item; `number`, `heading`, `body`.
 */
export function Findings({ findings, className }: FindingsProps) {
  return (
    <ol className={`lib-report-findings${className ? ` ${className}` : ''}`} data-part="root">
      {findings.map((f, i) => (
        <li key={`${i} ${f.heading}`} className="lib-report-findings__item" data-part="finding">
          <Text role="numeral" size="heading" tone="faint" className="lib-report-findings__number" aria-hidden data-part="number">
            {i + 1}
          </Text>
          <Text role="heading" as="h3" tone="primary" className="lib-report-findings__heading" data-part="heading">
            {f.heading}
          </Text>
          <Text role="body" as="p" tone="secondary" className="lib-report-findings__body" data-part="body">
            {f.body}
          </Text>
        </li>
      ))}
    </ol>
  );
}
