import { Text } from '../primitives/Text';
import './Timeline.css';

/** A year; negative is BCE. */
export type Year = number;

export interface TimelineRow {
  id: string;
  /** Who or what the row is ("Nicole Oresme"). */
  label: string;
  /** A span: a life, a period. `circa` marks either end as approximate. */
  span?: { from: Year; to: Year; circa?: boolean };
  /** Points on the span: a work, a proof. */
  points?: { at: Year; label: string; circa?: boolean }[];
}

/** A stretch of the axis drawn to scale; the stretches are joined by a break. */
export interface AxisPiece {
  from: Year;
  to: Year;
  /** Year ticks inside the piece. */
  ticks: Year[];
}

const BREAK = 0.04; // the share of the track a break takes

/** A piecewise-linear axis: each piece takes room in proportion to its length, breaks between. */
function scale(pieces: AxisPiece[]) {
  const total = pieces.reduce((s, p) => s + (p.to - p.from), 0);
  const room = 1 - BREAK * (pieces.length - 1);
  const starts: number[] = [];
  let at = 0;
  for (const p of pieces) {
    starts.push(at);
    at += ((p.to - p.from) / total) * room + BREAK;
  }
  const x = (year: Year): number => {
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if (year <= p.to || i === pieces.length - 1) {
        const y = Math.min(Math.max(year, p.from), p.to);
        return starts[i] + ((y - p.from) / total) * room;
      }
    }
    return 1;
  };
  const breaks = pieces.slice(1).map((_, i) => starts[i + 1] - BREAK / 2);
  return { x, breaks };
}

const pct = (f: number) => `${(f * 100).toFixed(3)}%`;
const yearText = (y: Year, circa?: boolean) => `${circa ? 'c. ' : ''}${y < 0 ? `${-y} BCE` : y}`;

/**
 * **Job.** (Compendium mockup stub.) Spans and points in time, one row per person or thing: the
 * label in a fixed column, the track beside it (a span is a thin bar, a point a dot with its
 * label under it). The axis is piecewise (`AxisPiece`) with a break between pieces, since a
 * history that runs from antiquity to 1822 with nothing between is unreadable on one scale.
 */
export function Timeline({ rows, axis, label }: { rows: TimelineRow[]; axis: AxisPiece[]; label: string }) {
  const { x, breaks } = scale(axis);
  return (
    <div className="cmp-timeline" role="list" aria-label={label}>
      {rows.map((r) => (
        <div key={r.id} className="cmp-timeline__row" role="listitem">
          <Text role="caption" weight="strong" tone="primary" className="cmp-timeline__label" truncate>
            {r.label}
          </Text>
          <div className="cmp-timeline__track">
            {breaks.map((b) => (
              <Text key={b} role="caption" tone="faint" className="cmp-timeline__break" style={{ insetInlineStart: pct(b) }} aria-hidden="true">
                {'//'}
              </Text>
            ))}
            {r.span && (
              <span
                className="cmp-timeline__span"
                data-circa={r.span.circa ? '' : undefined}
                style={{ insetInlineStart: pct(x(r.span.from)), inlineSize: pct(Math.max(0.004, x(r.span.to) - x(r.span.from))) }}
                title={`${yearText(r.span.from, r.span.circa)} – ${yearText(r.span.to, r.span.circa)}`}
              />
            )}
            {r.points?.map((p) => (
              <span key={p.label} className="cmp-timeline__point" style={{ insetInlineStart: pct(x(p.at)) }}>
                <span className="cmp-timeline__dot" aria-hidden="true" />
                <Text role="caption" tone="secondary" className="cmp-timeline__what" data-end={x(p.at) > 0.6 ? '' : undefined}>
                  {`${yearText(p.at, p.circa)} · ${p.label}`}
                </Text>
              </span>
            ))}
          </div>
        </div>
      ))}
      <div className="cmp-timeline__row" aria-hidden="true">
        <span />
        <div className="cmp-timeline__axis">
          {axis.flatMap((piece) =>
            piece.ticks.map((t) => (
              <Text key={t} role="caption" tone="faint" tabular className="cmp-timeline__tick" style={{ insetInlineStart: pct(x(t)) }}>
                {t < 0 ? `${-t} BCE` : t}
              </Text>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
