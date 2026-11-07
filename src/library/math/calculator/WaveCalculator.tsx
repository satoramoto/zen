import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Coordinates, Line, Mafs, Point, useTransformContext, vec } from 'mafs';
import { RelationshipHandle } from '../explore/RelationshipHandle';
import { compileExpressions, ExpressionError, functionNames, sampleCurve, type CurvePoint, type Equations, type FunctionName } from './expression';
import 'mafs/core.css';
import './WaveCalculator.css';

const TAU = 2 * Math.PI;
const COLORS = { f: 'var(--hue-1)', g: 'var(--hue-3)', h: 'var(--hue-2)' };
export const calculatorPresets = {
  interference: { label: 'Interference', hint: 'Different wavelengths. One shared clock.', equations: { f: 'a*sin(b*x-t)', g: 'c*sin(d*x-t+p)', h: 'f(x)+g(x)' }, values: { a: 1, b: 1, c: 1, d: 1.3, p: .8 } },
  standing: { label: 'Standing wave', hint: 'Opposite directions. The sum stands still and breathes.', equations: { f: 'a*sin(b*x-t)', g: 'a*sin(b*x+t)', h: 'f(x)+g(x)' }, values: { a: 1, b: 1 } },
  cancellation: { label: 'Cancellation', hint: 'An exact opposite. Change f and both waves follow.', equations: { f: 'a*sin(b*x-t)', g: '-f(x)', h: 'f(x)+g(x)' }, values: { a: 1, b: 1 } },
  beats: { label: 'Beating', hint: 'Nearby frequencies create a slowly changing envelope.', equations: { f: 'a*sin(b*x-b*t)', g: 'a*sin(c*x-c*t)', h: 'f(x)+g(x)' }, values: { a: 1, b: 3, c: 3.3 } },
  composition: { label: 'Build on a function', hint: 'g samples f at twice the rate. Edit f to change them both.', equations: { f: 'a*sin(x-t)', g: 'f(2*x)/2', h: 'f(x)+g(x)' }, values: { a: 1 } },
} satisfies Record<string, { label: string; hint: string; equations: Equations; values: Record<string, number> }>;
export interface WaveCalculatorProps { preset?: keyof typeof calculatorPresets }
const clamp = (value: number, min = -4, max = 4) => Math.max(min, Math.min(max, value));
const nice = (value: number) => Number.isFinite(value) ? (Math.abs(value) < .0005 ? 0 : value).toFixed(3) : 'undefined';

