import type { ReactNode } from 'react';
import { Button } from '../../components/core/Button/Button';
import type { Param } from '../../components/core/Param/param';
import { Slider } from '../../components/core/Slider/Slider';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { useControlled } from '../fourier/useControlled';
import { rightTriangle, rightTriangleFrom, SPECIAL_RIGHT } from './model/triangle';
import { Arc, clamp, frame, type Frame, Handle, onCircle, Path, Plane, Readouts, RightAngle, Segment, useDrag } from './parts';
import './trig.css';

export interface RightTriangleProps {
  /** The marked angle in degrees, 5 to 85. Default 35. */
  angle?: number;
  onAngle?(deg: number): void;
  /** The hypotenuse, 0.5 to 3. Default 2. */
  hypotenuse?: number;
  onHypotenuse?(h: number): void;
}

const ANGLE: Param = { kind: 'int', min: 5, max: 85, defaultValue: 35, steps: 81, name: 'Angle', shortName: 'θ' };
const HYPOTENUSE: Param = { kind: 'float', min: 0.5, max: 3, defaultValue: 2, steps: 26, name: 'Hypotenuse', shortName: 'hyp' };

const toAngle = (v: number) => clamp(Math.round(v), ANGLE.min, ANGLE.max);
const toHypotenuse = (v: number) => clamp(Math.round(v * 100) / 100, HYPOTENUSE.min, HYPOTENUSE.max);
const LINE = 13;

/**
 * Text in lines at a maths point, offset in pixels: the block grows up from the point (`up`) or
 * down from it. Local to this figure: `Label` in parts draws one line.
 */
