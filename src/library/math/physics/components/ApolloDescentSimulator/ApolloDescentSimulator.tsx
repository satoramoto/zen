import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../components/Button/Button';
import { Segmented } from '../../../../components/Segmented/Segmented';
import { Dsky } from '../Dsky/Dsky';
import { followDescent, pressKey, startDsky, type DskyKey, type DskyState } from '../../model/dsky';
import {
  APOLLO_11_LOAD,
  dskyReadout,
  flyToEnd,
  ignite,
  ignitionState,
  NO_LOAD,
  rangeToSite,
  altitude,
  stepDescent,
  type DescentLoad,
  type DescentState,
} from '../../model/lunarDescent';
import { src } from '../../model/sources';
import '../../physics.css';

const FT = 0.3048;

export type DescentLoadName = 'none' | 'radar' | 'apollo-11';
const LOADS: Record<DescentLoadName, DescentLoad> = {
  none: NO_LOAD,
  radar: { radarSteal: src('radarSteal'), monitorRequests: [] },
  'apollo-11': APOLLO_11_LOAD,
};
const LOAD_NAMES: DescentLoadName[] = ['none', 'radar', 'apollo-11'];
const SPEEDS = [1, 10, 50];

export interface ApolloDescentSimulatorProps {
  /** The executive's extra load: none, the rendezvous radar's steal, or Apollo 11's (the radar and the crew's displays). Default none. */
  load?: DescentLoadName;
  /** Start playing at once. Default false. */
  autoPlay?: boolean;
}

interface Sim {
  descent: DescentState;
  dsky: DskyState;
}

const start = (load: DescentLoadName): Sim => ({ descent: ignitionState(LOADS[load]), dsky: startDsky() });

/** Bring the DSKY up to date with the descent. */
const sync = (sim: Sim): Sim => ({ ...sim, dsky: followDescent(sim.dsky, sim.descent.program, sim.descent.alarms, sim.descent.status !== 'awaiting-ignition') });

/** The profile: altitude against range, at a scale that follows the phase. */
function Profile({ descent, trail }: { descent: DescentState; trail: { x: number; y: number }[] }) {
  const range = rangeToSite(descent);
  const alt = altitude(descent);
  const [rx, ry] = Math.abs(range) > 25_000 || alt > 4000 ? [480_000, 16_000] : Math.abs(range) > 1200 || alt > 400 ? [25_000, 4_000] : [1200, 400];
  const W = 600;
  const H = 260;
  const x = (r: number) => 20 + ((r + rx) / (rx * 1.04)) * (W - 40);
  const y = (h: number) => H - 24 - (h / ry) * (H - 50);
  const points = trail.filter((p) => p.x >= -rx * 1.02).map((p) => `${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`);
  const d = dskyReadout(descent);
  const pitchRad = (d.pitch * Math.PI) / 180;
  const label = `${descent.program}: ${Math.round(alt / FT).toLocaleString('en')} ft up, ${Math.round(Math.abs(range) / 1000)} km from the landing site, ${Math.round(Math.abs(d.horizontal) / FT)} ft/s across, ${Math.round(-d.altitudeRate / FT)} ft/s down`;
  return (
    <svg className="zen-physics__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line x1={x(-rx)} y1={y(0)} x2={x(rx * 0.04)} y2={y(0)} className="zen-physics__surface" />
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={x(-rx)} y1={y(ry * f)} x2={x(rx * 0.04)} y2={y(ry * f)} className="zen-physics__grid" />
          <text x={x(-rx)} y={y(ry * f) - 3} className="zen-physics__label">
            {Math.round((ry * f) / FT).toLocaleString('en')} ft
          </text>
        </g>
      ))}
      <polyline points={points.join(' ')} className="zen-physics__trail" />
      <circle cx={x(0)} cy={y(0)} r={5} className="zen-physics__site" />
      <text x={x(0) - 4} y={y(0) + 16} textAnchor="end" className="zen-physics__label">
        site
      </text>
      <g transform={`translate(${x(range).toFixed(1)}, ${y(alt).toFixed(1)})`}>
        {d.throttle > 0 && <line x1={0} y1={0} x2={Math.sin(pitchRad) * 18} y2={Math.cos(pitchRad) * 18} className="zen-physics__thrust" />}
        <circle r={5} className="zen-physics__craft" />
      </g>
      <text x={W - 12} y={18} textAnchor="end" className="zen-physics__label">
        {rx >= 100_000 ? 'braking: the whole descent' : rx >= 10_000 ? 'approach: the last 25 km' : 'landing: the last 1.2 km'}
      </text>
    </svg>
  );
}

/**
 * The Lunar Module's powered descent, flown by the Luminary 099 guidance model, with the DSKY the
 * crew used. Press PRO on the DSKY (V99N62) to light the engine; play, or jump to high gate, low
 * gate or touchdown. In P64 or P65 a click of the rate switch takes over into P66. The load choice
 * adds the rendezvous radar's stolen time (and, for Apollo 11, the crew's monitor displays at the
 * times the alarms followed); calling up V16N68 with that load running overflows the executive.
 */
