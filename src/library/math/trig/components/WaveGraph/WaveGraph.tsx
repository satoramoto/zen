import { useEffect, type ReactNode } from 'react';
import { Button } from '../../../../components/Button/Button';
import type { Param } from '../../../../components/Param/param';
import type { ParamKeyStep } from '../../../../components/Param/paramGesture';
import { Slider } from '../../../../components/Slider/Slider';
import { Stack } from '../../../../primitives/Stack/Stack';
import { Text } from '../../../../primitives/Text/Text';
import { useClock } from '../../../fourier/useClock';
import { useControlled } from '../../../fourier/useControlled';
import { neatPi, radiansText, TAU, toDegrees } from '../../model/angle';
import { angularFrequency, fit, inverseAt, poles, RESTRICTED, sampleWave, waveAt, type DataPoint, type Wave, type WaveKind } from '../../model/wave';
import { Circle, clamp, frame, Handle, Label, Path, Plane, Readouts, Segment, useDrag, type Frame } from '../../parts';
import '../../trig.css';

/** Data mode: real-world points (hours, metres) a reader fits a curve to. */
export interface WaveData {
  points: DataPoint[];
  /** How far from the curve a point may sit and still count as fitted. */
  band: number;
  /** The x unit, as a word ("hour"). */
  xLabel?: string;
  /** The y unit ("m"). */
  yLabel?: string;
  domain: [number, number];
  yRange: [number, number];
}

export interface WaveGraphProps {
  /** Sine, cosine or tangent. Default 'sin'. */
  kind?: WaveKind;
  onKind?(kind: WaveKind): void;
  /** A, 0 to 3 (in data mode, up to half the y range). Default 1. */
  amplitude?: number;
  onAmplitude?(a: number): void;
  /** The period in x units (radians outside data mode), 0.5 to 4π. Default 2π. */
  period?: number;
  onPeriod?(p: number): void;
  /** The phase shift C, −2π to 2π (across the domain in data mode). Default 0. */
  shift?: number;
  onShift?(c: number): void;
  /** The midline D, −3 to 3. Default 0. */
  midline?: number;
  onMidline?(d: number): void;
  /** The x range drawn. Default [−0.25, 4π + 0.25]: two periods at the default. */
  domain?: [number, number];
  /** The y range drawn. Default [−3.5, 3.5], grown to fit the wave. */
  yRange?: [number, number];
  /** Draw the generating circle to the left, its point joined to the curve at x = time. Default false. */
  circle?: boolean;
  /** Where along the wave the circle's point is: an x value. */
  time?: number;
  onTime?(x: number): void;
  /** Inverse mode: the restricted domain, the inverse as the mirror image in y = x. Default false. */
  inverse?: boolean;
  /** Data mode: points to fit, in their own units. */
  data?: WaveData;
  /** A target curve the reader tries to match. */
  target?: Wave;
}

const NAMES: Record<WaveKind, string> = { sin: 'sine', cos: 'cosine', tan: 'tangent' };
const CURVE: Record<WaveKind, string> = { sin: 'zen-trig__curve', cos: 'zen-trig__curve zen-trig__curve--cos', tan: 'zen-trig__curve zen-trig__curve--tan' };
const DEFAULT_DOMAIN: [number, number] = [-0.25, 2 * TAU + 0.25];

/** A minus sign, not a hyphen. */
const minus = (s: string) => s.replace(/^-/, '−');
const num = (v: number, digits: number) => minus((Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits));

/** An x value in radians as a neat multiple of π when it is one ("2π", "π/2"), else a decimal. */
function piText(v: number): string {
  const deg = toDegrees(v);
  return neatPi(deg) ? radiansText(deg) : num(v, 2);
}

/** The largest of 1, 2, 5 × 10ⁿ not above `raw`. */
function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p;
}

/** Arrow keys step to the next multiple of `step` (Shift: `big` steps), from wherever the value is. */
function gridKeys(step: number, big: number, exact: (k: number) => number): ParamKeyStep {
  return (key, value) => {
    const dir = key.key === 'ArrowRight' || key.key === 'ArrowUp' ? 1 : key.key === 'ArrowLeft' || key.key === 'ArrowDown' ? -1 : 0;
    if (dir === 0) return undefined;
    const k = Math.round(value / step) + dir * (key.shiftKey ? big : 1);
    return exact(k);
  };
}
const piGrid = (k: number) => (k * Math.PI) / 12;
const decimalGrid = (step: number) => (k: number) => Number((k * step).toFixed(6));

