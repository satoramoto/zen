import { Text } from '../../../primitives/Text';
import type { Source } from '../../model/report';
import './Sources.css';

export interface SourcesProps {
  sources: readonly Source[];
  className?: string;
}

/**
 * **Job.** Where the facts came from: a numbered footnote list, each source's label then its
 * address as a link, in caption type.
 *
 * **Parts** (`data-part`). `root` the ordered list; `source` each item; `link` its address.
 */
export function Sources({ sources, className }: SourcesProps) {
  return (
    <ol className={`lib-report-sources${className ? ` ${className}` : ''}`} data-part="root">
      {sources.map((s, i) => (
        <Text key={`${i} ${s.url}`} as="li" role="caption" tone="muted" className="lib-report-sources__item" data-part="source">
          <Text tone="secondary" size="inherit" role="caption">
            {s.label}
          </Text>{' '}
          <Text as="a" role="caption" size="inherit" tone="muted" href={s.url} className="lib-report-sources__link" data-part="link">
            {s.url}
          </Text>
        </Text>
      ))}
    </ol>
  );
}
