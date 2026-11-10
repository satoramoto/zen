import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Coordinates, Line, Mafs, Point, useTransformContext, vec } from 'mafs';
import { RelationshipHandle } from '../../../explore/components/RelationshipHandle/RelationshipHandle';
import { compileExpressions, ExpressionError, functionNames, sampleCurve, type CurvePoint, type Equations, type FunctionName } from '../../expression';
import { EquationInput, EquationColorKey } from '../EquationInput/EquationInput';
import { TermExplorer } from '../TermExplorer/TermExplorer';
import { expressionTerms, matchingTerms, transformTerm, type ExpressionTerm, type TermAction } from '../../terms';
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

function Curve({ paths, color, ghost = false, result = false, muted = false }: { paths: CurvePoint[][]; color: string; ghost?: boolean; result?: boolean; muted?: boolean }) {
  const { viewTransform, userTransform } = useTransformContext();
  return <g opacity={muted ? .2 : 1}>
    {paths.map((points, index) => <path key={index} className="zen-calculator__curve" style={{ fill: 'none', stroke: color, strokeWidth: ghost ? 1.5 : result ? 3 : 1.8, opacity: ghost ? .4 : result ? 1 : .7, strokeDasharray: ghost ? '5 5' : undefined }} d={points.map((point, i) => {
      const [x, y] = vec.transform(vec.transform(point, userTransform), viewTransform);
      return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ')} />)}
  </g>;
}
/** A quantity is a scrubbable object: pointer dragging and keyboard stepping share the same value. */
function Parameter({ name, value, onChange, active, onActivate, label, meaning }: { name: string; value: number; onChange(value: number): void; active: boolean; onActivate(): void; label?: string; meaning?: string }) {
  const drag = useRef<{ x: number; value: number } | null>(null);
  return <button className="zen-calculator__parameter" data-parameter={name} data-active={active} onFocus={onActivate} role="slider" aria-label={label ?? `Parameter ${name}`} aria-valuemin={-4} aria-valuemax={4} aria-valuenow={value} aria-valuetext={value.toFixed(2)} aria-description="Drag left or right. Arrow keys adjust; Shift makes larger steps. Home and End select limits."
    onPointerDown={event => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, value }; }}
    onPointerMove={event => { if (drag.current) onChange(clamp(Math.round((drag.current.value + (event.clientX - drag.current.x) / 60) * 100) / 100)); }}
    onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
    onKeyDown={event => {
      const direction = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 0;
      if (!direction && !['Home', 'End'].includes(event.key)) return;
      event.preventDefault(); onChange(event.key === 'Home' ? -4 : event.key === 'End' ? 4 : clamp(Math.round((value + direction * (event.shiftKey ? .5 : .05)) * 100) / 100));
    }}><span>{name}{meaning && <small className="zen-calculator__meaning">{meaning}</small>}</span><strong>{value.toFixed(2)}</strong><small>↔</small><i style={{ inlineSize: `${(value + 4) / 8 * 100}%` }} /></button>;
}

/** Editable expression workspace with linked curves, bounded evaluation and direct parameter manipulation. */
export function WaveCalculator({ preset = 'interference' }: WaveCalculatorProps) {
  const initial = calculatorPresets[preset];
  const [draft, setDraft] = useState<Equations>(initial.equations);
  const [program, setProgram] = useState(() => compileExpressions(initial.equations));
  const [parameters, setParameters] = useState<Record<string, number>>(initial.values);
  const [error, setError] = useState<ExpressionError | null>(null);
  const [activeFunction, setActiveFunction] = useState<FunctionName>('f');
  const [activeParameter, setActiveParameter] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>(preset);
  const [time, setTime] = useState(0), [playing, setPlaying] = useState(false);
  const [probe, setProbe] = useState(Math.PI / 2), [height, setHeight] = useState(3.5);
  const [pinned, setPinned] = useState<{ program: typeof program; parameters: Record<string, number>; time: number } | null>(null);
  const [exploring, setExploring] = useState<FunctionName | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<ExpressionTerm | null>(null);
  const [candidates, setCandidates] = useState<ExpressionTerm[]>([]);
  const [termAction, setTermAction] = useState<TermAction | null>(null);
  const [undo, setUndo] = useState<{ equations: Equations; preset: string }[]>([]);
  const closeExploration = () => { setExploring(null); setSelectedTerm(null); setCandidates([]); setTermAction(null); };
  const resetActions = () => { closeExploration(); setUndo([]); };
  const root = useRef<HTMLElement>(null), id = useId();
  const load = (key: keyof typeof calculatorPresets) => {
    resetActions();
    const next = calculatorPresets[key]; setDraft(next.equations); setProgram(compileExpressions(next.equations));
    setParameters({ ...next.values }); setError(null); setPlaying(false); setTime(0); setActivePreset(key); setPinned(null); setHeight(3.5); setProbe(Math.PI / 2); setActiveParameter(null);
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
    resetActions();
    const next = { ...draft, [name]: value }; setDraft(next); setPlaying(false); setActivePreset('');
    try {
      const compiled = compileExpressions(next); setProgram(compiled); setError(null);
      setParameters(previous => ({ ...previous, ...Object.fromEntries(compiled.parameters.map(key => [key, previous[key] ?? 1])) }));
      setActiveParameter(previous => previous && compiled.parameters.includes(previous) ? previous : null);
      return true;
    } catch (problem) { setError(problem instanceof ExpressionError ? problem : new ExpressionError('Could not read this expression.')); return false; }
  };
  const shape = (action: 'wave' | 'fade' | 'half' | 'opposite' | 'combine') => {
    if (action === 'combine') { edit('h', 'f(x)+g(x)'); return; }
    const source = draft[activeFunction];
    if (action === 'wave') { edit(activeFunction, 'a*sin(b*x-t)'); return; }
    if (action === 'fade') {
      const letter = ['k', 'm', 'n', 'q', 'r', 's'].find(name => !program.parameters.includes(name));
      if (!letter || program.parameters.length >= 8) { setError(new ExpressionError('Remove a quantity before adding an envelope.')); return; }
      if (edit(activeFunction, `(${source})*exp(-${letter}*abs(x))`)) {
        setParameters(previous => ({ ...previous, [letter]: .35 })); setActiveParameter(letter);
      }
    } else edit(activeFunction, action === 'half' ? `(${source})/2` : `-(${source})`);
  };
  const chooseTerm = (term: ExpressionTerm) => { setSelectedTerm(term); setTermAction(null); setPlaying(false); };
  const explore = (name: FunctionName, selection?: string) => {
    if (error) return;
    try {
      const matches = selection ? matchingTerms(draft[name], selection) : [expressionTerms(draft[name])[0]];
      if (!matches.length) return;
      setExploring(name); setActiveFunction(name); setPlaying(false); setTermAction(null);
      setCandidates(matches.length > 1 ? matches : []); setSelectedTerm(matches.length === 1 ? matches[0] : null);
    } catch { /* Incomplete selections do not replace an existing complete selection. */ }
  };
  const proposal = useMemo(() => {
    if (!exploring || !selectedTerm || !termAction) return null;
    try {
      const source = transformTerm(draft[exploring], selectedTerm.path, termAction);
      return { source, program: compileExpressions({ ...draft, [exploring]: source }), problem: undefined };
    } catch (problem) { return { source: undefined, program: undefined, problem: problem instanceof Error ? problem.message : 'This change is unavailable.' }; }
  }, [exploring, selectedTerm, termAction, draft]);
  const previewCurves = useMemo(() => proposal?.program ? Object.fromEntries(functionNames.map(name => [name, sampleCurve(x => proposal.program!.evaluate(name, x, parameters, time))])) as Record<FunctionName, CurvePoint[][]> : null, [proposal, parameters, time]);
  const applyTerm = () => {
    if (!proposal?.program) return;
    setUndo(previous => [...previous.slice(-19), { equations: draft, preset: activePreset }]);
    setDraft(proposal.program.equations); setProgram(proposal.program); setActivePreset(''); closeExploration();
  };
  const undoTerm = () => {
    const previous = undo.at(-1); if (!previous) return;
    setDraft(previous.equations); setProgram(compileExpressions(previous.equations)); setActivePreset(previous.preset);
    setUndo(undo.slice(0, -1)); setPlaying(false); closeExploration();
  };
  const selectParameter = (name: string) => {
    if (!program.parameters.includes(name)) return;
    setActiveParameter(name);
  };
  const curves = useMemo(() => Object.fromEntries(functionNames.map(name => [name, sampleCurve(x => program.evaluate(name, x, parameters, time))])) as Record<FunctionName, CurvePoint[][]>, [program, parameters, time]);
  const comparison = useMemo(() => pinned ? sampleCurve(x => pinned.program.evaluate('h', x, pinned.parameters, pinned.time)) : [], [pinned]);
  const readouts = functionNames.map(name => program.evaluate(name, probe, parameters, time));
  const setParameter = (name: string, value: number) => { setPlaying(false); setParameters(previous => ({ ...previous, [name]: value })); };
  const meanings: Record<string, string> = activePreset ? {
    a: 'Height', b: 'Frequency', c: activePreset === 'interference' ? 'Height' : 'Frequency', d: 'Frequency', p: 'Phase shift',
  } : {};
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
        <EquationColorKey />
        <p className="zen-calculator__invitation">Select part of an equation to discover what you can change. Or tap <strong>Explore parts</strong> below.</p>
        {!!undo.length && <button onClick={undoTerm}>Undo transformation</button>}
        <div className="zen-calculator__builder"><span>Shape {activeFunction}(x)</span><div><button onClick={() => shape('wave')}>Sine wave</button><button disabled={!!error} onClick={() => shape('fade')}>Fade from center</button><button disabled={!!error} onClick={() => shape('half')}>Half as tall</button><button disabled={!!error} onClick={() => shape('opposite')}>Flip over</button><button onClick={() => shape('combine')}>Combine waves</button></div><small>Tap an equation to choose it. Actions change its expression.</small></div>
        {functionNames.map((name, index) => <div key={name} className="zen-calculator__expression" data-selected={activeFunction === name} style={{ '--curve-color': COLORS[name] } as CSSProperties}>
          <label htmlFor={`${id}-${name}`}><span>{name}(x)</span><small>{index < 2 ? `wave ${index + 1}` : 'result'}</small></label>
          <div className="zen-calculator__entry"><EquationInput id={`${id}-${name}`} label={`${name}(x) expression`} activeParameter={activeParameter} showColorKey={false} value={draft[name]} onChange={value => edit(name, value)} onFocus={() => setActiveFunction(name)} onParameter={selectParameter} onTermSelection={source => explore(name, source)} invalid={!!error && (!error.equation || error.equation === name)} /></div>
          <button className="zen-calculator__explore" disabled={!!error} aria-expanded={exploring === name} aria-label={`Explore parts of ${name}`} onClick={() => exploring === name ? closeExploration() : explore(name)}>✦ Explore parts</button>
          {exploring === name && <TermExplorer source={draft[name]} selected={selectedTerm} candidates={candidates} action={termAction} proposed={proposal?.source} problem={proposal?.problem} onSelect={chooseTerm} onPreview={setTermAction} onApply={applyTerm} onClose={closeExploration} onViewGraph={() => root.current?.querySelector('.zen-calculator__visual')?.scrollIntoView({ block: 'start' })} />}
          <div className="zen-calculator__linked-parameters">{program.parametersByFunction[name].map(parameter => <button key={parameter} aria-label={`Explore ${parameter} in ${name}`} aria-pressed={activeParameter === parameter} title={meanings[parameter]} onClick={() => { setActiveFunction(name); selectParameter(parameter); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-inline="${name}"] [data-parameter="${parameter}"]`)?.focus()); }}>{parameter} <span>{(parameters[parameter] ?? 1).toFixed(2)}</span></button>)}</div>
          {activeFunction === name && activeParameter && program.parametersByFunction[name].includes(activeParameter) && <div data-inline={name} className="zen-calculator__inline-quantity"><Parameter name={activeParameter} label={`Adjust ${activeParameter} in ${name}`} meaning={meanings[activeParameter]} value={parameters[activeParameter] ?? 1} active onActivate={() => selectParameter(activeParameter)} onChange={value => setParameter(activeParameter, value)} /></div>}
          <output aria-label={`${name} at probe`}>{nice(readouts[index])}</output><small>at x = {probe.toFixed(2)}</small>
        </div>)}
        {error && <div className="zen-calculator__error" id={`${id}-error`} role="alert"><strong>{error.equation ? `${error.equation}(x): ` : ''}{error.message}</strong><span>Drawing the last valid equations. Fix the expression or <button onClick={() => { setDraft(program.equations); setError(null); }}>restore them</button>.</span></div>}
        <details className="zen-calculator__help"><summary>What can I write?</summary><p id={`${id}-syntax`}>Use + − * / ^ and parentheses. Functions: sin, cos, tan, abs, sqrt, exp, ln (natural), log (base ten), floor, ceil. Plain-text log() remains natural logarithm. Angles are radians.</p><p>x is position; t is time. pi and e are constants. Type / for a fraction, ^ for a power, and sqrt for a root. Other single letters become parameters (−4 to 4). Call f(x), g(x), or h(x) without circular references.</p><p>Try g(x) = f(2*x)/2. The drawing updates as soon as all expressions are valid.</p></details>
      </aside>
      <div className="zen-calculator__visual">
        <div className="zen-calculator__plot-heading"><span>02 / Follow the connection</span><div>{previewCurves && <button onClick={() => root.current?.querySelector('.zen-term-explorer')?.scrollIntoView({ block: 'center' })}>Back to selected part ↑</button>}<button onClick={fit}>Fit height</button></div></div>
        <div className="zen-calculator__legend">{functionNames.map(name => <span key={name} style={{ color: COLORS[name] }}>{name}(x){name === 'h' ? ' · result' : ''}</span>)}{pinned && <span>··· pinned result</span>}{previewCurves && <span>– – proposal · not applied</span>}</div>
        <div className="zen-calculator__plot" aria-label="Linked function graph" data-result-points={curves.h.reduce((count, path) => count + path.length, 0)}>
          <Mafs height={400} viewBox={{ x: [-TAU, TAU], y: [-height, height], padding: .3 }} preserveAspectRatio={false} pan={false} zoom={false}>
            <Coordinates.Cartesian xAxis={{ lines: Math.PI, labels: x => `${(x / Math.PI).toFixed(0)}π` }} yAxis={{ lines: 1 }} />
            {pinned && <Curve paths={comparison} color="var(--text-3)" ghost />}
            {functionNames.map(name => <Curve key={name} paths={curves[name]} color={COLORS[name]} result={name === 'h'} muted={!!activeParameter && !program.parametersByFunction[name].includes(activeParameter)} />)}
            {previewCurves && functionNames.map(name => <Curve key={`preview-${name}`} paths={previewCurves[name]} color={COLORS[name]} ghost />)}
            <Line.Segment point1={[probe, -height]} point2={[probe, height]} color="var(--text-3)" opacity={.5} style="dashed" />
            {readouts.map((value, index) => Number.isFinite(value) && Math.abs(value) <= height ? <Point key={index} x={probe} y={value} color={COLORS[functionNames[index]]} /> : null)}
            <RelationshipHandle label="Graph probe" quantity={{ label: 'Position', initial: Math.PI / 2, min: -TAU, max: TAU, step: .05 }} value={probe} onValue={value => setProbe(clamp(value, -TAU, TAU))} onEngage={() => setPlaying(false)} onHighlight={() => {}} point={[probe, 0]} constrain={([x]) => [clamp(x, -TAU, TAU), 0]} onMove={([x]) => setProbe(x)} color="var(--text-1)" />
          </Mafs>
        </div>
        <div className="zen-calculator__transport"><button className="zen-calculator__play" disabled={!!error || !!exploring} onClick={() => { if (time >= 20) setTime(0); setPlaying(value => !value); }}>{playing ? 'Pause motion' : 'Play motion'}</button><label>t <input aria-label="Time" type="range" min={0} max={20} step={.01} value={time} onChange={event => { setPlaying(false); setTime(Number(event.target.value)); }} /><output>{time.toFixed(2)}</output></label><button aria-pressed={!!pinned} onClick={() => setPinned(pinned ? null : { program, parameters: { ...parameters }, time })}>{pinned ? 'Unpin result' : 'Pin result'}</button></div>
        <p className="zen-calculator__hint">{activePreset ? calculatorPresets[activePreset as keyof typeof calculatorPresets].hint : 'Your relationship. Each curve uses the same parameters and clock.'} <span>Drag the probe to compare values at the same x.</span></p>
      </div>
    </div>
    <div className="zen-calculator__quantities"><div><span className="zen-calculator__section-label">03 / Play with the quantities</span><p>Drag a number sideways.<br />Every dependent curve follows.</p>{activeParameter && <button className="zen-calculator__clear-highlight" onClick={() => setActiveParameter(null)}>Show all curves</button>}</div><div className="zen-calculator__parameters">{program.parameters.map(name => <Parameter key={name} name={name} value={parameters[name] ?? 1} active={activeParameter === name} meaning={meanings[name]} onActivate={() => selectParameter(name)} onChange={value => setParameter(name, value)} />)}{!program.parameters.length && <p>Add a letter to an equation, such as a*sin(x), to create a parameter.</p>}</div></div>
    <footer>Window: −2π ≤ x ≤ 2π · Time: 0–20 · Radians<span>Samples within |y| ≤ 12; gaps at undefined values. Very steep or fine detail may be omitted.</span></footer>
  </section>;
}