/** A frame moved right by `dx` pixels, for a graph drawn beside the circle (its `fromPx` reads whole-drawing pixels). */
function offset(f: Frame, dx: number): Frame {
  return { ...f, fromPx: (px, py) => f.fromPx(px - dx, py) };
}

/**
 * The graph of y = A·sin(B(x − C)) + D (or cosine, or tangent): the curve, its midline, an
 * amplitude bracket and one period bracket, with sliders for A, the period, C and D. On request
 * the generating circle beside it, its point joined to the curve; an inverse mode with the
 * restricted domain and the mirror image in y = x; and a data mode, points to fit within a band.
 */
export function WaveGraph(props: WaveGraphProps) {
  const [kind, setKind] = useControlled(props.kind, props.onKind, 'sin' as WaveKind);
  if (props.inverse) return <InverseGraph kind={kind} setKind={setKind} />;
  return <Graph {...props} kind={kind} setKind={setKind} />;
}

function KindButtons({ kind, setKind }: { kind: WaveKind; setKind(k: WaveKind): void }) {
  return (
    <Stack direction="row" gap={1} wrap align="center">
      {(['sin', 'cos', 'tan'] as const).map((k) => (
        <Button key={k} label={k} compact chosen={k === kind} onPress={() => setKind(k)} />
      ))}
    </Stack>
  );
}

