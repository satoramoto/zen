import { Checkbox } from '../../components/core/Checkbox/Checkbox';
import { Segmented } from '../../components/core/Segmented/Segmented';
import { useControlled } from '../fourier/useControlled';
import { firstPrimes } from './model/primes';
import { boundaryWave, closestApproach, nodeMarks } from './model/waves';
import { Caption, CountSlider, many } from './parts';
import './primes.css';

export interface BoundaryWavesProps {
  /** How many primes, from 2 up: 1 to 60. Default 4 (2, 3, 5, 7). */
  count?: number;
  onCount?(n: number): void;
  /** One wave per row, or all on one line. Default 'stacked'. */
  layout?: 'stacked' | 'overlaid';
  onLayout?(layout: 'stacked' | 'overlaid'): void;
  /** Mark each wave's interior nodes. Default false. */
  marks?: boolean;
  onMarks?(on: boolean): void;
  /** Start from this prime instead of 2 (so 5, 7, 11, 13 is `from: 5, count: 4`). Default 2. */
  from?: number;
}

export const MAX_BOUNDARY = 60;
const W = 560;
const PAD = 24;

/**
 * Primes as standing waves between two walls: prime p has p half-waves. Stacked, one per row, or
 * overlaid on one line; with marks, every wave's interior nodes (k/p of the width) are drawn as
 * ticks, and the two marks of different primes that come nearest are picked out with their
 * distance. They never meet: k/p = j/q would need p to divide k.
 */
export function BoundaryWaves({ count: countProp, onCount, layout: layoutProp, onLayout, marks: marksProp, onMarks, from = 2 }: BoundaryWavesProps) {
  const [countRaw, setCount] = useControlled(countProp, onCount, 4);
  const [layout, setLayout] = useControlled(layoutProp, onLayout, 'stacked' as const);
  const [marks, setMarks] = useControlled(marksProp, onMarks, false);
  const count = Math.max(1, Math.min(MAX_BOUNDARY, Math.round(countRaw)));
  const all = Array.from(firstPrimes(MAX_BOUNDARY + 20));
  const start = Math.max(0, all.findIndex((p) => p >= from));
  const primes = all.slice(start, start + count);
  const stacked = layout === 'stacked';
  const rowH = stacked ? Math.max(6, Math.min(48, 360 / primes.length)) : 120;
  const H = stacked ? rowH * primes.length + 2 * PAD : 160 + 2 * PAD;
  const x = (u: number) => PAD + u * (W - 2 * PAD);
  const near = marks && primes.length > 1 ? closestApproach(primes) : undefined;
  const amp = stacked ? rowH * 0.42 : 50;
  const samples = (p: number) => Math.min(1600, Math.max(120, p * 16));
  const path = (p: number, cy: number) => {
    const n = samples(p);
    let d = '';
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      d += `${i ? 'L' : 'M'}${x(u).toFixed(2)} ${(cy - amp * boundaryWave(p, u)).toFixed(2)}`;
    }
    return d;
  };
  const cyOf = (i: number) => (stacked ? PAD + rowH * (i + 0.5) : PAD + 80);
  const names = primes.length <= 8 ? primes.join(', ') : `${primes.slice(0, 4).join(', ')} … ${primes[primes.length - 1]}`;
  const nearText = near ? `The nearest marks of two different primes are ${near.k}/${near.p} and ${near.j}/${near.q}, 1/${many(near.p * near.q)} of the width apart.` : '';
  const label = `${primes.length} prime${primes.length === 1 ? '' : 's'} (${names}) as standing waves between two walls, ${stacked ? 'one per row' : 'on one line'}${marks ? `, with their nodes marked. ${nearText}` : ''}`;
  return (
    <div className="zen-primes">
      <svg viewBox={`0 0 ${W} ${H}`} className="zen-primes__svg" role="img" aria-label={label}>
        <line x1={x(0)} y1={PAD / 2} x2={x(0)} y2={H - PAD / 2} className="zen-primes__wall" />
        <line x1={x(1)} y1={PAD / 2} x2={x(1)} y2={H - PAD / 2} className="zen-primes__wall" />
        {primes.map((p, i) => (
          <path key={p} d={path(p, cyOf(i))} className="zen-primes__wave" opacity={stacked || primes.length < 6 ? 1 : 0.5} />
        ))}
        {marks &&
          primes.map((p, i) =>
            nodeMarks(p).map((u, k) => {
              const isNear = near && ((p === near.p && k + 1 === near.k) || (p === near.q && k + 1 === near.j));
              const cy = cyOf(i);
              const [y1, y2] = stacked ? [cy - rowH / 2, cy + rowH / 2] : [PAD / 2, H - PAD / 2];
              return <line key={`${p}-${k}`} x1={x(u)} y1={y1} x2={x(u)} y2={y2} className={`zen-primes__mark${isNear ? ' zen-primes__mark--near' : ''}`} />;
            }),
          )}
        {stacked &&
          rowH >= 14 &&
          primes.map((p, i) => (
            <text key={p} x={PAD - 6} y={cyOf(i) + 4} textAnchor="end" className="zen-primes__label">
              {p}
            </text>
          ))}
      </svg>
      <div className="zen-primes__controls">
        <CountSlider value={count} max={MAX_BOUNDARY} onChange={setCount} />
        <div className="zen-primes__row">
          <Segmented items={['Stacked', 'Overlaid']} index={stacked ? 0 : 1} onChange={(i) => setLayout(i === 0 ? 'stacked' : 'overlaid')} label="Layout" />
          <Checkbox checked={marks} onChange={setMarks} size="small">
            Mark the nodes
          </Checkbox>
        </div>
        <Caption>
          {marks
            ? primes.length > 1
              ? `${nearText} No two primes ever share a mark: that would need one prime to divide a number smaller than itself.`
              : 'Add a second prime to compare marks.'
            : `Prime p fits p half-waves between the walls.`}
        </Caption>
      </div>
    </div>
  );
}
