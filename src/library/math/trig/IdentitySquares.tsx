import { Text } from '../../primitives/Text';
import { useControlled } from '../fourier/useControlled';
import { toRadians } from './model/angle';
import { angleOf, Arc, Axes, Circle, clamp, Handle, Label, onCircle, Path, Plane, Readouts, RightAngle, Segment, frame, useDrag, type Frame } from './parts';
import './trig.css';

export interface IdentitySquaresProps {
  /** The angle in degrees, 0 to 90 (the first quadrant). Default 35. */
  angle?: number;
  onAngle?(deg: number): void;
}

/** A square's area written in two lines at a maths point: its name over its value. */
function AreaLabel({ f, at, name, value, className, dy = 0, anchor = 'middle' }: { f: Frame; at: { x: number; y: number }; name: string; value: string; className: string; dy?: number; anchor?: 'start' | 'middle' | 'end' }) {
  const x = f.x(at.x);
  const y = f.y(at.y) + dy;
  return (
    <text x={x} y={y - 2} className={className} textAnchor={anchor}>
      <tspan x={x}>{name}</tspan>
      <tspan x={x} dy={13}>
        {value}
      </tspan>
    </text>
  );
}

/**
 * The Pythagorean identity as areas. The right triangle inside the unit circle has legs sin θ
 * (vertical) and cos θ (horizontal) and hypotenuse 1; a square stands on each side. Drag the
 * point (or step it with the arrow keys, Shift for 15°): the two coloured squares change size,
 * and their areas always add up to the square on the radius, 1.
 */
export function IdentitySquares({ angle: angleProp, onAngle }: IdentitySquaresProps) {
  const [angleRaw, setAngle] = useControlled(angleProp, onAngle, 35);
  // Whole degrees: the two areas, rounded to hundredths, then always add up to 1.00 as shown.
  const deg = clamp(Math.round(angleRaw), 0, 90);
  // The squares reach x = cos θ + sin θ and y = cos θ + sin θ (at most √2), and down and left to −1.
  const f = frame(340, 340, [-1.2, 1.6], [-1.2, 1.6]);
  const place = (raw: number) => setAngle(clamp(Math.round(raw), 0, 90));
  const drag = useDrag(f, (m) => {
    const a = angleOf(m);
    place(a <= 90 ? a : a < 225 ? 90 : 0);
  });
  const s = Math.sin(toRadians(deg));
  const c = Math.cos(toRadians(deg));
  const sin2 = s * s;
  const cos2 = c * c;
  const p = onCircle(deg);
  const foot = { x: c, y: 0 };
  const o = { x: 0, y: 0 };
  // Outward from the triangle: the sine square to the right of the vertical leg, the cosine
  // square below the x-axis, the square on the radius on the side away from the right angle.
  const sinSquare = [foot, { x: c + s, y: 0 }, { x: c + s, y: s }, p];
  const cosSquare = [o, foot, { x: c, y: -c }, { x: 0, y: -c }];
  const hypSquare = [o, p, { x: c - s, y: s + c }, { x: -s, y: c }];
  const sinText = sin2.toFixed(2);
  const cosText = cos2.toFixed(2);
  const sumText = (sin2 + cos2).toFixed(2);
  // A square too small to hold its label has it beside instead.
  const sinInside = s >= 0.42;
  const cosInside = c >= 0.42;
  return (
    <div className="zen-trig">
      <Plane f={f} svgRef={drag.ref} label={`A right triangle in the unit circle at ${deg}°, with a square on each side: sine squared ${sinText} plus cosine squared ${cosText} makes ${sumText}`}>
        <Axes f={f} />
        <Circle f={f} />
        <Path f={f} points={hypSquare} closed className="zen-trig__quiet" />
        {s > 1e-9 && (
          <g>
            <Path f={f} points={sinSquare} closed className="zen-trig__sin-fill" />
            <Path f={f} points={sinSquare} closed className="zen-trig__line zen-trig__sin" />
          </g>
        )}
        {c > 1e-9 && (
          <g>
            <Path f={f} points={cosSquare} closed className="zen-trig__cos-fill" />
            <Path f={f} points={cosSquare} closed className="zen-trig__line zen-trig__cos" />
          </g>
        )}
        {deg > 0 && <Arc f={f} r={0.2} from={0} to={deg} sector className="zen-trig__angle" />}
        {deg > 0 && <Arc f={f} r={0.2} from={0} to={deg} className="zen-trig__angle" />}
        <Segment f={f} from={o} to={p} className="zen-trig__line" />
        <Segment f={f} from={foot} to={p} className="zen-trig__line zen-trig__sin" />
        <Segment f={f} from={o} to={foot} className="zen-trig__line zen-trig__cos" />
        {s > 0.08 && c > 0.08 && <RightAngle f={f} at={foot} p={o} q={p} size={0.07} />}
        {deg >= 12 && (
          <Label f={f} at={onCircle(deg / 2, 0.3)} dy={4} anchor="middle" className="zen-trig__label zen-trig__label--angle">
            θ
          </Label>
        )}
        {s > 1e-9 &&
          (sinInside ? (
            <AreaLabel f={f} at={{ x: c + s / 2, y: s / 2 }} name="sin²θ" value={sinText} className="zen-trig__label zen-trig__label--sin" />
          ) : (
            <AreaLabel f={f} at={{ x: c + s + 0.04, y: s / 2 }} name="sin²θ" value={sinText} anchor="start" className="zen-trig__label zen-trig__label--sin" />
          ))}
        {c > 1e-9 &&
          (cosInside ? (
            <AreaLabel f={f} at={{ x: c / 2, y: -c / 2 }} name="cos²θ" value={cosText} className="zen-trig__label zen-trig__label--cos" />
          ) : (
            <AreaLabel f={f} at={{ x: c + 0.04, y: -c / 2 }} name="cos²θ" value={cosText} anchor="start" className="zen-trig__label zen-trig__label--cos" />
          ))}
        <AreaLabel f={f} at={{ x: (c - s) / 2, y: (s + c) / 2 }} name="area" value="1" className="zen-trig__label" />
        <Handle
          f={f}
          at={p}
          label="Angle"
          value={deg}
          min={0}
          max={90}
          valueText={`${deg}°`}
          drag={drag}
          onKey={(d, big) => place(deg + (d === 'right' || d === 'up' ? 1 : -1) * (big ? 15 : 1))}
        />
      </Plane>
      <div className="zen-trig__controls">
        <Readouts
          items={[
            { label: 'θ', value: `${deg}°`, tone: 4 },
            { label: 'sin²θ', value: sinText, tone: 1 },
            { label: 'cos²θ', value: cosText, tone: 2 },
            { label: 'sin²θ + cos²θ', value: sumText, tone: 'secondary' },
          ]}
        />
        <Text role="caption" tone="secondary" aria-live="polite">
          The sides of the triangle are sin θ and cos θ, so the squares on them have areas {sinText} and {cosText}. Together they make {sumText}: exactly the square on the radius, whose side is 1.
        </Text>
      </div>
    </div>
  );
}