export function ApolloDescentSimulator({ load: loadProp = 'none', autoPlay = false }: ApolloDescentSimulatorProps) {
  const [load, setLoad] = useState<DescentLoadName>(loadProp);
  const [sim, setSim] = useState<Sim>(() => start(loadProp));
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(10);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const last = useRef<number | null>(null);

  const advance = (next: (s: DescentState) => DescentState) =>
    setSim((cur) => {
      const descent = next(cur.descent);
      setTrail((t) => {
        const p = { x: rangeToSite(descent), y: altitude(descent) };
        const prev = t[t.length - 1];
        return !prev || Math.hypot(p.x - prev.x, (p.y - prev.y) * 10) > Math.max(5, Math.abs(p.x) / 200) ? [...t, p] : t;
      });
      return sync({ ...cur, descent });
    });

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      if (last.current !== null) {
        const dt = Math.min(0.25, (now - last.current) / 1000) * speed;
        advance((d) => (d.status === 'flying' ? stepDescent(d, dt) : d));
      }
      last.current = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);

  const restart = (name: DescentLoadName) => {
    setLoad(name);
    setSim(start(name));
    setTrail([]);
    setPlaying(false);
  };
  const key = (k: DskyKey) =>
    setSim((cur) => {
      const r = pressKey(cur.dsky, k);
      let descent = cur.descent;
      if (r.proceed) descent = ignite(descent);
      if (r.monitor && descent.status === 'flying') descent = { ...descent, load: { ...descent.load, monitorRequests: [...descent.load.monitorRequests, descent.t] } };
      return sync({ descent, dsky: r.dsky });
    });
  const flyUntil = (until: (s: DescentState) => boolean) => advance((d) => flyToEnd(d.status === 'awaiting-ignition' ? ignite(d) : d, 1500, until));

  const d = dskyReadout(sim.descent);
  const s = sim.descent;
  const canClick = s.status === 'flying' && (s.program === 'P64' || s.program === 'P65' || s.program === 'P66');
  const status =
    s.status === 'awaiting-ignition'
      ? 'Waiting for ignition: press PRO on the DSKY'
      : s.status === 'flying'
        ? `${s.program}: ${{ P63: 'braking', P64: 'approach', P65: 'automatic vertical descent', P66: 'rate of descent, crew in control' }[s.program]}`
        : s.status === 'landed'
          ? 'Landed'
          : s.status === 'crashed'
            ? 'Crashed'
            : 'Out of propellant';
  return (
    <div className="zen-physics" aria-label="Apollo 11 powered descent">
      <div className="zen-physics__layout">
        <div className="zen-physics__panel">
          <Profile descent={s} trail={trail} />
          <p className="zen-physics__caption" role="status">
            {status}
          </p>
          <dl className="zen-physics__readouts">
            <div>
              <dt>Time from ignition</dt>
              <dd>{s.t.toFixed(0)} s</dd>
            </div>
            <div>
              <dt>Altitude</dt>
              <dd>{Math.round(d.altitude / FT).toLocaleString('en')} ft</dd>
            </div>
            <div>
              <dt>Altitude rate</dt>
              <dd>{(d.altitudeRate / FT).toFixed(1)} ft/s</dd>
            </div>
            <div>
              <dt>Horizontal</dt>
              <dd>{(d.horizontal / FT).toFixed(1)} ft/s</dd>
            </div>
            <div>
              <dt>Throttle</dt>
              <dd>{Math.round(d.throttle * 100)}%</dd>
            </div>
            <div>
              <dt>Pitch from vertical</dt>
              <dd data-readout="pitch" data-value={d.pitch.toFixed(2)}>
                {Math.round(d.pitch)}°
              </dd>
            </div>
            <div>
              <dt>Propellant</dt>
              <dd>{Math.round(d.propellant).toLocaleString('en')} kg</dd>
            </div>
            <div>
              <dt>Commanded descent rate</dt>
              <dd data-readout="commanded-rate" data-value={(s.desiredRate / FT).toFixed(3)}>
                {s.program === 'P65' || s.program === 'P66' ? `${(s.desiredRate / FT).toFixed(1)} ft/s` : '—'}
              </dd>
            </div>
            <div>
              <dt>Core sets in use</dt>
              <dd>
                {d.coreSets} of {src('coreSets')}
              </dd>
            </div>
          </dl>
          <div className="zen-physics__row">
            <Button
              label={playing ? 'Pause' : 'Play'}
              on={playing}
              onPress={() => {
                if (s.status === 'awaiting-ignition') key('PRO');
                setPlaying((p) => !p);
              }}
            />
            <Segmented items={SPEEDS.map((x) => `${x}×`)} index={SPEEDS.indexOf(speed)} onChange={(i) => setSpeed(SPEEDS[i])} label="Speed" />
            <Button label="Advance 10 s" onPress={() => advance((x) => stepDescent(x.status === 'awaiting-ignition' ? ignite(x) : x, 10))} />
          </div>
          <div className="zen-physics__row">
            <Button label="Fly to high gate" onPress={() => flyUntil((x) => x.program !== 'P63')} />
            <Button label="Fly to low gate" onPress={() => flyUntil((x) => x.program === 'P65' || x.program === 'P66' || altitude(x) < 150)} />
            <Button label="Fly to touchdown" onPress={() => flyUntil(() => false)} />
            <Button label="Restart" onPress={() => restart(load)} />
          </div>
          <div className="zen-physics__row">
            <Button label="Rate switch up: slower descent" disabled={!canClick} onPress={() => advance((x) => stepDescent(x, 0.1, { rodClicks: 1 }))} />
            <Button label="Rate switch down: faster descent" disabled={!canClick} onPress={() => advance((x) => stepDescent(x, 0.1, { rodClicks: -1 }))} />
          </div>
          <div className="zen-physics__row">
            <Segmented items={['None', 'Radar', 'Apollo 11']} index={LOAD_NAMES.indexOf(load)} onChange={(i) => restart(LOAD_NAMES[i])} label="Executive load" />
          </div>
        </div>
        <div className="zen-physics__panel" data-dsky="">
          <Dsky dsky={sim.dsky} readout={d} onKey={key} />
          <h3 className="zen-physics__caption">Flight log</h3>
          <ol className="zen-physics__log" aria-label="Flight log" aria-live="polite">
            {s.log.map((e, i) => (
              <li key={i} data-kind={e.kind}>
                {e.get} {e.text}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
