import { useMemo, useState } from 'react';
import type { Param } from '../../../../components/Param/param';
import { Segmented } from '../../../../components/Segmented/Segmented';
import { Slider } from '../../../../components/Slider/Slider';
import { DEFAULT_TRANSLUNAR_CONFIG, FREE_RETURN_CONFIG, simulateTranslunarTrajectory, type TranslunarConfig } from '../../model/earthMoonTransfer';
import { DISTANCE_EARTH_MOON, RADIUS_EARTH, RADIUS_MOON } from '../../model/gravity';
import '../../physics.css';

export type TranslunarPreset = 'transfer' | 'free-return';
const PRESETS: Record<TranslunarPreset, TranslunarConfig> = { transfer: DEFAULT_TRANSLUNAR_CONFIG, 'free-return': FREE_RETURN_CONFIG };
const PRESET_NAMES: TranslunarPreset[] = ['transfer', 'free-return'];

export interface OrbitSimulatorProps {
  /** Which trajectory to start from: a transfer that reaches the Moon, or a free return. Default the transfer. */
  preset?: TranslunarPreset;
}

const DV: Param = { kind: 'float', min: 3080, max: 3250, defaultValue: 3180, name: 'Injection burn' };
const ANGLE: Param = { kind: 'int', min: -180, max: 180, defaultValue: -137, steps: 361, name: 'Injection angle' };

/**
 * A translunar trajectory in the Earth–Moon field, integrated with RK4 (the Moon moving within each
 * step). Choose the injection burn and where round the parking orbit it happens, or start from the
 * free return, which swings behind the Moon and comes home with no further burn. The accuracy
 * shown is the drift of the Jacobi integral, the energy the model conserves.
 */
export function OrbitSimulator({ preset: presetProp = 'transfer' }: OrbitSimulatorProps) {
  const [preset, setPreset] = useState<TranslunarPreset>(presetProp);
  const [dv, setDv] = useState(PRESETS[presetProp].tliDeltaV);
  const [angle, setAngle] = useState(Math.round((PRESETS[presetProp].injectionAngle * 180) / Math.PI));
  const [scrub, setScrub] = useState(1);
  const choose = (p: TranslunarPreset) => {
    setPreset(p);
    setDv(PRESETS[p].tliDeltaV);
    setAngle(Math.round((PRESETS[p].injectionAngle * 180) / Math.PI));
    setScrub(1);
  };
  const sim = useMemo(
    () => simulateTranslunarTrajectory({ ...PRESETS[preset], tliDeltaV: dv, injectionAngle: (angle * Math.PI) / 180 }),
    [preset, dv, angle],
  );
  const traj = sim.trajectory;
  const current = traj[Math.min(traj.length - 1, Math.round(scrub * (traj.length - 1)))];
  const W = 600;
  const H = 420;
  const extent = 480e6;
  const k = (W * 0.45) / extent;
  const x = (v: number) => W / 2 - 60 + v * k;
  const y = (v: number) => H / 2 - v * k;
  const path = traj.map((p, i) => `${i ? 'L' : 'M'}${x(p.pos.x).toFixed(1)} ${y(p.pos.y).toFixed(1)}`).join('');
  const perilune = Math.round(sim.closestMoonApproach.altitude / 1000);
  const label = `${sim.isFreeReturn ? 'A free return' : 'A transfer'}: closest to the Moon ${perilune.toLocaleString('en')} km above it at ${(sim.closestMoonApproach.time / 3600).toFixed(1)} h${sim.passedBehindMoon ? ', behind it' : ', on the near side'}${sim.returnedAt ? `, back at Earth's atmosphere at ${(sim.returnedAt / 3600).toFixed(1)} h` : ''}`;
  return (
    <div className="zen-physics" aria-label="Translunar trajectory">
      <div className="zen-physics__layout">
        <div className="zen-physics__panel">
          <svg className="zen-physics__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
            <circle cx={x(0)} cy={y(0)} r={DISTANCE_EARTH_MOON * k} className="zen-physics__orbit" />
            <circle cx={x(0)} cy={y(0)} r={Math.max(5, RADIUS_EARTH * k * 3)} className="zen-physics__body" />
            <text x={x(0)} y={y(0) + 22} textAnchor="middle" className="zen-physics__label">
              Earth
            </text>
            <circle cx={x(current.moonPos.x)} cy={y(current.moonPos.y)} r={Math.max(3, RADIUS_MOON * k * 3)} className="zen-physics__body" />
            <text x={x(current.moonPos.x)} y={y(current.moonPos.y) + 18} textAnchor="middle" className="zen-physics__label">
              Moon
            </text>
            <path d={path} className="zen-physics__path" />
            <circle cx={x(sim.closestMoonApproach.point.pos.x)} cy={y(sim.closestMoonApproach.point.pos.y)} r={3} className="zen-physics__mark" />
            <circle cx={x(current.pos.x)} cy={y(current.pos.y)} r={4} className="zen-physics__craft" />
            <text x={12} y={H - 12} className="zen-physics__label">
              {(current.t / 3600).toFixed(1)} h · {Math.round(current.distEarth / 1000).toLocaleString('en')} km from Earth
            </text>
          </svg>
          <Slider param={{ kind: 'float', min: 0, max: 1, defaultValue: 1, name: 'Flight time' }} value={scrub} onChange={setScrub} orientation="horizontal" layout="row" length="auto" name="Flight time" display={`${(current.t / 3600).toFixed(1)} h`} />
        </div>
        <div className="zen-physics__panel">
          <Segmented items={['Transfer', 'Free return']} index={PRESET_NAMES.indexOf(preset)} onChange={(i) => choose(PRESET_NAMES[i])} label="Trajectory" />
          <Slider param={DV} value={dv} onChange={(v) => setDv(Math.round(v))} orientation="horizontal" layout="row" length="auto" name="Injection burn" display={`${dv} m/s`} />
          <Slider param={ANGLE} value={angle} onChange={(v) => setAngle(Math.round(v))} orientation="horizontal" layout="row" length="auto" name="Injection angle" display={`${angle}°`} />
          <dl className="zen-physics__readouts">
            <div>
              <dt>Closest to the Moon</dt>
              <dd>{perilune.toLocaleString('en')} km</dd>
            </div>
            <div>
              <dt>At</dt>
              <dd>{(sim.closestMoonApproach.time / 3600).toFixed(1)} h</dd>
            </div>
            <div>
              <dt>Behind the Moon</dt>
              <dd data-readout="behind">{sim.passedBehindMoon ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt>Back at the atmosphere</dt>
              <dd data-readout="returned">{sim.returnedAt ? `${(sim.returnedAt / 3600).toFixed(1)} h` : 'no'}</dd>
            </div>
            <div>
              <dt>Free return</dt>
              <dd data-readout="free-return">{sim.isFreeReturn ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt>Jacobi drift (step {PRESETS[preset].dt} s)</dt>
              <dd data-readout="jacobi" data-value={sim.jacobiDrift}>
                {sim.jacobiDrift.toExponential(1)}
              </dd>
            </div>
          </dl>
          <p className="zen-physics__caption">
            The Earth is fixed and the Moon circles it, so in the frame that turns with the Moon the spacecraft’s energy, the Jacobi integral, is conserved exactly: its drift is the
            integrator’s error.
          </p>
        </div>
      </div>
    </div>
  );
}