function Curve({ paths, color, ghost = false, result = false }: { paths: CurvePoint[][]; color: string; ghost?: boolean; result?: boolean }) {
  const { viewTransform, userTransform } = useTransformContext();
  return <g>
    {paths.map((points, index) => <path key={index} className="zen-calculator__curve" style={{ fill: 'none', stroke: color, strokeWidth: ghost ? 1.5 : result ? 3 : 1.8, opacity: ghost ? .4 : result ? 1 : .7, strokeDasharray: ghost ? '5 5' : undefined }} d={points.map((point, i) => {
      const [x, y] = vec.transform(vec.transform(point, userTransform), viewTransform);
      return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ')} />)}
  </g>;
}
/** A quantity is a scrubbable object: pointer dragging and keyboard stepping share the same value. */
function Parameter({ name, value, onChange }: { name: string; value: number; onChange(value: number): void }) {
  const drag = useRef<{ x: number; value: number } | null>(null);
  return <button className="zen-calculator__parameter" role="slider" aria-label={`Parameter ${name}`} aria-valuemin={-4} aria-valuemax={4} aria-valuenow={value} aria-valuetext={value.toFixed(2)} aria-description="Drag left or right. Arrow keys adjust; Shift makes larger steps. Home and End select limits."
    onPointerDown={event => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, value }; }}
    onPointerMove={event => { if (drag.current) onChange(clamp(Math.round((drag.current.value + (event.clientX - drag.current.x) / 60) * 100) / 100)); }}
    onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
    onKeyDown={event => {
      const direction = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 0;
      if (!direction && !['Home', 'End'].includes(event.key)) return;
      event.preventDefault(); onChange(event.key === 'Home' ? -4 : event.key === 'End' ? 4 : clamp(Math.round((value + direction * (event.shiftKey ? .5 : .05)) * 100) / 100));
    }}><span>{name}</span><strong>{value.toFixed(2)}</strong><small>↔</small><i style={{ inlineSize: `${(value + 4) / 8 * 100}%` }} /></button>;
}

/** Editable expression workspace with linked curves, bounded evaluation and direct parameter manipulation. */
export function WaveCalculator({ preset = 'interference' }: WaveCalculatorProps) {
  const initial = calculatorPresets[preset];
  const [draft, setDraft] = useState<Equations>(initial.equations);
  const [program, setProgram] = useState(() => compileExpressions(initial.equations));
  const [parameters, setParameters] = useState<Record<string, number>>(initial.values);
  const [error, setError] = useState<ExpressionError | null>(null);
  const [activePreset, setActivePreset] = useState<string>(preset);
  const [time, setTime] = useState(0), [playing, setPlaying] = useState(false);
  const [probe, setProbe] = useState(Math.PI / 2), [height, setHeight] = useState(3.5);
  const [pinned, setPinned] = useState<{ program: typeof program; parameters: Record<string, number>; time: number } | null>(null);
  const root = useRef<HTMLElement>(null), id = useId();
  const load = (key: keyof typeof calculatorPresets) => {
    const next = calculatorPresets[key]; setDraft(next.equations); setProgram(compileExpressions(next.equations));
    setParameters({ ...next.values }); setError(null); setPlaying(false); setTime(0); setActivePreset(key); setPinned(null); setHeight(3.5); setProbe(Math.PI / 2);
  };
  useEffect(() => { load(preset); }, [preset]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0, last = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      if (now - last >= 1000 / 30) { const dt = Math.min((now - last) / 1000, .1); last = now; setTime(t => Math.min(20, t + dt)); }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [playing]);
  useEffect(() => { if (time >= 20) setPlaying(false); }, [time]);
  useEffect(() => {
    const visibility = () => { if (document.hidden) setPlaying(false); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setPlaying(false); });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const edit = (name: FunctionName, value: string) => {
    const next = { ...draft, [name]: value }; setDraft(next); setPlaying(false); setActivePreset('');
    try {
      const compiled = compileExpressions(next); setProgram(compiled); setError(null);
      setParameters(previous => Object.fromEntries(compiled.parameters.map(key => [key, previous[key] ?? 1])));
    } catch (problem) { setError(problem instanceof ExpressionError ? problem : new ExpressionError('Could not read this expression.')); }
  };
  const curves = useMemo(() => Object.fromEntries(functionNames.map(name => [name, sampleCurve(x => program.evaluate(name, x, parameters, time))])) as Record<FunctionName, CurvePoint[][]>, [program, parameters, time]);
  const comparison = useMemo(() => pinned ? sampleCurve(x => pinned.program.evaluate('h', x, pinned.parameters, pinned.time)) : [], [pinned]);
  const readouts = functionNames.map(name => program.evaluate(name, probe, parameters, time));
  const setParameter = (name: string, value: number) => { setPlaying(false); setParameters(previous => ({ ...previous, [name]: value })); };
  const fit = () => {
    const largest = Math.max(1, ...Object.values(curves).flat(2).map(point => Math.abs(point[1])));
    setHeight(clamp(largest * 1.2, 1, 12));
  };
  return <section ref={root} className="zen-calculator" aria-labelledby={`${id}-title`} data-playing={playing} data-valid={!error}>
    <header className="zen-calculator__header"><div><p className="zen-calculator__eyebrow">Math / a living workspace</p><h1 id={`${id}-title`}>Make waves. Find relationships.</h1><p>Edit an equation. Drag a number. Follow what changes.</p></div><span className="zen-calculator__badge">2D · live expressions</span></header>
    <nav className="zen-calculator__presets" aria-label="Starting relationships">{Object.entries(calculatorPresets).map(([key, item]) => <button key={key} aria-pressed={activePreset === key} onClick={() => load(key as keyof typeof calculatorPresets)}>{item.label}</button>)}</nav>
    <div className="zen-calculator__workspace">
      <aside className="zen-calculator__equations" aria-label="Equations">
        <div className="zen-calculator__section-label">01 / Define a relationship</div>
        {functionNames.map((name, index) => <div key={name} className="zen-calculator__expression" style={{ '--curve-color': COLORS[name] } as CSSProperties}>
          <label htmlFor={`${id}-${name}`}><span>{name}(x)</span><small>{index < 2 ? `wave ${index + 1}` : 'result'}</small></label>
          <div className="zen-calculator__entry"><span>=</span><input id={`${id}-${name}`} aria-label={`${name}(x) expression`} value={draft[name]} onChange={event => edit(name, event.target.value)} spellCheck={false} autoCapitalize="off" autoComplete="off" aria-invalid={!!error && (!error.equation || error.equation === name)} aria-describedby={error ? `${id}-error` : `${id}-syntax`} /></div>
          <output aria-label={`${name} at probe`}>{nice(readouts[index])}</output><small>at x = {probe.toFixed(2)}</small>
        </div>)}
        {error && <div className="zen-calculator__error" id={`${id}-error`} role="alert"><strong>{error.equation ? `${error.equation}(x): ` : ''}{error.message}</strong><span>Drawing the last valid equations. Fix the expression or <button onClick={() => { setDraft(program.equations); setError(null); }}>restore them</button>.</span></div>}
        <details className="zen-calculator__help"><summary>What can I write?</summary><p id={`${id}-syntax`}>Use + − * / ^ and parentheses. Functions: sin, cos, tan, abs, sqrt, exp, log (natural), floor, ceil. Angles are radians.</p><p>x is position; t is time. pi and e are constants. Other single letters become parameters (−4 to 4). Call f(x), g(x), or h(x) without circular references.</p><p>Try g(x) = f(2*x)/2. The drawing updates as soon as all expressions are valid.</p></details>
      </aside>
      <div className="zen-calculator__visual">
        <div className="zen-calculator__plot-heading"><span>02 / Follow the connection</span><button onClick={fit}>Fit height</button></div>
        <div className="zen-calculator__legend">{functionNames.map(name => <span key={name} style={{ color: COLORS[name] }}>{name}(x){name === 'h' ? ' · result' : ''}</span>)}{pinned && <span>··· pinned result</span>}</div>
        <div className="zen-calculator__plot" aria-label="Linked function graph" data-result-points={curves.h.reduce((count, path) => count + path.length, 0)}>
          <Mafs height={400} viewBox={{ x: [-TAU, TAU], y: [-height, height], padding: .3 }} preserveAspectRatio={false} pan={false} zoom={false}>
            <Coordinates.Cartesian xAxis={{ lines: Math.PI, labels: x => `${(x / Math.PI).toFixed(0)}π` }} yAxis={{ lines: 1 }} />
            {pinned && <Curve paths={comparison} color="var(--text-3)" ghost />}
            {functionNames.map(name => <Curve key={name} paths={curves[name]} color={COLORS[name]} result={name === 'h'} />)}
            <Line.Segment point1={[probe, -height]} point2={[probe, height]} color="var(--text-3)" opacity={.5} style="dashed" />
            {readouts.map((value, index) => Number.isFinite(value) && Math.abs(value) <= height ? <Point key={index} x={probe} y={value} color={COLORS[functionNames[index]]} /> : null)}
            <RelationshipHandle label="Graph probe" quantity={{ label: 'Position', initial: Math.PI / 2, min: -TAU, max: TAU, step: .05 }} value={probe} onValue={value => setProbe(clamp(value, -TAU, TAU))} onEngage={() => setPlaying(false)} onHighlight={() => {}} point={[probe, 0]} constrain={([x]) => [clamp(x, -TAU, TAU), 0]} onMove={([x]) => setProbe(x)} color="var(--text-1)" />
          </Mafs>
        </div>
        <div className="zen-calculator__transport"><button className="zen-calculator__play" disabled={!!error} onClick={() => { if (time >= 20) setTime(0); setPlaying(value => !value); }}>{playing ? 'Pause motion' : 'Play motion'}</button><label>t <input aria-label="Time" type="range" min={0} max={20} step={.01} value={time} onChange={event => { setPlaying(false); setTime(Number(event.target.value)); }} /><output>{time.toFixed(2)}</output></label><button aria-pressed={!!pinned} onClick={() => setPinned(pinned ? null : { program, parameters: { ...parameters }, time })}>{pinned ? 'Unpin result' : 'Pin result'}</button></div>
        <p className="zen-calculator__hint">{activePreset ? calculatorPresets[activePreset as keyof typeof calculatorPresets].hint : 'Your relationship. Each curve uses the same parameters and clock.'} <span>Drag the probe to compare values at the same x.</span></p>
      </div>
    </div>
    <div className="zen-calculator__quantities"><div><span className="zen-calculator__section-label">03 / Play with the quantities</span><p>Drag a number sideways.<br />Every dependent curve follows.</p></div><div className="zen-calculator__parameters">{program.parameters.map(name => <Parameter key={name} name={name} value={parameters[name] ?? 1} onChange={value => setParameter(name, value)} />)}{!program.parameters.length && <p>Add a letter to an equation, such as a*sin(x), to create a parameter.</p>}</div></div>
    <footer>Window: −2π ≤ x ≤ 2π · Time: 0–20 · Radians<span>Samples within |y| ≤ 12; gaps at undefined values. Very steep or fine detail may be omitted.</span></footer>
  </section>;
}
