import { useEffect, useId, useRef, useState } from 'react';
import { Circle, Line, Mafs, Plot, Point, Text, Vector } from 'mafs';
import { RelationshipHandle } from '../RelationshipHandle/RelationshipHandle';
import { orbitTime, sineRelationship, TAU, type SineQuantity } from '../../relationship';
import { useRelationship } from '../../useRelationship';
import 'mafs/core.css';
import './SineExplorer.css';

export interface SineExplorerProps {
  /** Starting quantities; changing these also updates the live specimen in Storybook. */
  amplitude?: number;
  frequency?: number;
  time?: number;
}
const C = { radius: 'var(--hue-1)', height: 'var(--hue-2)', angle: 'var(--hue-3)', ink: 'var(--text-1)', quiet: 'var(--text-3)', grid: 'var(--border)', ghost: 'var(--text-3)' };
const PRESETS = [
  { label: 'One turn, one wave', caption: 'Follow the same height from circle to wave.', amplitude: 1, frequency: 1, time: 0 },
  { label: 'Make it taller', caption: 'Change the radius. What stays the same?', amplitude: 1.5, frequency: 1, time: Math.PI / 4 },
  { label: 'Twice around', caption: 'Two turns fit into the same stretch of time.', amplitude: 1, frequency: 2, time: Math.PI / 4 },
];
const STOPS = [
  { label: 'Start', turn: '0', height: 'Level with the center.' },
  { label: 'Top', turn: '¼', height: 'At the top: both heights are +1.' },
  { label: 'Across', turn: '½', height: 'Across the circle: both heights return to zero.' },
  { label: 'Bottom', turn: '¾', height: 'At the bottom: both heights are −1.' },
  { label: 'Back', turn: '1', height: 'One full turn makes one complete wave.' },
];
const nice = (value: number) => (Math.abs(value) < .005 ? 0 : value).toFixed(2);