function Graph({
  kind,
  setKind,
  amplitude: aProp,
  onAmplitude,
  period: pProp,
  onPeriod,
  shift: cProp,
  onShift,
  midline: dProp,
  onMidline,
  domain: domainProp,
  yRange: yRangeProp,
  circle = false,
  time: tProp,
  onTime,
  data,
  target,
}: WaveGraphProps & { kind: WaveKind; setKind(k: WaveKind): void }) {
  const radians = !data;
  const [d0, d1] = data?.domain ?? domainProp ?? DEFAULT_DOMAIN;
  const xSpan = d1 - d0;
  const yData = data?.yRange;
  const xStep = radians ? Math.PI / 12 : niceStep(xSpan / 100);
  const ySpanData = yData ? yData[1] - yData[0] : 6;
  const yStep = radians ? 0.1 : niceStep(ySpanData / 50);
  const xGrid = radians ? piGrid : decimalGrid(xStep);
  const yGridK = decimalGrid(yStep);

  const AMP: Param = { kind: 'float', min: 0, max: yData ? ySpanData / 2 : 3, defaultValue: 1, name: 'Amplitude' };
  const PERIOD: Param = radians ? { kind: 'float', min: 0.5, max: 2 * TAU, defaultValue: TAU, name: 'Period' } : { kind: 'float', min: xSpan / 10, max: xSpan, defaultValue: xSpan / 2, name: 'Period' };
  const SHIFT: Param = radians ? { kind: 'float', min: -TAU, max: TAU, defaultValue: 0, name: 'Phase shift' } : { kind: 'float', min: d0, max: d1, defaultValue: d0, name: 'Phase shift' };
  const MID: Param = yData ? { kind: 'float', min: yData[0], max: yData[1], defaultValue: (yData[0] + yData[1]) / 2, name: 'Midline' } : { kind: 'float', min: -3, max: 3, defaultValue: 0, name: 'Midline' };

  const [A, setA] = useControlled(aProp, onAmplitude, 1);
  const [P, setP] = useControlled(pProp, onPeriod, radians ? TAU : xSpan / 2);
  const [C, setC] = useControlled(cProp, onShift, radians ? 0 : d0);
  const [D, setD] = useControlled(dProp, onMidline, yData ? MID.defaultValue : 0);
  const [timeRaw, setTime] = useControlled(tProp, onTime, xGrid(Math.round((d0 + xSpan / 4) / xStep)));
  const time = clamp(timeRaw, d0, d1);
  const w: Wave = { kind, amplitude: A, period: P, shift: C, midline: D };
  const B = angularFrequency(w);

  // The drawing: the graph, and the circle to its left when asked (not for tangent).
  const H = 320;
  const GW = 640;
  const [y0, y1] = yData ?? yRangeProp ?? (kind === 'tan' ? [-3.5, 3.5] : [Math.min(-3.5, D - A - 0.5), Math.max(3.5, D + A + 0.5)]);
  const showCircle = circle && kind !== 'tan';
  const ky = H / (y1 - y0);
  const CW = showCircle ? Math.round(Math.max(H * 0.9, 2 * A * ky + 40)) : 0;
  const g = frame(GW, H, [d0, d1], [y0, y1]);
  const whole = frame(CW + GW, H, [0, 1], [0, 1]);
  const cf = frame(CW || 1, H, [-(CW || 1) / 2 / ky, (CW || 1) / 2 / ky], [y0, y1]);
  const drag = useDrag(offset(g, CW), (m) => setTime(Math.round(clamp(m.x, d0, d1) * 100) / 100));

  // Play: the clock walks the point across the domain.
  const clock = useClock(8, false);
  useEffect(() => {
    if (clock.playing) setTime(d0 + clock.t * xSpan);
  }, [clock.t, clock.playing]);

  const xUnit = data?.xLabel;
  const yUnit = data?.yLabel;
  const plural = (u?: string) => (u && u.length > 2 ? `${u}s` : u ?? '');
  const xText = (v: number) => (radians ? piText(v) : `${num(v, 1)}${xUnit ? ` ${plural(xUnit)}` : ''}`);
  const yDigits = radians ? 1 : 2;
  const yText = (v: number) => `${num(v, yDigits)}${yUnit ? ` ${yUnit}` : ''}`;

  // Ticks: multiples of π/2 (doubled until they're far enough apart) in radians; nice numbers otherwise.
  let tickStep = radians ? Math.PI / 2 : niceStep(xSpan / 8);
  while (tickStep * g.kx < 48) tickStep *= 2;
  const xTicks: number[] = [];
  for (let v = Math.ceil(d0 / tickStep) * tickStep; v <= d1 + 1e-9; v += tickStep) xTicks.push(v);
  const yTickStep = radians ? 1 : niceStep((y1 - y0) / 6);
  const yTicks: number[] = [];
  for (let v = Math.ceil(y0 / yTickStep) * yTickStep; v <= y1 + 1e-9; v += yTickStep) yTicks.push(Math.round(v * 1e6) / 1e6);

  // Peaks, for the brackets: sine peaks a quarter period after its start, cosine at its start.
  const firstPeak = C + (kind === 'sin' ? P / 4 : 0);
  let peak = firstPeak + Math.ceil((d0 - firstPeak) / P) * P;
  if (peak + P > d1 && peak - P >= d0) peak -= P;
  const peakY = A + D;
  // Tangent's period runs between two of its zeros (one branch); its bracket sits at the top.
  const tanStart = C + Math.ceil((d0 - C) / P) * P;
  const bracketFrom = kind === 'tan' ? tanStart : peak;
  const bracketPx = kind === 'tan' ? 22 : Math.max(22, g.y(peakY) - 14);
  // The midline's label sits above the line where the curve dips below it.
  const dipStart0 = kind === 'tan' ? C - P / 2 : peak + P / 4;
  let dipStart = dipStart0 - Math.floor((dipStart0 - d0) / P) * P;
  if (dipStart < d0) dipStart += P;
  if (dipStart + 110 / g.kx > d1) dipStart = d0;

  const runs = sampleWave(w, d0, d1);
  const asymptotes = poles(w, d0, d1);
  const waves = Math.floor(xSpan / P + 1e-9);
  const at = { x: time, y: waveAt(w, time) };
  const theta = B * (time - C) + (kind === 'cos' ? Math.PI / 2 : 0);
  const pointHeight = D + A * Math.sin(theta);
  const fitted = data ? fit(w, data.points, data.band) : undefined;
  const inside = data && fitted ? fitted.residuals.filter((r) => Math.abs(r) <= data.band + 1e-9).length : 0;

  const equation = `y = ${num(A, yDigits)} · ${kind}(${num(B, 2)} (x ${C < 0 ? '+' : '−'} ${num(Math.abs(C), 2)})) ${D < 0 ? '−' : '+'} ${num(Math.abs(D), yDigits)}`;
  const label =
    `The graph of ${equation}: ${NAMES[kind]} with amplitude ${yText(A)}, period ${xText(P)}, phase shift ${xText(C)} and midline y = ${yText(D)}; ` +
    `${waves} full wave${waves === 1 ? '' : 's'} in view` +
    (asymptotes.length ? `; it breaks at x = ${asymptotes.map(xText).join(', ')}, where it has vertical asymptotes` : '') +
    (data ? `; ${data.points.length} data points, ${inside} within the band` : '') +
    (target ? '; a dashed target curve to match' : '') +
    (showCircle ? `; the circle's point is at x = ${xText(time)}, height ${num(pointHeight, 2)}` : '');

  const xKeys = gridKeys(xStep, radians ? 3 : 10, xGrid);
  const yKeys = gridKeys(yStep, radians ? 5 : 10, yGridK);
  const graph: ReactNode = (
    <g transform={`translate(${CW} 0)`}>
      {xTicks.map((v) => (
        <line key={`gx${v}`} x1={g.x(v)} y1={0} x2={g.x(v)} y2={H} className="zen-trig__grid" />
      ))}
      {yTicks.map((v) => (
        <line key={`gy${v}`} x1={0} y1={g.y(v)} x2={GW} y2={g.y(v)} className="zen-trig__grid" />
      ))}
      {y0 <= 0 && y1 >= 0 && <line x1={0} y1={g.y(0)} x2={GW} y2={g.y(0)} className="zen-trig__axis" />}
      {d0 <= 0 && d1 >= 0 && <line x1={g.x(0)} y1={0} x2={g.x(0)} y2={H} className="zen-trig__axis" />}
      {xTicks.map((v) => (
        <Label key={`tx${v}`} f={g} at={{ x: v, y: y0 }} dy={-5} anchor="middle" className="zen-trig__label">
          {radians ? piText(v) : num(v, Number.isInteger(tickStep) ? 0 : 1)}
        </Label>
      ))}
      {yTicks
        .filter((v) => v !== 0 || !radians)
        .filter((v) => g.y(v) > 14 && g.y(v) < H - 18)
        .map((v) => (
          <Label key={`ty${v}`} f={g} at={{ x: d0, y: v }} dx={4} dy={-3} className="zen-trig__label">
            {num(v, Number.isInteger(yTickStep) ? 0 : 1)}
          </Label>
        ))}
      {xUnit && (
        <Label f={g} at={{ x: d1, y: y0 }} dx={-4} dy={-18} anchor="end" className="zen-trig__label">
          x: {xUnit}
        </Label>
      )}
      {yUnit && (
        <Label f={g} at={{ x: d0, y: y1 }} dx={4} dy={12} className="zen-trig__label">
          y: {yUnit}
        </Label>
      )}
      {data &&
        runs.map((run, i) => (
          <Path key={`band${i}`} f={g} closed points={[...run.map((p) => ({ x: p.x, y: p.y + data.band })), ...[...run].reverse().map((p) => ({ x: p.x, y: p.y - data.band }))]} className="zen-trig__band" />
        ))}
      {target && sampleWave(target, d0, d1).map((run, i) => <Path key={`t${i}`} f={g} points={run} className="zen-trig__curve zen-trig__curve--target" />)}
      {asymptotes.map((x) => (
        <Segment key={`as${x}`} f={g} from={{ x, y: y0 }} to={{ x, y: y1 }} className="zen-trig__quiet" />
      ))}
      {/* The midline, and its label above the line where the curve is below it. */}
      <Segment f={g} from={{ x: d0, y: D }} to={{ x: d1, y: D }} className="zen-trig__quiet" />
      <Label f={g} at={{ x: dipStart, y: D }} dx={6} dy={-6} className="zen-trig__label">
        midline y = {num(D, yDigits)}
      </Label>
      {/* The curve: solid up to the circle's point and faint after it, or solid throughout. */}
      {showCircle ? (
        <>
          {sampleWave(w, d0, time).map((run, i) => (
            <Path key={`s${i}`} f={g} points={run} className={CURVE[kind]} />
          ))}
          {sampleWave(w, time, d1).map((run, i) => (
            <Path key={`r${i}`} f={g} points={run} className="zen-trig__curve zen-trig__curve--ghost" />
          ))}
        </>
      ) : (
        runs.map((run, i) => <Path key={`c${i}`} f={g} points={run} className={CURVE[kind]} />)
      )}
      {/* The amplitude: midline to a peak. */}
      {kind !== 'tan' && A >= 0.05 && (
        <g>
          <Segment f={g} from={{ x: peak, y: D }} to={{ x: peak, y: peakY }} className="zen-trig__line zen-trig__second" />
          <Label f={g} at={{ x: peak, y: D }} dx={5} dy={-5} className="zen-trig__label zen-trig__label--second">
            A = {num(A, yDigits)}
          </Label>
        </g>
      )}
      {/* One period: peak to peak (tangent: zero to zero), just above the curve. */}
      <g>
        <line x1={g.x(bracketFrom)} y1={bracketPx} x2={g.x(bracketFrom + P)} y2={bracketPx} className="zen-trig__line zen-trig__angle" />
        <line x1={g.x(bracketFrom)} y1={bracketPx - 4} x2={g.x(bracketFrom)} y2={bracketPx + 4} className="zen-trig__line zen-trig__angle" />
        <line x1={g.x(bracketFrom + P)} y1={bracketPx - 4} x2={g.x(bracketFrom + P)} y2={bracketPx + 4} className="zen-trig__line zen-trig__angle" />
        <text x={g.x(bracketFrom + P / 2)} y={bracketPx - 6} textAnchor="middle" className="zen-trig__label zen-trig__label--angle">
          period = {xText(P)}
        </text>
      </g>
      {data?.points.map((p, i) => {
        const ok = fitted ? Math.abs(fitted.residuals[i]) <= data.band + 1e-9 : false;
        return (
          <g key={`p${i}`}>
            <circle cx={g.x(p.x)} cy={g.y(p.y)} r={4} className="zen-trig__dot zen-trig__dot--data" />
            {!ok && <circle cx={g.x(p.x)} cy={g.y(p.y)} r={8} className="zen-trig__quiet" />}
          </g>
        );
      })}
    </g>
  );

  // The circle: radius A about (0, D) in its own frame, the point at angle θ, joined to the curve.
  const centre = { x: 0, y: D };
  const point = { x: A * Math.cos(theta), y: pointHeight };
  const circleNode: ReactNode = showCircle && (
    <g>
      <Segment f={cf} from={{ x: cf.x0, y: D }} to={{ x: cf.x1, y: D }} className="zen-trig__quiet" />
      <Circle f={cf} cx={0} cy={D} r={A} />
      <Segment f={cf} from={centre} to={point} className="zen-trig__line" />
      <Segment f={cf} from={{ x: point.x, y: D }} to={point} className="zen-trig__line zen-trig__sin" />
      <circle cx={cf.x(point.x)} cy={cf.y(point.y)} r={4} className="zen-trig__dot zen-trig__dot--sin" />
      {/* The join: the point's height carried across to the curve at x = time. */}
      <line x1={cf.x(point.x)} y1={cf.y(point.y)} x2={CW + g.x(time)} y2={g.y(at.y)} className="zen-trig__quiet" />
      <Label f={cf} at={{ x: 0, y: D - A }} dy={16} anchor="middle" className="zen-trig__label">
        radius A
      </Label>
    </g>
  );

  return (
    <div className="zen-trig">
      <Plane f={whole} svgRef={drag.ref} label={label}>
        {circleNode}
        {graph}
        {showCircle && (
          <g transform={`translate(${CW} 0)`}>
            <Handle
              f={g}
              at={at}
              label="Point on the wave"
              value={time}
              min={d0}
              max={d1}
              valueText={`x = ${xText(time)}, y = ${num(at.y, 2)}`}
              drag={drag}
              onKey={(dir, big) => {
                const k = Math.round(time / xStep) + (dir === 'right' || dir === 'up' ? 1 : -1) * (big ? (radians ? 3 : 10) : 1);
                setTime(clamp(xGrid(k), d0, d1));
              }}
            />
          </g>
        )}
      </Plane>
      <div className="zen-trig__controls">
        <Stack direction="row" gap={3} wrap align="center">
          {!data && <KindButtons kind={kind} setKind={setKind} />}
          {showCircle && <Button label={clock.playing ? 'Pause' : 'Play'} on={clock.playing} onPress={clock.toggle} />}
        </Stack>
        <Slider param={AMP} value={A} onChange={setA} keyStep={yKeys} orientation="horizontal" layout="row" length="auto" name="Amplitude" display={yText(A)} />
        <Slider param={PERIOD} value={P} onChange={setP} keyStep={xKeys} orientation="horizontal" layout="row" length="auto" name="Period" display={xText(P)} />
        <Slider param={SHIFT} value={C} onChange={setC} keyStep={xKeys} orientation="horizontal" layout="row" length="auto" name="Phase shift" display={xText(C)} />
        <Slider param={MID} value={D} onChange={setD} keyStep={yKeys} orientation="horizontal" layout="row" length="auto" name="Midline" display={yText(D)} />
        <Readouts
          items={[
            { label: 'Equation', value: equation, tone: kind === 'sin' ? 1 : kind === 'cos' ? 2 : 3 },
            { label: 'B', value: num(B, 2), tone: 'secondary' },
            { label: 'Period', value: xText(P), tone: 4 },
            ...(showCircle
              ? [
                  { label: 'Point height', value: num(pointHeight, 2), tone: 1 as const },
                  { label: 'Curve at x', value: num(at.y, 2), tone: 'secondary' as const },
                ]
              : []),
            ...(fitted ? [{ label: 'Largest miss', value: yText(fitted.worst), tone: 5 as const }] : []),
          ]}
        />
        <Text role="caption" tone="secondary" aria-live="polite">
          {data && fitted
            ? fitted.within
              ? 'Within the band at every point: this curve fits the data.'
              : `${inside} of ${data.points.length} points within the band. Move the sliders until the curve passes close to every point.`
            : `The period is ${xText(P)}, so ${waves} full wave${waves === 1 ? '' : 's'} fit in the window.${kind === 'tan' ? ' Tangent breaks where cosine is zero: the dashed lines are its asymptotes.' : ''}`}
          {showCircle && ` The point on the circle is at height ${num(pointHeight, 2)}, the same as the curve at x = ${xText(time)}.`}
        </Text>
      </div>
    </div>
  );
}

