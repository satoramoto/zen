import { Checkbox } from '../../../../components/Checkbox/Checkbox';
import { Stack } from '../../../../primitives/Stack/Stack';
import { Text } from '../../../../primitives/Text/Text';
import { useControlled } from '../../../fourier/useControlled';
import { exactText, nearestSpecial, normalise, quadrant, radiansText, referenceAngle, signs, toRadians } from '../../model/angle';
import { angleOf, Arc, Axes, Circle, frame, Handle, Label, onCircle, Plane, Readouts, RightAngle, Segment, useDrag } from '../../parts';
import '../../trig.css';

export interface UnitCircleProps {
  /** The angle in degrees, 0 to 360. Default 30. */
  angle?: number;
  onAngle?(deg: number): void;
  /** Draw the tangent segment on the line x = 1. Default false. */
  tangent?: boolean;
  /** Land the point on the nearest special angle when within 5°. Default false. */
  snap?: boolean;
  onSnap?(on: boolean): void;
  /** A horizontal guide at y = `guideSin`, for solving sin θ = k by eye. Plain numbers, so a page can bind them. */
  guideSin?: number;
  /** A vertical guide at x = `guideCos`, for solving cos θ = k. */
  guideCos?: number;
  /** Draw the reference angle's arc on the x-axis side. Default true. */
  reference?: boolean;
  /** Draw the quadrant's name. Default true. */
  quadrants?: boolean;
}

const QUADRANT_NAMES = ['', 'I', 'II', 'III', 'IV'];

/**
 * The unit circle. The point at the angle, dragged round by hand or stepped with the arrow
 * keys (Shift for 15°), its vertical leg sine and horizontal leg cosine, the tangent segment on
 * request, the quadrant and the signs, the reference angle, and the angle in degrees and radians.
 */