/** React-only acceptance scene for the shared relationship model and Mafs adapter. */
export function SineExplorer({ amplitude = 1, frequency = 1, time = 0 }: SineExplorerProps) {
  const relationship = useRelationship(sineRelationship, { amplitude, frequency, time });
  const { sources: s, values: v, set, restore, pinned } = relationship;
  const [exploring, setExploring] = useState(amplitude !== 1 || frequency !== 1);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<SineQuantity | null>(null);
  const [prompt, setPrompt] = useState(PRESETS[0].caption);
  const [compact, setCompact] = useState(false);
  const [trail, setTrail] = useState(true);
  const root = useRef<HTMLElement>(null);
  const titleId = useId();
  const helpId = useId();
  useEffect(() => { restore({ amplitude, frequency, time }); setPlaying(false); setExploring(amplitude !== 1 || frequency !== 1); }, [amplitude, frequency, time, restore]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 680));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last !== null) {
        const delta = Math.min((now - last) / 1000, .05);
        set('time', previous => (previous + delta * .65) % TAU);
      }
      last = now; frame = requestAnimationFrame(tick);
    };
    // Explicit play only. Pause when the tab leaves view; never catch up unseen elapsed time.
    const visibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', visibility);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); };
  }, [playing, set]);
  const engage = () => setPlaying(false);
  const edit = (key: SineQuantity, value: number) => { engage(); set(key, value); };
  const highlight = (key: SineQuantity) => (enabled: boolean) => setActive(enabled ? key : null);
  const handle = (key: SineQuantity) => ({ quantity: sineRelationship.quantities[key], value: s[key], onValue: (value: number) => edit(key, value), onEngage: engage, onHighlight: highlight(key) });
  const stopIndex = Math.round(s.time / (Math.PI / 2));
  const distanceToStop = Math.abs(s.time - stopIndex * Math.PI / 2);
  const atStop = distanceToStop < .001;
  const nearStop = distanceToStop < .12;
  const focusQuantity = (label: string) => {
    setExploring(true);
    requestAnimationFrame(() => root.current?.querySelector<SVGElement>(`[aria-label="${label}"]`)?.focus());
  };
  const circleX = compact ? 0 : -3.2;
  const circle = <>
    <Line.Segment point1={[circleX - 1.95, 0]} point2={[circleX + 1.95, 0]} color={C.grid} />
    <Line.Segment point1={[circleX, -1.9]} point2={[circleX, 1.9]} color={C.grid} />
    {pinned && <Circle center={[circleX, 0]} radius={pinned.amplitude} color={C.ghost} fillOpacity={0} strokeStyle="dashed" strokeOpacity={.45} />}
    <Circle center={[circleX, 0]} radius={s.amplitude} color={C.radius} fillOpacity={.025} strokeOpacity={active === 'amplitude' ? 1 : .5} weight={1.5} />
    <Plot.Parametric xy={angle => [circleX + .32 * Math.cos(angle), .32 * Math.sin(angle)]} domain={[0, v.angle % TAU || .0001]} color={C.angle} weight={2} />
    <Line.Segment point1={[circleX, 0]} point2={[circleX + v.x, v.y]} color={C.radius} weight={2} />
    <Line.Segment point1={[circleX + v.x, 0]} point2={[circleX + v.x, v.y]} color={C.height} weight={3} />
    <Line.Segment point1={[circleX, v.y]} point2={[circleX + v.x, v.y]} color={C.height} opacity={.35} style="dashed" />
    <Point x={circleX} y={0} color={C.quiet} />
    {!exploring && <>
      <Plot.Parametric xy={angle => [circleX + 1.48 * Math.cos(angle), 1.48 * Math.sin(angle)]} domain={[.25, .8]} color={C.ink} weight={1.5} />
      <Vector tail={[circleX + 1.48 * Math.cos(.76), 1.48 * Math.sin(.76)]} tip={[circleX + 1.48 * Math.cos(.9), 1.48 * Math.sin(.9)]} color={C.ink} weight={1.5} />
      {STOPS.slice(0, 4).map((stop, index) => {
        const angle = index * Math.PI / 2;
        const current = nearStop && stopIndex % 4 === index;
        return <g key={stop.turn} data-orbit-stop={index} data-current={current}>
          <Point x={circleX + Math.cos(angle)} y={Math.sin(angle)} color={current ? C.height : C.quiet} opacity={current ? 1 : .5} />
          <Text x={circleX + 1.23 * Math.cos(angle)} y={1.23 * Math.sin(angle) + (index === 0 ? -.2 : 0)} size={13} color={current ? C.height : C.quiet}>{index === 0 && stopIndex === 4 ? '1' : stop.turn}</Text>
        </g>;
      })}
    </>}
    <Text x={circleX - .14} y={-1.96} color={C.quiet} size={12}>{exploring ? 'drag the point · stretch the radius' : 'follow the point counterclockwise'}</Text>
    {exploring && <>
    <Line.Segment point1={[circleX - 1.85, s.amplitude]} point2={[circleX, s.amplitude]} color={C.radius} opacity={.4} style="dashed" />
    <Text x={circleX - 1.85} y={s.amplitude + .24} size={11} color={C.radius}>radius</Text>
    <RelationshipHandle {...handle('amplitude')} label="Circle radius" point={[circleX - 1.85, s.amplitude]} color={C.radius} constrain={([, y]) => [circleX - 1.85, Math.max(.35, Math.min(1.65, y))]} onMove={([, y]) => edit('amplitude', y)} />
    </>}
    <RelationshipHandle {...handle('time')} label="Orbit position" point={[circleX + v.x, v.y]} color={C.height} constrain={([x, y]) => { const angle = Math.atan2(y, x - circleX); return [circleX + s.amplitude * Math.cos(angle), s.amplitude * Math.sin(angle)]; }} onMove={([x, y]) => edit('time', orbitTime(x - circleX, y, s))} />
  </>;
  const wave = <>
    {[0, Math.PI / 2, Math.PI, Math.PI * 1.5, TAU].map((x, i) => <g key={x}>
      <Line.Segment point1={[x, -1.8]} point2={[x, 1.8]} color={C.grid} opacity={.65} />
      <Text x={x} y={-1.96} color={C.quiet} size={12}>{['0', 'π/2', 'π', '3π/2', '2π'][i]}</Text>
    </g>)}
    {[-1, 1].map(y => <Line.Segment key={y} point1={[0, y]} point2={[TAU, y]} color={C.grid} opacity={.45} style="dashed" />)}
    <Line.Segment point1={[0, 0]} point2={[TAU + .15, 0]} color={C.quiet} opacity={.6} />
    {pinned && <Plot.OfX y={t => pinned.amplitude * Math.sin(pinned.frequency * t)} domain={[0, TAU]} color={C.ghost} opacity={.5} style="dashed" weight={1.5} />}
    <Plot.OfX y={t => s.amplitude * Math.sin(s.frequency * t)} domain={[0, TAU]} color={C.height} opacity={trail ? .4 : .9} weight={2} />
    {trail && s.time > .0001 && <Plot.OfX y={t => s.amplitude * Math.sin(s.frequency * t)} domain={[0, s.time]} color={C.height} weight={3} />}
    <Line.Segment point1={[s.time, -1.8]} point2={[s.time, 1.8]} color={C.angle} opacity={.5} style="dashed" />
    <Line.Segment point1={[s.time, 0]} point2={[s.time, v.y]} color={C.height} weight={3} />
    {exploring && <>
    <Line.Segment point1={[Math.PI / (2 * s.frequency), s.amplitude]} point2={[Math.PI / (2 * s.frequency), 1.83]} color={C.angle} opacity={.4} style="dashed" />
    <Text x={Math.PI / (2 * s.frequency) + .3} y={1.83} attach="e" size={11} color={C.angle}>spacing</Text>
    <RelationshipHandle {...handle('frequency')} label="Wave frequency" point={[Math.PI / (2 * s.frequency), 1.83]} color={C.angle} constrain={([x]) => [Math.max(Math.PI / 6, Math.min(Math.PI, x)), 1.83]} onMove={([x]) => edit('frequency', Math.PI / (2 * x))} />
    </>}
    {!exploring && STOPS.map((stop, index) => {
      const x = index * Math.PI / 2, y = Math.sin(x), current = nearStop && stopIndex === index;
      return <g key={stop.turn} data-wave-stop={index} data-current={current}>
        <Point x={x} y={y} color={current ? C.height : C.quiet} opacity={current ? 1 : .5} />
        <Text x={x} y={y + (index === 3 ? -.3 : .3)} size={13} color={current ? C.height : C.quiet}>{stop.turn}</Text>
      </g>;
    })}
    {!exploring && <Vector tail={[TAU - .65, -.55]} tip={[TAU, -.55]} color={C.ink} weight={1.5} />}
    <RelationshipHandle {...handle('time')} label="Wave position" point={[s.time, v.y]} color={C.height} constrain={([x]) => { const t = Math.max(0, Math.min(TAU, x)); return [t, s.amplitude * Math.sin(s.frequency * t)]; }} onMove={([x]) => edit('time', x)} />
  </>;
  const plotProps = { pan: false, zoom: false } as const;
  const selectPreset = (preset: typeof PRESETS[number]) => { engage(); restore(preset); setExploring(preset.frequency !== 1 || preset.amplitude !== 1); setPrompt(preset.caption); };
  const pinnedDiff = pinned ? v.y - sineRelationship.derive({ ...pinned, time: s.time }).y : null;
  return <section ref={root} className="zen-sine" aria-labelledby={titleId} data-active={active ?? ''} data-playing={playing} data-mode={exploring ? 'explore' : 'follow'}>
    <header className="zen-sine__header">
      <div><p className="zen-sine__eyebrow">Math playground <span>/</span> Relationships · 01</p><h1 id={titleId}>A circle, unfolding.</h1><p className="zen-sine__intro">The point turns counterclockwise. Time moves to the right.<br />The connection is their height: it always matches.</p></div>
      <span className="zen-sine__badge"><span /> An explorable connection</span>
    </header>
    <div className="zen-sine__modes" role="group" aria-label="Exploration mode">
      <button aria-pressed={!exploring} onClick={() => { engage(); restore({ amplitude: 1, frequency: 1, time: 0 }); setExploring(false); relationship.unpin(); setPrompt(PRESETS[0].caption); }}>1 · Follow the point</button>
      <button aria-pressed={exploring} onClick={() => setExploring(true)}>2 · Change the wave</button>
    </div>
    <div className="zen-sine__stage" aria-describedby={helpId}>
      <div className="zen-sine__plot-headings"><span>01 <strong>Around the circle</strong></span><span>02 <strong>Time moves right →</strong><small>same height, another view</small></span></div>
      {compact ? <div className="zen-sine__compact-plots">
        <Mafs {...plotProps} height={320} viewBox={{ x: [-2.1, 2.1], y: [-2.15, 2.15], padding: 0 }}>{circle}</Mafs>
        <p className="zen-sine__mobile-link">Same point’s height · {nice(v.y)} in both views</p>
        <Mafs {...plotProps} height={280} preserveAspectRatio={false} viewBox={{ x: [-.3, TAU + .3], y: [-2.2, 2.1], padding: 0 }}>{wave}</Mafs>
      </div> : <Mafs {...plotProps} height={390} viewBox={{ x: [-5.35, TAU + .55], y: [-2.25, 2.25], padding: 0 }}>
        {circle}
        <g pointerEvents="none"><Line.Segment point1={[circleX + v.x, v.y]} point2={[s.time, v.y]} color={C.height} opacity={.4} style="dashed" /></g>
        {wave}
      </Mafs>}
      {!exploring && <div className="zen-sine__walkthrough">
        <p className="zen-sine__stops-label">One turn, step by step</p>
        <div className="zen-sine__stops" role="group" aria-label="Follow one turn">{STOPS.map((stop, index) => <button key={stop.turn} aria-label={`${stop.label}: ${stop.turn} turn`} aria-pressed={atStop && stopIndex === index} onClick={() => edit('time', index * Math.PI / 2)}><strong>{stop.turn}</strong><span>{stop.label}</span></button>)}</div>
        <p>{atStop ? STOPS[stopIndex]?.height : s.time < Math.PI / 2 ? 'Rising together toward the top.' : s.time < Math.PI * 1.5 ? 'Falling together toward the bottom.' : 'Rising together back to the center.'} <span>{compact ? 'Matching markers show the same moment in both views.' : 'The dotted line carries the same height across both views.'}</span></p>
      </div>}
      <div className="zen-sine__equation" aria-label="Linked equation">
        <span className="zen-sine__equation-label">The relationship</span>
        <span className="zen-sine__formula"><span className="zen-sine__height">y</span> = <button className="zen-sine__term" data-quantity="amplitude" onPointerEnter={() => setActive('amplitude')} onPointerLeave={() => setActive(null)} onFocus={() => setActive('amplitude')} onBlur={() => setActive(null)} onClick={() => focusQuantity('Circle radius')} aria-label="Explore radius in equation">{nice(s.amplitude)}</button> sin(<button className="zen-sine__term" data-quantity="frequency" onPointerEnter={() => setActive('frequency')} onPointerLeave={() => setActive(null)} onFocus={() => setActive('frequency')} onBlur={() => setActive(null)} onClick={() => focusQuantity('Wave frequency')} aria-label="Explore frequency in equation">{nice(s.frequency)}</button> · <span className="zen-sine__time">t</span>)</span>
        <span className="zen-sine__result"><small>height, right now</small><output aria-label="Current height">{nice(v.y)}</output></span>
      </div>
      <div className="zen-sine__transport">
        <button className="zen-sine__play" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause motion' : 'Play motion'}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>{playing ? 'Pause' : 'Play'}</button>
        <label className="zen-sine__scrub"><span>Time</span><input aria-label="Scrub time" type="range" min="0" max={TAU} step="0.001" value={s.time} onChange={e => edit('time', Number(e.target.value))} /><output>{nice(s.time / Math.PI)}π</output></label>
        <button className="zen-sine__tool" aria-pressed={trail} onClick={() => setTrail(p => !p)}>Trace</button>
        <button className="zen-sine__tool" aria-pressed={!!pinned} onClick={() => pinned ? relationship.unpin() : relationship.pin()}>{pinned ? 'Unpin comparison' : 'Pin comparison'}</button>
        <button className="zen-sine__tool" onClick={() => { engage(); restore({ amplitude, frequency, time }); relationship.unpin(); setTrail(true); setExploring(amplitude !== 1 || frequency !== 1); setPrompt(PRESETS[0].caption); }}>Reset</button>
      </div>
    </div>
    <div className="zen-sine__below"><p id={helpId} className="zen-sine__hint"><span aria-hidden="true">↗</span> {prompt} <span>{exploring ? 'Drag the colored handles, or focus one and use arrow keys.' : 'Press Play, drag the moving point, or visit the stops along one turn.'}</span></p>{pinnedDiff !== null && <p className="zen-sine__comparison" role="status">Pinned curve · Δ height <strong>{nice(pinnedDiff)}</strong> at the same time</p>}</div>
    <nav className="zen-sine__invitations" aria-label="Things to try">{PRESETS.map((preset, index) => <button key={preset.label} onClick={() => selectPreset(preset)} className="zen-sine__invitation" aria-pressed={Math.abs(s.amplitude - preset.amplitude) < .001 && Math.abs(s.frequency - preset.frequency) < .001}><span className="zen-sine__invitation-number">0{index + 1}</span><span><strong>{preset.label}</strong><small>{preset.caption}</small></span><span aria-hidden="true">↗</span></button>)}</nav>
    <footer className="zen-sine__footer"><span>One relationship. Three ways to see it.</span><span>Drag · notice · try again</span></footer>
  </section>;
}
