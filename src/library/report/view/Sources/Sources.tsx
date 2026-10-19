import { Text } from '../../../primitives/Text';
import { safeHref, type Source } from '../../model/report';
import './Sources.css';

export interface SourcesProps {
  sources: readonly Source[];
  className?: string;
}

/**
 * **Job.** Where the facts came from: a numbered footnote list, each source's label then its
 * address, in caption type. An `http(s)` address is a link; anything else is shown as text.
 *
 * **Parts** (`data-part`). `root` the ordered list; `source` each item; `link` its address.
 */
export function Sources({ sources, className }: SourcesProps) {
  return (
    <ol className={`lib-report-sources${className ? ` ${className}` : ''}`} data-part="root">
      {sources.map((s, i) => {
        const href = safeHref(s.url);
        return (
          <Text key={`${i} ${s.url}`} as="li" role="caption" tone="muted" className="lib-report-sources__item" data-part="source">
            <Text tone="secondary" size="inherit" role="caption">
              {s.label}
            </Text>{' '}
            {href ? (
              <Text as="a" role="caption" size="inherit" tone="muted" href={href} className="lib-report-sources__link" data-part="link">
                {s.url}
              </Text>
            ) : (
              <Text role="caption" size="inherit" tone="muted" className="lib-report-sources__url" data-part="link">
                {s.url}
              </Text>
            )}
          </Text>
        );
      })}
    </ol>
  );
}