function Lines({ f, at, dx = 0, dy = 0, lines, grow = 'down', anchor = 'start', className }: { f: Frame; at: { x: number; y: number }; dx?: number; dy?: number; lines: ReactNode[]; grow?: 'up' | 'down'; anchor?: 'start' | 'middle' | 'end'; className: string }) {
  const x = f.x(at.x) + dx;
  const y = f.y(at.y) + dy - (grow === 'up' ? (lines.length - 1) * LINE : 0);
  return (
    <text x={x} y={y} className={className} textAnchor={anchor}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : LINE}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * A right triangle named from its marked angle θ at the origin: the side across from θ is the
 * opposite (hue 1), the side along the ground next to θ the adjacent (hue 2), the long side the
 * hypotenuse. Drag the free corner (or use the arrow keys: Left/Right the angle, Up/Down the
 * hypotenuse, Shift for big steps) and read sin, cos and tan as live fractions of the sides.
 * Change the size alone and the fractions stay put: they belong to the angle.
 */
export function RightTriangle({ angle: angleProp, onAngle, hypotenuse: hypProp, onHypotenuse }: RightTriangleProps) {
  const [angleRaw, setAngle] = useControlled(angleProp, onAngle, 35);
  const [hypRaw, setHyp] = useControlled(hypProp, onHypotenuse, 2);
  const deg = toAngle(angleRaw);
  const hyp = toHypotenuse(hypRaw);
  const t = rightTriangle(deg, hyp);
  const f = frame(380, 3.8 * 76, [-1, 4], [-0.5, 3.3]);
  const O = { x: 0, y: 0 };
  const C = { x: t.adjacent, y: 0 };
  const P = { x: t.adjacent, y: t.opposite };
  const drag = useDrag(f, (m) => {
    const next = rightTriangleFrom({ x: Math.max(m.x, 0.01), y: Math.max(m.y, 0.01) });
    setAngle(toAngle(next.angle));
    setHyp(toHypotenuse(next.hypotenuse));
  });
  const opp = t.opposite.toFixed(2);
  const adj = t.adjacent.toFixed(2);
  const hypText = hyp.toFixed(2);
  const arcR = Math.min(0.4, 0.3 * hyp);
  const special = SPECIAL_RIGHT.find((s) => s.angle === deg);
  // The hypotenuse's label sits off its middle on the outside (up and to the left).
  const mid = { x: P.x / 2, y: P.y / 2 };
  const n = onCircle(deg + 90);
  return (
    <div className="zen-trig">
      <Plane
        f={f}
        svgRef={drag.ref}
        label={`A right triangle with the marked angle ${deg}° and hypotenuse ${hypText}: opposite ${opp}, adjacent ${adj}; sine ${t.sin.toFixed(3)}, cosine ${t.cos.toFixed(3)}, tangent ${t.tan.toFixed(3)}`}
      >
        <Segment f={f} from={{ x: -0.3, y: 0 }} to={{ x: 3.4, y: 0 }} className="zen-trig__axis" />
        <Path f={f} points={[O, C, P]} closed className="zen-trig__fill" />
        <Arc f={f} r={arcR} from={0} to={deg} sector className="zen-trig__angle" />
        <Arc f={f} r={arcR} from={0} to={deg} className="zen-trig__angle" />
        <Segment f={f} from={O} to={C} className="zen-trig__line zen-trig__cos" />
        <Segment f={f} from={C} to={P} className="zen-trig__line zen-trig__sin" />
        <Segment f={f} from={O} to={P} className="zen-trig__line" />
        {t.opposite > 0.18 && t.adjacent > 0.18 && <RightAngle f={f} at={C} p={O} q={P} size={0.12} />}
        {/* θ on the base just past its arc when the triangle has room there, else just left of the corner. */}
        {deg >= 30 && deg <= 55 && hyp >= 1.2 ? (
          <Lines f={f} at={{ x: arcR + 0.08, y: 0 }} dy={-5} anchor="start" lines={[`θ ${deg}°`]} className="zen-trig__label zen-trig__label--angle" />
        ) : (
          <Lines f={f} at={O} dx={-8} dy={-4} anchor="end" lines={[`θ ${deg}°`]} className="zen-trig__label zen-trig__label--angle" />
        )}
        <Lines f={f} at={{ x: C.x / 2, y: 0 }} dy={16} anchor="middle" lines={[`adjacent ${adj}`]} className="zen-trig__label zen-trig__label--cos" />
        <Lines f={f} at={{ x: C.x, y: P.y / 2 }} dx={8} dy={-2} anchor="start" lines={['opposite', opp]} className="zen-trig__label zen-trig__label--sin" />
        <Lines f={f} at={mid} dx={n.x * 10 - 4} dy={-n.y * 10} grow="up" anchor="end" lines={['hypotenuse', hypText]} className="zen-trig__label" />
        <Handle
          f={f}
          at={P}
          label="Free corner"
          drag={drag}
          onKey={(d, big) => {
            if (d === 'left' || d === 'right') setAngle(toAngle(deg + (d === 'right' ? 1 : -1) * (big ? 5 : 1)));
            else setHyp(toHypotenuse(hyp + (d === 'up' ? 1 : -1) * (big ? 0.5 : 0.1)));
          }}
        />
      </Plane>
      <div className="zen-trig__controls">
        <Slider param={ANGLE} value={deg} onChange={(v) => setAngle(toAngle(v))} orientation="horizontal" layout="row" length="auto" name="Angle" display={`${deg}°`} />
        <Slider param={HYPOTENUSE} value={hyp} onChange={(v) => setHyp(toHypotenuse(v))} orientation="horizontal" layout="row" length="auto" name="Hypotenuse" display={hypText} />
        <Readouts
          items={[
            { label: 'sin θ = opposite / hypotenuse', value: `${opp} / ${hypText} = ${t.sin.toFixed(3)}`, tone: 1 },
            { label: 'cos θ = adjacent / hypotenuse', value: `${adj} / ${hypText} = ${t.cos.toFixed(3)}`, tone: 2 },
            { label: 'tan θ = opposite / adjacent', value: `${opp} / ${adj} = ${t.tan.toFixed(3)}`, tone: 3 },
          ]}
        />
        <Stack direction="row" gap={2} wrap align="center">
          {SPECIAL_RIGHT.map((s) => (
            <Button key={s.label} label={s.label} onPress={() => setAngle(s.angle)} />
          ))}
          <Text role="caption" tone="secondary" aria-live="polite">
            {special ? `The ${special.label} triangle: its sides are in the ratio ${special.sides}. ` : ''}
            The sides are named from θ. Make the triangle bigger or smaller and the three ratios stay the same; only the angle changes them.
          </Text>
        </Stack>
      </div>
    </div>
  );
}