export function UnitCircle({ angle: angleProp, onAngle, tangent = false, snap: snapProp, onSnap, guideSin, guideCos, reference = true, quadrants = true }: UnitCircleProps) {
  const [angleRaw, setAngle] = useControlled(angleProp, onAngle, 30);
  const [snap, setSnap] = useControlled(snapProp, onSnap, false);
  const deg = normalise(Math.round(angleRaw * 10) / 10);
  // Wider than tall, at the same scale both ways: room beside the circle for the point's coordinates.
  const f = frame(380, 320, [-1.72, 1.72], [-1.45, 1.45]);
  const p = onCircle(deg);
  const place = (raw: number) => {
    let next = normalise(raw);
    if (snap) {
      const near = nearestSpecial(next);
      if (near.off <= 5) next = near.angle;
    }
    setAngle(Math.round(next * 10) / 10);
  };
  const drag = useDrag(f, (m) => place(angleOf(m)));
  const s = signs(deg);
  const q = quadrant(deg);
  const sinV = Math.sin(toRadians(deg));
  const cosV = Math.cos(toRadians(deg));
  const tanV = Math.abs(cosV) < 1e-9 ? NaN : Math.tan(toRadians(deg));
  const ref = referenceAngle(deg);
  const refFrom = deg <= 90 ? 0 : deg <= 180 ? 180 - ref : deg <= 270 ? 180 : 360 - ref;
  const refTo = refFrom + ref;
  // A guide line at height k (or reach k) crosses the circle twice, touches it once at ±1, and misses past that.
  const crossings = (k: number) => (Math.abs(k) < 1 - 1e-9 ? 2 : Math.abs(Math.abs(k) - 1) < 1e-9 ? 1 : 0);
  const guideText = [
    guideSin !== undefined ? `a flat line at height ${guideSin.toFixed(2)} meets the circle ${['nowhere', 'once', 'twice'][crossings(guideSin)]}` : '',
    guideCos !== undefined ? `an upright line at reach ${guideCos.toFixed(2)} meets the circle ${['nowhere', 'once', 'twice'][crossings(guideCos)]}` : '',
  ]
    .filter(Boolean)
    .join('; ');
  const tanTip = Number.isFinite(tanV) && Math.abs(tanV) <= 1.4 ? { x: 1, y: tanV } : undefined;
  return (
    <div className="zen-trig">
      <Plane
        f={f}
        svgRef={drag.ref}
        label={`The unit circle with the point at ${deg}° (${radiansText(deg)}): sine ${sinV.toFixed(2)}, cosine ${cosV.toFixed(2)}${q ? `, quadrant ${QUADRANT_NAMES[q]}` : ''}${guideText ? `; ${guideText}` : ''}`}
      >
        <Axes f={f} />
        <Circle f={f} />
        {guideSin !== undefined && <Segment f={f} from={{ x: -1.4, y: guideSin }} to={{ x: 1.4, y: guideSin }} className="zen-trig__quiet" />}
        {guideCos !== undefined && <Segment f={f} from={{ x: guideCos, y: -1.4 }} to={{ x: guideCos, y: 1.4 }} className="zen-trig__quiet" />}
        {tangent && <Segment f={f} from={{ x: 1, y: -1.4 }} to={{ x: 1, y: 1.4 }} className="zen-trig__quiet" />}
        <Arc f={f} r={0.28} from={0} to={deg} sector className="zen-trig__angle" />
        <Arc f={f} r={0.28} from={0} to={deg} className="zen-trig__angle" />
        {reference && ref > 0 && ref < 90 && deg > 90 && <Arc f={f} r={0.2} from={refFrom} to={refTo} className="zen-trig__second" />}
        <Segment f={f} from={{ x: 0, y: 0 }} to={p} className="zen-trig__line" />
        <Segment f={f} from={{ x: p.x, y: 0 }} to={p} className="zen-trig__line zen-trig__sin" />
        <Segment f={f} from={{ x: 0, y: 0 }} to={{ x: p.x, y: 0 }} className="zen-trig__line zen-trig__cos" />
        {Math.abs(p.x) > 0.05 && Math.abs(p.y) > 0.05 && <RightAngle f={f} at={{ x: p.x, y: 0 }} p={{ x: 0, y: 0 }} q={p} size={0.08} />}
        {tangent && tanTip && (
          <g>
            <Segment f={f} from={{ x: 0, y: 0 }} to={tanTip} className="zen-trig__quiet" />
            <Segment f={f} from={{ x: 1, y: 0 }} to={tanTip} className="zen-trig__line zen-trig__tan" />
            <Label f={f} at={{ x: 1, y: tanTip.y / 2 }} dx={8} dy={4} className="zen-trig__label zen-trig__label--tan">
              tan {exactText(tanV)}
            </Label>
          </g>
        )}
        {/* With the tangent drawn, sine's label goes inside the triangle, clear of the line x = 1. */}
        <Label f={f} at={{ x: p.x, y: p.y / 2 }} dx={(p.x >= 0) !== tangent ? 8 : -8} dy={4} anchor={(p.x >= 0) !== tangent ? 'start' : 'end'} className="zen-trig__label zen-trig__label--sin">
          sin {exactText(sinV)}
        </Label>
        <Label f={f} at={{ x: p.x / 2, y: 0 }} dx={0} dy={p.y >= 0 ? 14 : -8} anchor="middle" className="zen-trig__label zen-trig__label--cos">
          cos {exactText(cosV)}
        </Label>
        <Label f={f} at={onCircle(deg / 2, 0.42)} dx={0} dy={4} anchor="middle" className="zen-trig__label zen-trig__label--angle">
          {deg}°
        </Label>
        {quadrants && q > 0 && (
          <Label f={f} at={onCircle(45 + 90 * (q - 1), 1.22)} dy={4} anchor="middle" className="zen-trig__label">
            {QUADRANT_NAMES[q]}
          </Label>
        )}
        {!tangent && (
          <Label f={f} at={p} dx={p.x >= 0 ? 12 : -12} dy={p.y >= 0 ? -10 : 18} anchor={p.x >= 0 ? 'start' : 'end'} className="zen-trig__label">
            ({exactText(cosV)}, {exactText(sinV)})
          </Label>
        )}
        <Handle
          f={f}
          at={p}
          label="Angle"
          value={deg}
          min={0}
          max={360}
          valueText={`${deg}°, ${radiansText(deg)}`}
          drag={drag}
          onKey={(d, big) => place(deg + (d === 'right' || d === 'up' ? 1 : -1) * (big ? 15 : 1))}
        />
      </Plane>
      <div className="zen-trig__controls">
        <Readouts
          items={[
            { label: 'θ', value: `${deg}° = ${radiansText(deg)}`, tone: 4 },
            { label: 'sin θ', value: exactText(sinV), tone: 1 },
            { label: 'cos θ', value: exactText(cosV), tone: 2 },
            { label: 'tan θ', value: Number.isFinite(tanV) ? exactText(tanV) : 'undefined', tone: 3 },
          ]}
        />
        <Stack direction="row" gap={3} wrap align="center">
          <Text role="caption" tone="secondary" aria-live="polite">
            {q ? `Quadrant ${QUADRANT_NAMES[q]}: sine ${s.sin > 0 ? '+' : '−'}, cosine ${s.cos > 0 ? '+' : '−'}, tangent ${s.tan > 0 ? '+' : '−'}.` : 'On an axis.'}{' '}
            {ref > 0 && ref < 90 ? `Reference angle ${ref}°.` : ''}
            {guideText ? ` The ${guideText.replace(/^a /, '').replace(/; an /, '; the ')}.` : ''}
          </Text>
          <Checkbox checked={snap} onChange={setSnap} size="small">
            Snap to special angles
          </Checkbox>
        </Stack>
      </div>
    </div>
  );
}