const INVERSE_NAMES: Record<WaveKind, string> = { sin: 'arcsin', cos: 'arccos', tan: 'arctan' };

/** Inverse mode: the plain function faint, its restricted domain solid, and the inverse mirrored in y = x. */
function InverseGraph({ kind, setKind }: { kind: WaveKind; setKind(k: WaveKind): void }) {
  const f = frame(360, 360, [-2.5, 4], [-2.5, 4]);
  const plain: Wave = { kind, amplitude: 1, period: kind === 'tan' ? Math.PI : TAU, shift: 0, midline: 0 };
  const [r0, r1] = RESTRICTED[kind];
  const eps = kind === 'tan' ? 0.02 : 0;
  const ghost = sampleWave(plain, f.x0, f.x1);
  const solid = sampleWave(plain, r0 + eps, r1 - eps);
  const inv: { x: number; y: number }[] = [];
  for (let i = 0; i <= 400; i++) {
    const x = f.x0 + ((f.x1 - f.x0) * i) / 400;
    const y = inverseAt(kind, x);
    if (Number.isFinite(y)) inv.push({ x, y });
  }
  // sin and cos's inverse ends exactly at ±1.
  if (kind !== 'tan') {
    if (inv[0]?.x !== -1) inv.unshift({ x: -1, y: inverseAt(kind, -1) });
    if (inv[inv.length - 1]?.x !== 1) inv.push({ x: 1, y: inverseAt(kind, 1) });
  }
  const domainText = `${radiansText(toDegrees(r0))} to ${radiansText(toDegrees(r1))}`;
  const name = INVERSE_NAMES[kind];
  const ticks = [-2, -1, 1, 2, 3];
  // Where to name each curve, clear of the line y = x.
  const fnLabel = kind === 'sin' ? { at: { x: r1, y: 1 }, dx: 6, dy: 14, anchor: 'start' as const } : kind === 'cos' ? { at: { x: r1, y: -1 }, dx: 6, dy: 4, anchor: 'start' as const } : { at: { x: 1.2, y: Math.tan(1.2) }, dx: 8, dy: 4, anchor: 'start' as const };
  const invLabel = kind === 'sin' ? { at: { x: 1, y: Math.PI / 2 }, dx: -8, dy: -6, anchor: 'end' as const } : kind === 'cos' ? { at: { x: -1, y: Math.PI }, dx: 8, dy: -4, anchor: 'start' as const } : { at: { x: f.x1, y: Math.atan(f.x1) }, dx: -6, dy: 16, anchor: 'end' as const };
  return (
    <div className="zen-trig">
      <Plane f={f} label={`The ${NAMES[kind]} curve, faint, with its restricted domain ${domainText} drawn solid; there it takes each value once, so it has an inverse, ${name}, drawn as its mirror image in the line y = x`}>
        {[-2, -1, 0, 1, 2, 3, 4].map((v) => (
          <g key={v}>
            <line x1={f.x(v)} y1={0} x2={f.x(v)} y2={f.height} className="zen-trig__grid" />
            <line x1={0} y1={f.y(v)} x2={f.width} y2={f.y(v)} className="zen-trig__grid" />
          </g>
        ))}
        <line x1={0} y1={f.y(0)} x2={f.width} y2={f.y(0)} className="zen-trig__axis" />
        <line x1={f.x(0)} y1={0} x2={f.x(0)} y2={f.height} className="zen-trig__axis" />
        {ticks.map((v) => (
          <g key={`t${v}`}>
            <Label f={f} at={{ x: v, y: 0 }} dx={-3} dy={13} anchor="end" className="zen-trig__label">
              {num(v, 0)}
            </Label>
            <Label f={f} at={{ x: 0, y: v }} dx={-4} dy={-3} anchor="end" className="zen-trig__label">
              {num(v, 0)}
            </Label>
          </g>
        ))}
        <Segment f={f} from={{ x: f.x0, y: f.y0 }} to={{ x: f.x1, y: f.y1 }} className="zen-trig__quiet" />
        <Label f={f} at={{ x: 3.6, y: 3.6 }} dx={-8} dy={-2} anchor="end" className="zen-trig__label">
          y = x
        </Label>
        {kind === 'tan' &&
          [r0, r1].map((x) => <Segment key={`a${x}`} f={f} from={{ x, y: f.y0 }} to={{ x, y: f.y1 }} className="zen-trig__quiet" />)}
        {ghost.map((run, i) => (
          <Path key={`g${i}`} f={f} points={run} className="zen-trig__curve zen-trig__curve--ghost" />
        ))}
        {solid.map((run, i) => (
          <Path key={`s${i}`} f={f} points={run} className={CURVE[kind]} />
        ))}
        <Path f={f} points={inv} className="zen-trig__line zen-trig__second" />
        {/* The restricted domain, marked along the bottom. */}
        <Segment f={f} from={{ x: r0, y: f.y0 + 0.08 }} to={{ x: r1, y: f.y0 + 0.08 }} className="zen-trig__line zen-trig__second" />
        <Label f={f} at={{ x: (r0 + r1) / 2, y: f.y0 + 0.08 }} dy={-6} anchor="middle" className="zen-trig__label zen-trig__label--second">
          domain {domainText}
        </Label>
        <Label f={f} at={fnLabel.at} dx={fnLabel.dx} dy={fnLabel.dy} anchor={fnLabel.anchor} className={`zen-trig__label zen-trig__label--${kind}`}>
          {kind}
        </Label>
        <Label f={f} at={invLabel.at} dx={invLabel.dx} dy={invLabel.dy} anchor={invLabel.anchor} className="zen-trig__label zen-trig__label--second">
          {name}
        </Label>
      </Plane>
      <div className="zen-trig__controls">
        <KindButtons kind={kind} setKind={setKind} />
        <Text role="caption" tone="secondary" aria-live="polite">
          On {domainText}, {NAMES[kind]} takes each value only once, so it can be undone. {name} is its mirror image in the line y = x: it takes the {NAMES[kind]} value back to the angle.
        </Text>
      </div>
    </div>
  );
}
