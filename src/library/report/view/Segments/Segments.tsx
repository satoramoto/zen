import { Stack } from '../../../primitives/Stack';
import { Text } from '../../../primitives/Text';
import type { Segment } from '../../model/report';
import { hueAt } from '../hues';
import './Segments.css';

export interface SegmentsProps {
  segments: readonly Segment[];
  /** The bar's accessible name. Default `Share of each segment`. */
  label?: string;
  className?: string;
}

/**
 * **Job.** How a whole divides: one thin proportional bar, each part as wide as its count, then a
 * legend with each segment's swatch, name, count and note. Segment `i` takes hue slot `i + 1`
 * (so tiers A, B, C read as hues 1–3, matching the lead table's tier labels).
 *
 * **Parts** (`data-part`). `root`; `bar` the proportional bar (an `img` with a text alternative);
 * `part` each piece of it; `legend` the list; `entry` each legend row (its name carries the swatch).
 *
 * **Tuning knobs.** `--lib-report-hue` (a part's or an entry's swatch fill, set from its slot).
 */
export function Segments({ segments, label = 'Share of each segment', className }: SegmentsProps) {
  const total = segments.reduce((n, s) => n + Math.max(0, s.count), 0);
  const alt = segments.map((s) => `${s.name} ${s.count}`).join(', ');
  return (
    <Stack direction="column" gap={4} className={`lib-report-segments${className ? ` ${className}` : ''}`} data-part="root">
      {total > 0 && (
        <div className="lib-report-segments__bar" role="img" aria-label={`${label}: ${alt}`} data-part="bar">
          {segments.map((s, i) =>
            s.count > 0 ? (
              <span key={`${i} ${s.name}`} className="lib-report-segments__part" data-hue={hueAt(i)} style={{ flexGrow: s.count }} data-part="part" />
            ) : null,
          )}
        </div>
      )}
      <ul className="lib-report-segments__legend" data-part="legend">
        {segments.map((s, i) => (
          <li key={`${i} ${s.name}`} className="lib-report-segments__entry" data-hue={hueAt(i)} data-part="entry">
            <Text role="label" tone={hueAt(i)} className="lib-report-segments__name">
              {s.name}
            </Text>
            <Text role="label" tone="primary" tabular className="lib-report-segments__count">
              {s.count}
              {total > 0 && (
                <Text role="caption" tone="faint" tabular size="inherit">
                  {' '}
                  · {Math.round((s.count / total) * 100)}%
                </Text>
              )}
            </Text>
            <Text role="body" tone="secondary" className="lib-report-segments__note">
              {s.note}
            </Text>
          </li>
        ))}
      </ul>
    </Stack>
  );
}
