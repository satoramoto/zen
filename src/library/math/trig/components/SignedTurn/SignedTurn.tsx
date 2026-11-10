import { useEffect, useRef, useState } from 'react';
import { useControlled } from '../../../fourier/useControlled';
import { continueTurn, turnState } from '../../model/turn';
import { angleOf, Arc, Axes, Circle, clamp, Handle, Label, onCircle, Path, Plane, Readouts, Segment, square, useDrag } from '../../parts';
import './SignedTurn.css';

export interface SignedTurnProps {
  /** Signed total degrees; positive is anticlockwise. Default 0. */
  angle?: number;
  onAngle?(degrees: number): void;
  /** Start direction in degrees from right; 90 starts up. */
  start?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Drawing radius in a fixed ±1.4 frame, allowing honest arm-length comparisons. */
  radius?: number;
  axes?: boolean;
  quadrants?: boolean;
  divisions?: number;
  interactive?: boolean;
  readouts?: boolean;
  /** Description supplied by the lesson, for example before degree notation is introduced. */
  description?: string;
  label?: string;
}

/** A total signed journey with a ghost start, directed sweep and separate full-lap count. */
export function SignedTurn({ angle: value, onAngle, start = 0, min = -720, max = 1080, step = 1, radius = 1, axes = false, quadrants = false, divisions = 0, interactive = true, readouts = true, description, label = 'Total turn' }: SignedTurnProps) {
  const [angle, setAngle] = useControlled(value, onAngle, 0);
  const [draft, setDraft] = useState(String(angle));
  const current = useRef(angle);
  useEffect(() => { current.current = angle; setDraft(String(angle)); }, [angle]);
  const place = (next: number) => {
    if (!Number.isFinite(next)) return;
    current.current = clamp(next, min, max);
    setAngle(current.current);
  };
  const state = turnState(angle, start);
  const f = square(320, 1.4);
  const drag = useDrag(f, (point) => {
    if (Math.hypot(point.x, point.y) < 0.1) return;
    place(continueTurn(current.current, angleOf(point), start));
  });
  const endpoint = onCircle(state.endpoint, radius);
  const sweep = angle;
  const arrowAngle = start + sweep;
  const tip = onCircle(arrowAngle, radius * 0.82);
  const tangent = onCircle(arrowAngle + (angle < 0 ? -90 : 90), 0.12);
  const normal = onCircle(arrowAngle, 0.055);
  const text = description ?? `Start ${start}°. Turn ${angle}° ${state.direction}; ${state.laps} complete laps; finish ${state.endpoint}°, ${state.region}.`;
  return <div className="zen-trig zen-signed-turn" data-total={angle} data-endpoint={state.endpoint} data-laps={state.laps}>
    <Plane f={f} label={text} svgRef={drag.ref}>
      {axes && <Axes f={f} />}
      <Circle f={f} r={radius} />
      {Array.from({ length: Math.min(24, Math.max(0, Math.floor(divisions))) }, (_, i) => <Segment key={i} f={f} from={{ x: 0, y: 0 }} to={onCircle(start + i * 360 / divisions, radius)} className="zen-trig__axis" />)}
      <Segment f={f} from={{ x: 0, y: 0 }} to={onCircle(start, radius)} className="zen-signed-turn__start" />
      <Arc f={f} r={radius * 0.82} from={start} to={start + sweep} className="zen-signed-turn__sweep" />
      {angle !== 0 && <Path f={f} points={[
        { x: tip.x - tangent.x + normal.x, y: tip.y - tangent.y + normal.y }, tip,
        { x: tip.x - tangent.x - normal.x, y: tip.y - tangent.y - normal.y },
      ]} className="zen-signed-turn__sweep" />}
      <Segment f={f} from={{ x: 0, y: 0 }} to={endpoint} />
      {quadrants && ['I', 'II', 'III', 'IV'].map((name, i) => <Label key={name} f={f} at={onCircle(45 + i * 90, 1.18)} anchor="middle" dy={5}>{name}</Label>)}
      {interactive && <Handle f={f} at={endpoint} label={label} value={angle} min={min} max={max} valueText={text} drag={drag} onKey={(direction, big) => place(current.current + (direction === 'up' || direction === 'right' ? 1 : -1) * step * (big ? 15 : 1))} />}
    </Plane>
    {readouts && <Readouts items={[{ label: 'signed total', value: `${angle.toLocaleString(undefined, { maximumFractionDigits: 2 })}°` }, { label: 'complete laps', value: `${state.laps} ${state.direction}` }, { label: 'finish', value: state.region }]} />}
    {interactive && readouts && <label className="zen-signed-turn__input">{label} (degrees)<input type="number" value={draft} min={min} max={max} step={step} onChange={(event) => { setDraft(event.currentTarget.value); if (event.currentTarget.value !== '') place(event.currentTarget.valueAsNumber); }} onBlur={() => setDraft(String(angle))} /></label>}
  </div>;
}
