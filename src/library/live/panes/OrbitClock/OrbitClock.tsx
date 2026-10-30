import type { KeyboardEvent } from 'react';
import { useForm } from '../../../layout/assembly';
import { Text } from '../../../primitives/Text';
import { Button } from '../../../components/core/Button/Button';
import { arc, frac, polar } from '../../geometry';
import { realignBeats, type SetGenerator, type SetTrack } from '../../set';
import { ORBIT_CLOCK_FORMS, type OrbitClockForm } from './OrbitClock.forms';
import './OrbitClock.css';

export interface OrbitClockProps {
  /** Draw this form, outside an assembled screen (a screen's own choice wins inside one). */
  form?: OrbitClockForm;
  /** The generators, outermost ring first. */
  generators: readonly SetGenerator[];
  /** The tracks they play, for their names and hue slots. */
  tracks: readonly SetTrack[];
  /** The set clock, in beats (a float): every hand's place is read from it. */
  beat: number;
  /** 0 deterministic … 1 drunk. Drawn as the outer halo. */
  chaos?: number;
  /** The chord the generators follow, in the middle. */
  chord?: string;
  /** The generator the dice act on. */
  selected?: string;
  onSelect?: (track: string) => void;
  /** The dice: nudge the selected generator, shake them all a little, keep the result as a clip, undo. */
  onMutate?: () => void;
  onShake?: () => void;
  onKeep?: () => void;
  onRevert?: () => void;
  className?: string;
}

const OUTER = 90;
const INNER = 36;

/**
 * **Job.** Show what every generator is doing *in time*, together: which steps fire, where each
 * one is now, and how their cycles drift against each other — the polyrhythm itself.
 *
 * **Representation.** Orbits: one ring per generator, its steps as beads round the ring (hits
 * large, in the track's hue; rests as pinpricks) and a hand with a comet tail sweeping at the
 * generator's own cycle length. A bead lights as the hand passes it. Rings of different lengths
 * sweep at different speeds, so the hands visibly fan out and come back together; the middle says
 * when they next all meet at the top. Chaos is the faint halo round the outside, as long as it is
 * strong.
 *
 * **Behaviour.** Controlled and clock-free: `beat` comes from the engine. A ring (or its line in
 * the list) asks `onSelect(track)`; the dice ask their callbacks and change nothing themselves.
 *
 * **Forms** (`ORBIT_CLOCK_FORMS`): `full` the orbits beside the list and dice, `orbits` the rings alone.
 */
export function OrbitClock({ form: given, generators, tracks, beat, chaos = 0, chord, selected, onSelect, onMutate, onShake, onKeep, onRevert, className }: OrbitClockProps) {
  const form = useForm(ORBIT_CLOCK_FORMS, given);
  const gap = generators.length > 1 ? (OUTER - INNER) / (generators.length - 1) : 0;
  const realign = generators.length ? realignBeats(generators, beat) : { every: 0, left: 0 };
  const barsLeft = Math.ceil(realign.left / 4);
  const track = (id: string) => tracks.find((t) => t.id === id);

  const selectKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <div className={`lv-orbit${className ? ` ${className}` : ''}`} data-form={form}>
      <svg className="lv-orbit__sky" viewBox="-100 -100 200 200" role="img" aria-label={`${generators.length} generators; all hands meet again in ${barsLeft} bars`}>
        {chaos > 0 && <path className="lv-orbit__chaos" d={arc(0, 0, 97, 0, Math.min(chaos, 1))} />}
        {generators.map((g, i) => {
          const r = OUTER - i * gap;
          const t = track(g.track);
          const phase = frac((beat * g.rate) / g.steps);
          const step = Math.floor(phase * g.steps);
          const head = polar(0, 0, r, phase);
          const hit = new Set(g.hits);
          return (
            <g
              key={g.track}
              className="lv-orbit__ring"
              data-hue={t?.hue}
              data-selected={g.track === selected ? 'true' : undefined}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={onSelect ? `${t?.name ?? g.track}: ${g.kind} ${g.hint}` : undefined}
              aria-pressed={onSelect ? g.track === selected : undefined}
              onClick={onSelect ? () => onSelect(g.track) : undefined}
              onKeyDown={onSelect ? selectKey(g.track) : undefined}
            >
              <circle className="lv-orbit__track" r={r} />
              <circle className="lv-orbit__hit-area" r={r} />
              <path className="lv-orbit__tail" d={arc(0, 0, r, phase - 0.16, phase)} />
              {Array.from({ length: g.steps }, (_, s) => {
                const p = polar(0, 0, r, s / g.steps);
                const on = hit.has(s);
                return <circle key={s} className="lv-orbit__bead" data-hit={on ? 'true' : undefined} data-lit={on && s === step ? 'true' : undefined} cx={p.x} cy={p.y} r={on ? (s === step ? 4.6 : 3.2) : 1.1} />;
              })}
              <circle className="lv-orbit__head" cx={head.x} cy={head.y} r={1.8} />
            </g>
          );
        })}
        <line className="lv-orbit__noon" x1={0} y1={-INNER + 10} x2={0} y2={-OUTER - 6} />
        <text className="lv-orbit__chord" y={-1} fontSize={13}>
          {chord ?? ''}
        </text>
        <text className="lv-orbit__meet" y={11} fontSize={6.5}>
          {generators.length > 1 ? `meet in ${barsLeft} ${barsLeft === 1 ? 'bar' : 'bars'}` : ''}
        </text>
      </svg>
      {form === 'full' && (
        <div className="lv-orbit__side">
          <ul className="lv-orbit__list">
            {generators.map((g) => {
              const t = track(g.track);
              return (
                <li key={g.track}>
                  <button type="button" className="lv-orbit__item" data-hue={t?.hue} aria-pressed={g.track === selected} disabled={!onSelect} onClick={() => onSelect?.(g.track)}>
                    <span className="lv-orbit__swatch" aria-hidden="true" />
                    <Text role="label">{t?.name ?? g.track}</Text>
                    <Text role="caption" tone="secondary">
                      {g.kind}
                    </Text>
                    <Text role="caption" tone="muted" tabular className="lv-orbit__hint">
                      {g.hint}
                    </Text>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="lv-orbit__dice">
            <Button label="Mutate" size="cell" onPress={onMutate} disabled={!onMutate} />
            <Button label="Shake all" size="cell" onPress={onShake} disabled={!onShake} />
            <Button label="Keep" size="cell" onPress={onKeep} disabled={!onKeep} />
            <Button label="Revert" size="cell" variant="quiet" onPress={onRevert} disabled={!onRevert} />
          </div>
          <Text role="caption" tone="muted" tabular>
            chaos {chaos.toFixed(2)} · cycle {realign.every / 4} bars
          </Text>
        </div>
      )}
    </div>
  );
}

OrbitClock.forms = ORBIT_CLOCK_FORMS;
