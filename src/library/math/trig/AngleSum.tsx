import type { Param } from '../../components/core/Param/param';
import { Slider } from '../../components/core/Slider/Slider';
import { Text } from '../../primitives/Text';
import { useControlled } from '../fourier/useControlled';
import { toRadians } from './model/angle';
import { Arc, Axes, clamp, Label, Path, Plane, Readouts, RightAngle, Segment, frame, type Frame } from './parts';
import './trig.css';

export interface AngleSumProps {
  /** The lower angle α in degrees, 5 to 60. Default 35. */
  alpha?: number;
  onAlpha?(deg: number): void;
  /** The upper angle β in degrees, 5 to 60. Default 25. */
  beta?: number;
  onBeta?(deg: number): void;
}

const ALPHA: Param = { kind: 'int', min: 5, max: 60, defaultValue: 35, steps: 56, name: 'α', shortName: 'α' };
const BETA: Param = { kind: 'int', min: 5, max: 60, defaultValue: 25, steps: 56, name: 'β', shortName: 'β' };

type P = { x: number; y: number };

/** Text beside the middle of a segment, `gap` pixels off it: `side` 1 to the left of from→to as drawn, −1 to the right. */
function SideLabel({ f, from, to, gap = 14, side, className, children }: { f: Frame; from: P; to: P; gap?: number; side: 1 | -1; className: string; children: string }) {
  // In pixels, so the offset is square to the line as drawn (SVG's y runs down).
  const ax = f.x(from.x);
  const ay = f.y(from.y);
  const bx = f.x(to.x);
  const by = f.y(to.y);
  const l = Math.hypot(bx - ax, by - ay) || 1;
  const nx = ((by - ay) / l) * side;
  const ny = (-(bx - ax) / l) * side;
  return (
    <text x={(ax + bx) / 2 + nx * gap} y={(ay + by) / 2 + ny * gap + 4} className={className} textAnchor={Math.abs(nx) < 0.3 ? 'middle' : nx > 0 ? 'start' : 'end'}>
      {children}
    </text>
  );
}

/**
 * The angle-sum formula as two lengths. A slanted side of length 1 at angle α + β is the long
 * side of a right triangle with angle β, whose leg cos β lies at angle α; that leg is in turn the
 * long side of a right triangle with angle α. The tip's height, sin(α + β), is two pieces
 * stacked: sin α cos β (the lower triangle's height) and cos α sin β (the rest), drawn again
 * side by side as a bar so they are seen to add up.
 */
