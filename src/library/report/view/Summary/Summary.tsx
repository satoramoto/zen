import { Stack } from '../../../primitives/Stack';
import { Text } from '../../../primitives/Text';
import type { Stat } from '../../model/report';
import './Summary.css';

export interface SummaryProps {
  stats: readonly Stat[];
  className?: string;
}

/**
 * **Job.** The headline numbers: one tile per stat, the value as a numeral over its label and an
 * optional note, in one row that wraps. Tiles are unboxed: a hairline above each, so the row reads
 * as part of the document rather than a dashboard.
 *
 * **Parts** (`data-part`). `root` the list; `stat` each tile; `value`, `label`, `note` its words.
 */
export function Summary({ stats, className }: SummaryProps) {
  return (
    <Stack as="dl" direction="row" gap={5} wrap className={`lib-report-summary${className ? ` ${className}` : ''}`} data-part="root">
      {stats.map((s, i) => (
        <Stack key={`${i} ${s.label}`} direction="column" gap={1} className="lib-report-summary__stat" data-part="stat">
          <Text as="dt" role="label" tone="muted" data-part="label">
            {s.label}
          </Text>
          <Text as="dd" role="numeral" tone="primary" className="lib-report-summary__value" data-part="value">
            {s.value}
          </Text>
          {s.note && (
            <Text as="dd" role="caption" tone="muted" className="lib-report-summary__value" data-part="note">
              {s.note}
            </Text>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
