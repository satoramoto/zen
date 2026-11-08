import { useMemo, type RefObject } from 'react';
import { Button } from '../../components/core/Button/Button';
import type { Param } from '../../components/core/Param/param';
import { Segmented } from '../../components/core/Segmented/Segmented';
import { Slider } from '../../components/core/Slider/Slider';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { useControlled } from '../fourier/useControlled';
import { toRadians } from './model/angle';
import { areaFromSine, cosineTerms, placeSAS, sineRatios, ssa, triangle, type Point } from './model/triangle';
import { angleOf, Arc, Circle, clamp, frame, Handle, Label, Path, Plane, Readouts, Segment, useDrag, type Frame } from './parts';
import './trig.css';

export type Vertices = { A: Point; B: Point; C: Point };
export type Law = 'sines' | 'cosines' | 'area';

export interface GeneralTriangleProps {
  /** The three corners, in the frame x −0.5 to 6.5, y −0.5 to 4.5. Default a scalene acute triangle. */
  vertices?: Vertices;
  onVertices?(v: Vertices): void;
  /** What the readouts under the drawing explain. Default 'sines'. */
  law?: Law;
  onLaw?(law: Law): void;
  /** Show the ambiguous case (side, side, angle) instead of a free triangle. Default false. */
  ambiguous?: boolean;
  /** The ambiguous case's swinging side a, 1 to 6 in steps of 0.1. Default 3.5 (two triangles). */
  sideA?: number;
  onSideA?(a: number): void;
  /** The ambiguous case's fixed angle A in degrees. Default 35. */
  ssaAngle?: number;
  /** The ambiguous case's fixed side b, from A to C. Default 5. */
  ssaSide?: number;
}

const DEFAULT_VERTICES: Vertices = { A: { x: 0.5, y: 0.5 }, B: { x: 5.5, y: 0.8 }, C: { x: 2.2, y: 3.8 } };
const LAWS: Law[] = ['sines', 'cosines', 'area'];
const LAW_NAMES = ['Law of sines', 'Law of cosines', 'Area'];
/** The ambiguous case's three stops: values of side a, with angle A 35° and side b 5. */
const STOPS = [
  { label: 'One triangle', a: 5.5 },
  { label: 'Two triangles', a: 3.5 },
  { label: 'No triangle', a: 2 },
];
const SIDE_A: Param = { kind: 'float', min: 1, max: 6, defaultValue: 3.5, steps: 51, name: 'Side a', shortName: 'a' };
/** Smallest area a move may leave: below it the triangle has nearly flattened into a line. */
const MIN_AREA = 0.05;

const n2 = (v: number) => v.toFixed(2);
const d1 = (v: number) => `${v.toFixed(1)}°`;
const round2 = (v: number) => Math.round(v * 100) / 100;
const unit = (x: number, y: number) => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};

/**
 * The parts' `useDrag` makes its own SVG ref, and three handles share one drawing: this ref
 * object hands the SVG element to every hook's ref when React attaches it.
 */