export function AngleSum({ alpha: alphaProp, onAlpha, beta: betaProp, onBeta }: AngleSumProps) {
  const [alphaRaw, setAlpha] = useControlled(alphaProp, onAlpha, 35);
  const [betaRaw, setBeta] = useControlled(betaProp, onBeta, 25);
  const a = clamp(Math.round(alphaRaw), 5, 60);
  const b = clamp(Math.round(betaRaw), 5, 60);
  const ra = toRadians(a);
  const rb = toRadians(b);
  // α + β is at most 120°, so the tip's x reaches back to −½; the bar stands at x = 1.15.
  const f = frame(460, 226, [-0.65, 2.1], [-0.2, 1.15]);
  const o: P = { x: 0, y: 0 };
  // The leg cos β along the line at angle α, then sin β square to it, reaches the tip at α + β.
  const corner: P = { x: Math.cos(rb) * Math.cos(ra), y: Math.cos(rb) * Math.sin(ra) };
  const tip: P = { x: corner.x - Math.sin(rb) * Math.sin(ra), y: corner.y + Math.sin(rb) * Math.cos(ra) };
  const foot: P = { x: corner.x, y: 0 };
  const top: P = { x: corner.x, y: tip.y };
  const lower = Math.sin(ra) * Math.cos(rb);
  const upper = Math.cos(ra) * Math.sin(rb);
  const sum = lower + upper;
  const whole = Math.sin(toRadians(a + b));
  const bar = 1.15;
  const w = 0.07;
  const lowerText = lower.toFixed(3);
  const upperText = upper.toFixed(3);
  const sumText = sum.toFixed(3);
  const wholeText = whole.toFixed(3);
  // The upper piece's label keeps a line clear below the whole height's label when that piece is thin.
  const upperDy = Math.max(4, f.y(whole) - 8 + 14 - f.y(lower + upper / 2));
  return (
    <div className="zen-trig">
      <Plane
        f={f}
        label={`Two right triangles stacked on a slanted side of length 1 at ${a + b}°, with α ${a}° and β ${b}°: the tip's height sin(${a + b}°) = ${wholeText} is ${lowerText} plus ${upperText}`}
      >
        <Axes f={f} />
        {/* The rectangle round the picture, and the tip's height. */}
        <Path f={f} points={[{ x: tip.x, y: 0 }, foot, top, tip]} className="zen-trig__quiet" />
        <Segment f={f} from={{ x: tip.x, y: 0 }} to={tip} className="zen-trig__quiet" />
        {/* The lower triangle (angle α at the origin), the one on the slanted side (angle β), and the small one on top. */}
        <Path f={f} points={[o, foot, corner]} closed className="zen-trig__angle-fill" />
        <Path f={f} points={[o, corner, tip]} closed className="zen-trig__second-fill" />
        <Path f={f} points={[corner, top, tip]} closed className="zen-trig__second-fill" />
        <Segment f={f} from={o} to={foot} className="zen-trig__line" />
        <Segment f={f} from={o} to={corner} className="zen-trig__line" />
        <Segment f={f} from={corner} to={tip} className="zen-trig__line" />
        <Segment f={f} from={o} to={tip} className="zen-trig__line" />
        <Segment f={f} from={top} to={tip} className="zen-trig__line" />
        {/* The two pieces of the tip's height. */}
        <Segment f={f} from={foot} to={corner} className="zen-trig__line zen-trig__angle" />
        <Segment f={f} from={corner} to={top} className="zen-trig__line zen-trig__second" />
        <RightAngle f={f} at={foot} p={o} q={corner} size={0.05} />
        <RightAngle f={f} at={corner} p={o} q={tip} size={0.05} />
        <RightAngle f={f} at={top} p={corner} q={tip} size={0.05} />
        <Arc f={f} r={0.2} from={0} to={a} sector className="zen-trig__angle" />
        <Arc f={f} r={0.2} from={0} to={a} className="zen-trig__angle" />
        <Arc f={f} r={0.28} from={a} to={a + b} sector className="zen-trig__second" />
        <Arc f={f} r={0.28} from={a} to={a + b} className="zen-trig__second" />
        <Label f={f} at={{ x: 0.3 * Math.cos(ra / 2), y: 0.3 * Math.sin(ra / 2) }} dy={4} anchor="middle" className="zen-trig__label zen-trig__label--angle">
          α
        </Label>
        <Label f={f} at={{ x: 0.38 * Math.cos(ra + rb / 2), y: 0.38 * Math.sin(ra + rb / 2) }} dy={4} anchor="middle" className="zen-trig__label zen-trig__label--second">
          β
        </Label>
        <SideLabel f={f} from={{ x: tip.x * 0.4, y: tip.y * 0.4 }} to={tip} side={1} className="zen-trig__label">
          1
        </SideLabel>
        <SideLabel f={f} from={{ x: corner.x * 0.15, y: corner.y * 0.15 }} to={{ x: corner.x * 0.8, y: corner.y * 0.8 }} side={-1} gap={16} className="zen-trig__label">
          cos β
        </SideLabel>
        {/* Inside the triangle on the slanted side, near its wide end: outside, it would sit on the vertical piece. */}
        <SideLabel f={f} from={corner} to={{ x: corner.x + (tip.x - corner.x) * 0.6, y: corner.y + (tip.y - corner.y) * 0.6 }} side={1} gap={6} className="zen-trig__label">
          sin β
        </SideLabel>
        {/* The bar: the two pieces side by side with the whole height. */}
        <Path f={f} points={[{ x: bar, y: 0 }, { x: bar + w, y: 0 }, { x: bar + w, y: lower }, { x: bar, y: lower }]} closed className="zen-trig__angle-fill" />
        <Path f={f} points={[{ x: bar, y: lower }, { x: bar + w, y: lower }, { x: bar + w, y: sum }, { x: bar, y: sum }]} closed className="zen-trig__second-fill" />
        <Segment f={f} from={{ x: bar, y: 0 }} to={{ x: bar, y: lower }} className="zen-trig__line zen-trig__angle" />
        <Segment f={f} from={{ x: bar, y: lower }} to={{ x: bar, y: sum }} className="zen-trig__line zen-trig__second" />
        <Segment f={f} from={tip} to={{ x: bar, y: whole }} className="zen-trig__quiet" />
        <Label f={f} at={{ x: bar + w, y: lower / 2 }} dx={8} dy={4} className="zen-trig__label zen-trig__label--angle">
          sin α cos β = {lowerText}
        </Label>
        <Label f={f} at={{ x: bar + w, y: lower + upper / 2 }} dx={8} dy={upperDy} className="zen-trig__label zen-trig__label--second">
          cos α sin β = {upperText}
        </Label>
        <Label f={f} at={{ x: bar, y: whole }} dy={-8} className="zen-trig__label">
          sin(α + β) = {wholeText}
        </Label>
      </Plane>
      <div className="zen-trig__controls">
        <Slider param={ALPHA} value={a} onChange={(v) => setAlpha(clamp(Math.round(v), 5, 60))} orientation="horizontal" layout="row" length="auto" name="α" display={`${a}°`} />
        <Slider param={BETA} value={b} onChange={(v) => setBeta(clamp(Math.round(v), 5, 60))} orientation="horizontal" layout="row" length="auto" name="β" display={`${b}°`} />
        <Readouts
          items={[
            { label: 'sin α cos β', value: lowerText, tone: 4 },
            { label: 'cos α sin β', value: upperText, tone: 5 },
            { label: 'sin α cos β + cos α sin β', value: sumText, tone: 'secondary' },
            { label: 'sin(α + β)', value: wholeText, tone: 'secondary' },
          ]}
        />
        <Text role="caption" tone="secondary" aria-live="polite">
          The tip of the slanted side of length 1 is {wholeText} high, which is sin({a + b}°). That height is two pieces stacked: {lowerText} from the lower triangle and {upperText} from the upper one, and {lowerText} + {upperText} = {sumText}.
        </Text>
      </div>
    </div>
  );
}
