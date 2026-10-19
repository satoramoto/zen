import { Stack } from '../../../primitives/Stack';
import { Text } from '../../../primitives/Text';
import type { Brief as BriefData } from '../../model/report';
import './Brief.css';

export interface BriefProps {
  brief: BriefData;
  className?: string;
}

/** A labelled list of short lines (scope, method). */
function BriefList({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <Stack direction="column" gap={2} className="lib-report-brief__list" data-part="list">
      <Text role="label" tone="muted" as="h3">
        {label}
      </Text>
      <ul className="lib-report-brief__items">
        {items.map((item, i) => (
          <Text key={i} as="li" role="body" tone="secondary" className="lib-report-brief__item">
            {item}
          </Text>
        ))}
      </ul>
    </Stack>
  );
}

/**
 * **Job.** What the research was about and why: the market and the goal as two labelled prose
 * blocks, then the scope and the method as compact lists side by side (they wrap under each other
 * when the column is narrow).
 *
 * **Parts** (`data-part`). `root`; `prose` the market or goal block; `list` the scope or method list.
 */
export function Brief({ brief, className }: BriefProps) {
  return (
    <Stack direction="column" gap={5} className={`lib-report-brief${className ? ` ${className}` : ''}`} data-part="root">
      {(
        [
          ['Market', brief.market],
          ['Goal', brief.goal],
        ] as const
      ).map(([label, text]) => (
        <Stack key={label} direction="column" gap={1} data-part="prose">
          <Text role="label" tone="muted" as="h3">
            {label}
          </Text>
          <Text role="body" as="p" tone="primary">
            {text}
          </Text>
        </Stack>
      ))}
      <Stack direction="row" gap={5} wrap align="start" className="lib-report-brief__lists">
        {brief.scope.length > 0 && <BriefList label="Scope" items={brief.scope} />}
        {brief.method.length > 0 && <BriefList label="Method" items={brief.method} />}
      </Stack>
    </Stack>
  );
}
