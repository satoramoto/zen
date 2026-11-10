import { Arc, Circle, frame, Label, onCircle, Plane, Readouts, Segment, square } from '../../parts';
import '../SignedTurn/SignedTurn.css';

export interface RadiusStripsProps {
  /** Exact radian measure. Never reconstructed from a rounded degree label. */
  radians?: number;
  radius?: number;
  /** Shared frame radius for comparisons: both drawings must use the same value. */
  scaleRadius?: number;
  wrapped?: boolean;
  unwrapped?: boolean;
  labels?: boolean;
  unit?: string;
  description?: string;
}

/** Radius-length strips on an arc and a straight ruler, drawn in the same physical units. */
export function RadiusStrips({ radians = 1, radius = 2, scaleRadius = 4, wrapped = true, unwrapped = false, labels = true, unit = 'cm', description }: RadiusStripsProps) {
  if (!(radius > 0 && scaleRadius >= radius && radians >= 0 && radians <= 2 * Math.PI) || !Number.isFinite(scaleRadius)) throw new RangeError('Use a positive radius within the shared scale, and zero to 2π radians');
  const degrees = radians * 180 / Math.PI;
  const arcLength = radians * radius;
  const f = square(280, scaleRadius * 1.25);
  const full = 2 * Math.PI * scaleRadius;
  const ruler = frame(320, 100, [-0.2 * scaleRadius, full + 0.2 * scaleRadius], [-scaleRadius, scaleRadius]);
  const pieces = Array.from({ length: Math.ceil(radians) }, (_, i) => i);
  const format = (n: number) => Number.isInteger(n) ? String(n) : `≈ ${n.toFixed(2)}`;
  const text = description ?? `Radius ${radius} ${unit}; arc ${format(arcLength)} ${unit}; ${format(radians)} radius lengths. The marked radius goes from centre to edge.`;
  return <div className="zen-trig" data-radians={radians} data-radius={radius} data-arc-length={arcLength} data-scale-radius={scaleRadius}>
    <Plane f={f} label={text}>
      <Circle f={f} r={radius} />
      <Segment f={f} from={{ x: 0, y: 0 }} to={{ x: radius, y: 0 }} />
      <Label f={f} at={{ x: radius / 2, y: 0 }} anchor="middle" dy={18}>r</Label>
      <Circle f={f} r={scaleRadius * 0.025} className="zen-trig__line" />
      {wrapped && <>
        {pieces.map((i) => <Arc key={i} f={f} r={radius} from={i * 180 / Math.PI} to={Math.min(i + 1, radians) * 180 / Math.PI} className="zen-signed-turn__sweep" />)}
        {Array.from({ length: Math.floor(radians) + 1 }, (_, i) => <Segment key={i} f={f} from={onCircle(i * 180 / Math.PI, radius - scaleRadius * 0.05)} to={onCircle(i * 180 / Math.PI, radius + scaleRadius * 0.05)} />)}
        <Segment f={f} from={{ x: 0, y: 0 }} to={onCircle(degrees, radius)} />
      </>}
      <Segment f={f} from={{ x: -radius / 2, y: -scaleRadius * 1.1 }} to={{ x: radius / 2, y: -scaleRadius * 1.1 }} className="zen-signed-turn__sweep" />
    </Plane>
    <p>Centre to edge: one radius. The straight strip below the circle has the same length.</p>
    {unwrapped && <Plane f={ruler} label={`The highlighted arc laid flat: ${format(arcLength)} ${unit}. Each complete strip is ${radius} ${unit}.`}>
      <Segment f={ruler} from={{ x: 0, y: 0 }} to={{ x: full, y: 0 }} className="zen-trig__axis" />
      <Segment f={ruler} from={{ x: 0, y: 0 }} to={{ x: arcLength, y: 0 }} className="zen-signed-turn__sweep" />
      {Array.from({ length: Math.floor(radians) + 1 }, (_, i) => <Segment key={i} f={ruler} from={{ x: i * radius, y: -scaleRadius * 0.15 }} to={{ x: i * radius, y: scaleRadius * 0.15 }} />)}
    </Plane>}
    {labels && <Readouts items={[{ label: 'radius r', value: `${radius} ${unit}` }, { label: 'arc s', value: `${format(arcLength)} ${unit}` }, { label: 's ÷ r', value: `${format(radians)} rad` }]} />}
  </div>;
}