function useSharedRef(refs: RefObject<SVGSVGElement | null>[]): RefObject<SVGSVGElement | null> {
  return useMemo(
    () => ({
      get current() {
        return refs[0].current;
      },
      set current(el: SVGSVGElement | null) {
        for (const r of refs) r.current = el;
      },
    }),
    // The hooks' refs are stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

/** The arc and degrees at corner `at`, between the directions to `p` and `q`. */
function CornerAngle({ f, at, p, q, deg, strong }: { f: Frame; at: Point; p: Point; q: Point; deg: number; strong?: boolean }) {
  const tp = angleOf(p, at.x, at.y);
  const tq = angleOf(q, at.x, at.y);
  let from = tp;
  let sweep = (tq - tp + 360) % 360;
  if (sweep > 180) {
    from = tq;
    sweep = 360 - sweep;
  }
  const mid = toRadians(from + sweep / 2);
  // A narrow angle pushes its number further out, clear of its two sides.
  const lr = clamp(0.3 / Math.sin(toRadians(Math.max(sweep, 1) / 2)), 0.68, 1.4);
  return (
    <g>
      {strong && <Arc f={f} cx={at.x} cy={at.y} r={0.4} from={from} to={from + sweep} sector className="zen-trig__angle" />}
      <Arc f={f} cx={at.x} cy={at.y} r={0.4} from={from} to={from + sweep} className="zen-trig__angle" />
      <Label f={f} at={{ x: at.x + lr * Math.cos(mid), y: at.y + lr * Math.sin(mid) }} dy={4} anchor="middle" className="zen-trig__label zen-trig__label--angle">
        {Math.round(deg)}°
      </Label>
    </g>
  );
}

/** A corner's name, pushed out from the point `g` (the centroid) by `gap` pixels: clear of a handle by default, closer where there is none. */
function VertexName({ f, at, g, children, className = 'zen-trig__label', gap = 28 }: { f: Frame; at: Point; g: Point; children: string; className?: string; gap?: number }) {
  const u = unit(at.x - g.x, at.y - g.y);
  return (
    <Label f={f} at={at} dx={u.x * gap} dy={-u.y * gap + 4} anchor="middle" className={className}>
      {children}
    </Label>
  );
}

/** A side's name and length at its midpoint, pushed away from the opposite corner. */
function SideName({ f, from, to, away, text, className }: { f: Frame; from: Point; to: Point; away: Point; text: string; className: string }) {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  let nrm = unit(-(to.y - from.y), to.x - from.x);
  if (nrm.x * (away.x - mid.x) + nrm.y * (away.y - mid.y) > 0) nrm = { x: -nrm.x, y: -nrm.y };
  // Text is wider than it is tall: push it further along x than along y.
  return (
    <Label f={f} at={mid} dx={nrm.x * 36} dy={-nrm.y * 16 + 4} anchor="middle" className={className}>
      {text}
    </Label>
  );
}

/**
 * Any triangle. Drag its three corners (or step them with the arrow keys, Shift for bigger
 * steps); the sides, the angles, the law of sines' three equal ratios, the law of cosines for
 * angle C and the area as ½ab·sin C follow. With `ambiguous`, the side-side-angle case: angle A
 * and side b fixed, side a swinging from C, meeting the base in none, one or two places.
 */
export function GeneralTriangle(props: GeneralTriangleProps) {
  return props.ambiguous ? <AmbiguousCase {...props} /> : <FreeTriangle {...props} />;
}

function FreeTriangle({ vertices: verticesProp, onVertices, law: lawProp, onLaw }: GeneralTriangleProps) {
  const [v, setVertices] = useControlled(verticesProp, onVertices, DEFAULT_VERTICES);
  const [law, setLaw] = useControlled<Law>(lawProp, onLaw, 'sines');
  const f = frame(420, 300, [-0.5, 6.5], [-0.5, 4.5]);
  const move = (name: 'A' | 'B' | 'C', p: Point) => {
    const next = { ...v, [name]: { x: round2(clamp(p.x, -0.3, 6.3)), y: round2(clamp(p.y, -0.3, 4.3)) } };
    if (triangle(next.A, next.B, next.C).area < MIN_AREA) return; // too flat: refuse the move
    setVertices(next);
  };
  const dragA = useDrag(f, (p) => move('A', p));
  const dragB = useDrag(f, (p) => move('B', p));
  const dragC = useDrag(f, (p) => move('C', p));
  const svgRef = useSharedRef([dragA.ref, dragB.ref, dragC.ref]);
  const t = triangle(v.A, v.B, v.C);
  const g = { x: (v.A.x + v.B.x + v.C.x) / 3, y: (v.A.y + v.B.y + v.C.y) / 3 };
  const [rA, rB, rC] = sineRatios(t);
  const cos = cosineTerms(t);
  const rhs = cos.aSquared + cos.bSquared - cos.correction;
  const correction = cos.correction >= 0 ? `− ${n2(cos.correction)}` : `+ ${n2(-cos.correction)}`;
  const step = (name: 'A' | 'B' | 'C') => (d: 'left' | 'right' | 'up' | 'down', big: boolean) => {
    const s = big ? 0.5 : 0.1;
    const p = v[name];
    move(name, { x: p.x + (d === 'right' ? s : d === 'left' ? -s : 0), y: p.y + (d === 'up' ? s : d === 'down' ? -s : 0) });
  };
  const lawItems: { label: string; value: string; tone?: 1 | 2 | 3 | 4 | 5 | 'secondary' }[] =
    law === 'sines'
      ? [
          { label: 'a / sin A', value: n2(rA), tone: 1 },
          { label: 'b / sin B', value: n2(rB), tone: 2 },
          { label: 'c / sin C', value: n2(rC), tone: 3 },
        ]
      : law === 'cosines'
        ? [
            { label: 'c²', value: n2(cos.cSquared), tone: 3 },
            { label: 'a² + b² − 2ab·cos C', value: `${n2(cos.aSquared)} + ${n2(cos.bSquared)} ${correction} = ${n2(rhs)}`, tone: 4 },
          ]
        : [
            { label: '½·a·b·sin C', value: n2(areaFromSine(t)), tone: 4 },
            { label: 'Area from the corners', value: n2(t.area), tone: 'secondary' },
          ];
  const caption =
    law === 'sines'
      ? 'All three are equal: the law of sines.'
      : law === 'cosines'
        ? `The last term, 2ab·cos C, corrects Pythagoras. It shrinks to zero when C is 90°, and adds instead of taking away when C is wider than 90°. Here C is ${d1(t.angleC)}.`
        : 'Both ways give the same area: half of two sides times the sine of the angle between them.';
  return (
    <div className="zen-trig">
      <Plane
        f={f}
        svgRef={svgRef}
        label={`A triangle with sides a ${n2(t.a)}, b ${n2(t.b)}, c ${n2(t.c)} and angles A ${d1(t.angleA)}, B ${d1(t.angleB)}, C ${d1(t.angleC)}`}
      >
        {law === 'area' && <Path f={f} points={[v.A, v.B, v.C]} closed className="zen-trig__fill" />}
        <Segment f={f} from={v.B} to={v.C} className="zen-trig__line zen-trig__sin" />
        <Segment f={f} from={v.A} to={v.C} className="zen-trig__line zen-trig__cos" />
        <Segment f={f} from={v.A} to={v.B} className="zen-trig__line zen-trig__tan" />
        <CornerAngle f={f} at={v.A} p={v.B} q={v.C} deg={t.angleA} />
        <CornerAngle f={f} at={v.B} p={v.A} q={v.C} deg={t.angleB} />
        <CornerAngle f={f} at={v.C} p={v.A} q={v.B} deg={t.angleC} strong={law !== 'sines'} />
        <SideName f={f} from={v.B} to={v.C} away={v.A} text={`a = ${n2(t.a)}`} className="zen-trig__label zen-trig__label--sin" />
        <SideName f={f} from={v.A} to={v.C} away={v.B} text={`b = ${n2(t.b)}`} className="zen-trig__label zen-trig__label--cos" />
        <SideName f={f} from={v.A} to={v.B} away={v.C} text={`c = ${n2(t.c)}`} className="zen-trig__label zen-trig__label--tan" />
        <VertexName f={f} at={v.A} g={g}>A</VertexName>
        <VertexName f={f} at={v.B} g={g}>B</VertexName>
        <VertexName f={f} at={v.C} g={g}>C</VertexName>
        <Handle f={f} at={v.A} label="Vertex A" drag={dragA} onKey={step('A')} r={6} />
        <Handle f={f} at={v.B} label="Vertex B" drag={dragB} onKey={step('B')} r={6} />
        <Handle f={f} at={v.C} label="Vertex C" drag={dragC} onKey={step('C')} r={6} />
      </Plane>
      <div className="zen-trig__controls">
        <Segmented items={LAW_NAMES} index={LAWS.indexOf(law)} onChange={(i) => setLaw(LAWS[i])} label="What to show" />
        <Readouts items={lawItems} />
        <Readouts
          live={false}
          items={[
            { label: 'A', value: d1(t.angleA), tone: 4 },
            { label: 'B', value: d1(t.angleB), tone: 4 },
            { label: 'C', value: d1(t.angleC), tone: 4 },
            { label: 'A + B + C', value: d1(t.angleA + t.angleB + t.angleC), tone: 'secondary' },
          ]}
        />
        <Text role="caption" tone="secondary" aria-live="polite">
          {caption} The three angles always add up to 180°.
        </Text>
      </div>
    </div>
  );
}

function AmbiguousCase({ sideA: sideAProp, onSideA, ssaAngle = 35, ssaSide = 5 }: GeneralTriangleProps) {
  const [aRaw, setSideA] = useControlled(sideAProp, onSideA, 3.5);
  const a = Math.round(clamp(aRaw, SIDE_A.min, SIDE_A.max) * 10) / 10;
  const b = ssaSide;
  const angA = ssaAngle;
  const f = frame(600, 300, [-0.5, 9.5], [-0.5, 4.5]);
  const A = { x: 0, y: 0 };
  const C = { x: b * Math.cos(toRadians(angA)), y: b * Math.sin(toRadians(angA)) };
  const height = C.y; // b·sin A: how far C sits above the base
  const fit = ssa(a, b, angA);
  // Each angle B that fits gives angle C, then side c by the law of sines, then the corners.
  const triangles = fit.angleB.map((angB) => {
    const angC = 180 - angA - angB;
    const c = (a * Math.sin(toRadians(angC))) / Math.sin(toRadians(angA));
    return { angB, c, ...placeSAS(b, angA, c) };
  });
  const count = fit.count;
  const fits = count === 0 ? 'No triangle fits' : count === 1 ? 'One triangle fits' : 'Two triangles fit';
  const say =
    count === 2
      ? 'Two triangles fit the same side, side, angle.'
      : count === 1
        ? 'One triangle fits: side a reaches the base only once to the right of A.'
        : 'No triangle fits: side a is shorter than the height b·sin A, so it never reaches the base.';
  const names = ['B', 'B′'];
  const first = triangles[0];
  return (
    <div className="zen-trig">
      <Plane f={f} label={`Side, side, angle: angle A ${angA}°, side b ${b}, side a ${a.toFixed(1)}. ${fits}.`}>
        <Segment f={f} from={{ x: -0.3, y: 0 }} to={{ x: 9.3, y: 0 }} className="zen-trig__quiet" />
        <Circle f={f} cx={C.x} cy={C.y} r={a} className="zen-trig__quiet" />
        <Segment f={f} from={{ x: C.x, y: 0 }} to={C} className="zen-trig__quiet" />
        {triangles[1] && <Path f={f} points={[A, triangles[1].B, C]} closed className="zen-trig__second-fill" />}
        {triangles.map((t, i) => (
          <g key={i}>
            <Segment f={f} from={A} to={t.B} className={i === 1 ? 'zen-trig__line zen-trig__second' : 'zen-trig__line zen-trig__tan'} />
            <Segment f={f} from={C} to={t.B} className={i === 1 ? 'zen-trig__line zen-trig__second' : 'zen-trig__line zen-trig__sin'} />
            <VertexName gap={17} f={f} at={t.B} g={{ x: t.B.x, y: 1 }} className={i === 1 ? 'zen-trig__label zen-trig__label--second' : 'zen-trig__label'}>
              {names[i]}
            </VertexName>
          </g>
        ))}
        <Segment f={f} from={A} to={C} className="zen-trig__line zen-trig__cos" />
        <CornerAngle f={f} at={A} p={{ x: 1, y: 0 }} q={C} deg={angA} strong />
        <SideName f={f} from={A} to={C} away={{ x: 9, y: 0 }} text={`b = ${b}`} className="zen-trig__label zen-trig__label--cos" />
        {first ? (
          <SideName f={f} from={C} to={first.B} away={A} text={`a = ${a.toFixed(1)}`} className="zen-trig__label zen-trig__label--sin" />
        ) : (
          <Label f={f} at={{ x: C.x, y: C.y - a }} dx={8} dy={14} className="zen-trig__label zen-trig__label--sin">
            {`a = ${a.toFixed(1)}`}
          </Label>
        )}
        <text
          x={f.x(C.x) - 6}
          y={f.y(C.y / 2)}
          transform={`rotate(-90 ${f.x(C.x) - 6} ${f.y(C.y / 2)})`}
          textAnchor="middle"
          className="zen-trig__label"
        >
          {`height ${n2(height)}`}
        </text>
        <VertexName gap={17} f={f} at={A} g={{ x: 3, y: 1 }}>A</VertexName>
        <VertexName gap={17} f={f} at={C} g={{ x: C.x, y: 0 }}>C</VertexName>
      </Plane>
      <div className="zen-trig__controls">
        <Stack direction="row" gap={2} wrap align="center">
          {STOPS.map((s) => (
            <Button key={s.label} label={s.label} chosen={a === s.a} pressed={a === s.a} onPress={() => setSideA(s.a)} />
          ))}
        </Stack>
        <Slider param={SIDE_A} value={a} onChange={(next) => setSideA(Math.round(next * 10) / 10)} orientation="horizontal" layout="row" length="auto" name="Side a" display={a.toFixed(1)} />
        <Readouts
          items={[
            { label: 'Angle A', value: `${angA}°`, tone: 4 },
            { label: 'Side b', value: String(b), tone: 2 },
            { label: 'Side a', value: a.toFixed(1), tone: 1 },
            { label: 'Height b·sin A', value: n2(height), tone: 'secondary' },
            { label: 'Triangles', value: String(count), tone: 'secondary' },
            ...triangles.map((t, i) => ({ label: `Angle ${names[i]}`, value: d1(t.angB), tone: (i === 1 ? 5 : 'secondary') as 5 | 'secondary' })),
          ]}
        />
        <Text role="caption" tone="secondary" aria-live="polite">
          {say} Side a swings from C like a door; the dashed circle shows everywhere its end can reach.
        </Text>
      </div>
    </div>
  );
}
