import { Button } from '../../components/core/Button/Button';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { useControlled } from '../fourier/useControlled';
import { neatPi, radiansText, toRadians } from './model/angle';
import { angleOf, Arc, Circle, clamp, frame, Handle, Label, onCircle, Plane, Readouts, Segment, useDrag } from './parts';
import './trig.css';
import './ArcWrap.css';

export interface ArcWrapProps {
  /** The angle in degrees, 0 to 360. Default 60. */
  angle?: number;
  onAngle?(deg: number): void;
}

const ONE_RADIAN = 180 / Math.PI;
const FULL = 2 * Math.PI;
/** Where the arc laid flat starts, and the height of its ruler, in radii. */
const RULER_X = -1;
const RULER_Y = -1.7;
const STOPS = [
  { label: 'One radian', angle: ONE_RADIAN },
  { label: 'Half turn', angle: 180 },
  { label: 'Full turn', angle: 360 },
];

const radii = (s: number) => `${s.toFixed(2)} ${Math.abs(s - 1) < 0.005 ? 'radius' : 'radii'}`;

/**
 * Radians as a length. The circle's radius is the ruler: the arc the angle cuts off is drawn in
 * hue 4 with a tick at every whole radius along it, and the same arc is laid flat under the
 * circle on a ruler marked in radii, so the reader sees that the angle in radians is how many
 * radii long the arc is. Drag the point round, or step it with the arrow keys (Shift for 15°).
 */
export function ArcWrap({ angle: angleProp, onAngle }: ArcWrapProps) {
  const [angleRaw, setAngle] = useControlled(angleProp, onAngle, 60);
  const deg = clamp(Math.round(angleRaw * 10) / 10, 0, 360);
  const rad = toRadians(deg);
  // The circle on the left, the ruler under it running out to a full turn; one scale for both.
  const xr: [number, number] = [-1.35, RULER_X + FULL + 0.4];
  const yr: [number, number] = [-2.05, 1.35];
  const width = 480;
  const f = frame(width, (width * (yr[1] - yr[0])) / (xr[1] - xr[0]), xr, yr);
  const p = onCircle(deg);
  const place = (raw: number) => setAngle(Math.round(clamp(raw, 0, 360) * 10) / 10);
  const drag = useDrag(f, (m) => {
    const a = angleOf(m);
    // Dragged on past a full turn the pointer comes back near 0°: hold at 360° (and at 0° the other way).
    place(deg > 300 && a < 60 ? 360 : deg < 60 && a > 300 ? 0 : a);
  });
  const whole = Array.from({ length: Math.floor(rad + 1e-9) }, (_, i) => i + 1);
  const rulerTicks = Array.from({ length: Math.floor(FULL) + 1 }, (_, i) => i);
  const neat = neatPi(deg);
  const radText = neat && neat.n !== 0 ? `${radiansText(deg)} ≈ ${rad.toFixed(2)} rad` : `${rad.toFixed(2)} rad`;
  return (
    <div className="zen-trig">
      <Plane f={f} svgRef={drag.ref} label={`A circle with the angle at ${deg}°, which is ${radText}: the arc it cuts off is ${radii(rad)} long`}>
        <Segment f={f} from={{ x: -1.25, y: 0 }} to={{ x: 1.25, y: 0 }} className="zen-trig__axis" />
        <Circle f={f} />
        <Arc f={f} r={0.28} from={0} to={deg} sector className="zen-trig__angle" />
        {/* The radius: the ruler every length here is measured with. */}
        <Segment f={f} from={{ x: 0, y: 0 }} to={{ x: 1, y: 0 }} className="zen-trig__line" />
        <Segment f={f} from={{ x: 0, y: 0 }} to={p} className="zen-trig__line" />
        <Label f={f} at={{ x: 0.62, y: 0 }} dy={deg > 8 && deg < 180 ? -6 : 14} anchor="middle" className="zen-trig__label">
          r
        </Label>
        <Arc f={f} r={1} from={0} to={deg} className="zen-trig-arcwrap__arc" />
        {whole.map((k) => (
          <g key={k}>
            <Segment f={f} from={onCircle(k * ONE_RADIAN, 0.9)} to={onCircle(k * ONE_RADIAN, 1.1)} className="zen-trig-arcwrap__tick" />
            <Label f={f} at={onCircle(k * ONE_RADIAN, 1.24)} dy={4} anchor="middle" className="zen-trig__label zen-trig__label--angle">
              {k}r
            </Label>
          </g>
        ))}
        {deg >= 12 && (
          <Label f={f} at={onCircle(deg / 2, 0.45)} dy={4} anchor="middle" className="zen-trig__label zen-trig__label--angle">
            {deg}°
          </Label>
        )}
        {/* The arc laid flat on a ruler marked every radius. */}
        <Segment f={f} from={{ x: RULER_X, y: RULER_Y }} to={{ x: RULER_X + FULL, y: RULER_Y }} className="zen-trig-arcwrap__ruler" />
        {rulerTicks.map((k) => (
          <g key={k}>
            <Segment f={f} from={{ x: RULER_X + k, y: RULER_Y - 0.07 }} to={{ x: RULER_X + k, y: RULER_Y + 0.07 }} className="zen-trig-arcwrap__tick" />
            <Label f={f} at={{ x: RULER_X + k, y: RULER_Y }} dy={18} anchor="middle" className="zen-trig__label">
              {k === 0 ? '0' : `${k}r`}
            </Label>
          </g>
        ))}
        <Segment f={f} from={{ x: RULER_X + FULL, y: RULER_Y - 0.1 }} to={{ x: RULER_X + FULL, y: RULER_Y + 0.1 }} className="zen-trig__quiet" />
        {rad > 0 && <Segment f={f} from={{ x: RULER_X, y: RULER_Y }} to={{ x: RULER_X + rad, y: RULER_Y }} className="zen-trig-arcwrap__arc" />}
        <Label f={f} at={{ x: RULER_X, y: RULER_Y }} dy={-10} className="zen-trig__label">
          the arc, laid flat
        </Label>
        <Label f={f} at={{ x: RULER_X + FULL, y: RULER_Y }} dy={-10} anchor="end" className="zen-trig__label">
          a full turn: 2π ≈ 6.28r
        </Label>
        <Handle
          f={f}
          at={p}
          label="Angle"
          value={deg}
          min={0}
          max={360}
          valueText={`${deg}°, ${radText}`}
          drag={drag}
          onKey={(d, big) => place(deg + (d === 'right' || d === 'up' ? 1 : -1) * (big ? 15 : 1))}
        />
      </Plane>
      <div className="zen-trig__controls">
        <Readouts
          items={[
            { label: 'degrees', value: `${deg}°`, tone: 4 },
            { label: 'radians', value: radText, tone: 4 },
            { label: 'arc length', value: radii(rad), tone: 'secondary' },
          ]}
        />
        <Stack direction="row" gap={2} wrap align="center">
          {STOPS.map((s) => (
            <Button key={s.label} label={s.label} onPress={() => setAngle(s.angle)} />
          ))}
          <Text role="caption" tone="secondary" aria-live="polite">
            The arc is {radii(rad)} long, so the angle is {rad.toFixed(2)} radian{Math.abs(rad - 1) < 0.005 ? '' : 's'}. r is one radius.
          </Text>
        </Stack>
      </div>
    </div>
  );
}
