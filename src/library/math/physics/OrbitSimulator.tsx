import React, { useMemo, useState } from 'react';
import {
  DISTANCE_EARTH_MOON,
  MOON_SOI_RADIUS,
  RADIUS_EARTH,
  RADIUS_MOON,
} from './model/gravity';
import {
  DEFAULT_TRANSLUNAR_CONFIG,
  simulateTranslunarTrajectory,
  TranslunarConfig,
} from './model/earthMoonTransfer';
import './physics.css';

export interface OrbitSimulatorProps {
  readonly initialConfig?: Partial<TranslunarConfig>;
}

export const OrbitSimulator: React.FC<OrbitSimulatorProps> = ({
  initialConfig = {},
}) => {
  const [tliDeltaV, setTliDeltaV] = useState<number>(
    initialConfig.tliDeltaV ?? DEFAULT_TRANSLUNAR_CONFIG.tliDeltaV
  );
  const [injectionAngleDeg, setInjectionAngleDeg] = useState<number>(-137);
  const [scrubIndex, setScrubIndex] = useState<number>(0);

  // Compute full trajectory
  const sim = useMemo(() => {
    return simulateTranslunarTrajectory({
      tliDeltaV,
      injectionAngle: (injectionAngleDeg * Math.PI) / 180,
      durationHours: 72,
      dt: 60,
    });
  }, [tliDeltaV, injectionAngleDeg]);

  const trajectory = sim.trajectory;
  const currentPt = trajectory[Math.min(scrubIndex, trajectory.length - 1)] ?? trajectory[0];

  // SVG coordinate transformation for Earth-Moon system
  // Scale: Distance is ~384,400 km. We frame [-100k km, 450k km] in X, [-200k km, 200k km] in Y.
  const viewWidth = 600;
  const viewHeight = 400;

  const worldExtent = 480e6; // 480,000 km
  const toSvgX = (x: number) => viewWidth / 2 + (x / worldExtent) * (viewWidth * 0.9);
  const toSvgY = (y: number) => viewHeight / 2 - (y / worldExtent) * (viewWidth * 0.9);

  const earthX = toSvgX(0);
  const earthY = toSvgY(0);
  const earthR = Math.max(5, (RADIUS_EARTH / worldExtent) * (viewWidth * 0.9) * 4); // scaled for visibility

  const moonX = toSvgX(currentPt.moonPos.x);
  const moonY = toSvgY(currentPt.moonPos.y);
  const moonR = Math.max(3, (RADIUS_MOON / worldExtent) * (viewWidth * 0.9) * 4);
  const moonSoiR = (MOON_SOI_RADIUS / worldExtent) * (viewWidth * 0.9);

  const shipX = toSvgX(currentPt.pos.x);
  const shipY = toSvgY(currentPt.pos.y);

  // Trajectory SVG path
  const trajD = trajectory
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.pos.x).toFixed(1)},${toSvgY(pt.pos.y).toFixed(1)}`)
    .join(' ');

  const closestApproachAltKm = Math.round(sim.closestMoonApproach.altitude / 1000);
  const transitHours = (sim.closestMoonApproach.time / 3600).toFixed(1);

  return (
    <div className="zen-physics" aria-label="Apollo Translunar Trajectory Simulator">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
            Translunar Orbital Transfer (Apollo 8 / 11)
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-3, #8e929b)' }}>
            Restricted Earth-Moon Gravitational Field · Runge-Kutta 4 Numerical Propagation
          </p>
        </div>
        <div>
          {sim.isFreeReturn ? (
            <span className="zen-physics__badge zen-physics__badge--touchdown">Free-Return Trajectory</span>
          ) : sim.isLunarCaptureCapable ? (
            <span className="zen-physics__badge zen-physics__badge--approach">Lunar Capture Corridor</span>
          ) : (
            <span className="zen-physics__badge zen-physics__badge--braking">Translunar Transfer</span>
          )}
        </div>
      </div>

      <div className="zen-physics__layout">
        {/* Trajectory Canvas */}
        <div className="zen-physics__viewport">
          <svg className="zen-physics__svg" viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
            {/* Background space */}
            <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="#06070a" />

            {/* Moon Orbit Path */}
            <circle
              cx={earthX}
              cy={earthY}
              r={(DISTANCE_EARTH_MOON / worldExtent) * (viewWidth * 0.9)}
              fill="none"
              stroke="#22252e"
              strokeDasharray="4 4"
            />

            {/* Earth */}
            <circle cx={earthX} cy={earthY} r={earthR * 2} fill="#1e3a8a" opacity="0.3" />
            <circle cx={earthX} cy={earthY} r={earthR} fill="#3b82f6" />
            <text x={earthX} y={earthY + earthR + 14} fill="#93c5fd" fontSize="9" textAnchor="middle" fontFamily="monospace">
              Earth
            </text>

            {/* Moon Sphere of Influence (SOI) */}
            <circle
              cx={moonX}
              cy={moonY}
              r={moonSoiR}
              fill="#fbbf24"
              fillOpacity="0.04"
              stroke="#fbbf24"
              strokeOpacity="0.3"
              strokeDasharray="3 3"
            />

            {/* Moon */}
            <circle cx={moonX} cy={moonY} r={moonR} fill="#e5e7eb" />
            <text x={moonX} y={moonY + moonR + 14} fill="#e5e7eb" fontSize="9" textAnchor="middle" fontFamily="monospace">
              Moon
            </text>

            {/* Trajectory Line */}
            <path d={trajD} fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.85" />

            {/* Spacecraft icon */}
            <circle cx={shipX} cy={shipY} r="4" fill="#f43f5e" />
            <circle cx={shipX} cy={shipY} r="8" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6" />

            {/* Closest Approach Marker */}
            <g transform={`translate(${toSvgX(sim.closestMoonApproach.point.pos.x)}, ${toSvgY(sim.closestMoonApproach.point.pos.y)})`}>
              <circle cx="0" cy="0" r="3" fill="#10b981" />
              <text x="6" y="-6" fill="#34d399" fontSize="9" fontFamily="monospace">
                Perilune ({closestApproachAltKm} km)
              </text>
            </g>

            {/* Mission elapsed time readout */}
            <text x="14" y="24" fill="#9ca3af" fontSize="11" fontFamily="monospace">
              T+{(currentPt.t / 3600).toFixed(1)} hrs · Distance to Moon: {Math.round(currentPt.distMoon / 1000)} km
            </text>
          </svg>
        </div>

        {/* Controls Sidebar */}
        <div className="zen-physics__sidebar">
          <div className="zen-physics__panel">
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: '#f3f4f6' }}>
              TRANSLUNAR INJECTION (TLI) PARAMETERS
            </div>

            <div className="zen-physics__controls">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                  <span style={{ color: '#8e929b' }}>TLI Burn Δv</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{tliDeltaV} m/s</span>
                </div>
                <input
                  type="range"
                  min="3080"
                  max="3250"
                  step="2"
                  value={tliDeltaV}
                  onChange={(e) => setTliDeltaV(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                  <span style={{ color: '#8e929b' }}>Injection Angle (Phase)</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{injectionAngleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={injectionAngleDeg}
                  onChange={(e) => setInjectionAngleDeg(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                  <span style={{ color: '#8e929b' }}>Scrub Flight Time</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {(currentPt.t / 3600).toFixed(1)} / 72.0 hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(1, trajectory.length - 1)}
                  step="1"
                  value={scrubIndex}
                  onChange={(e) => setScrubIndex(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div className="zen-physics__panel">
            <div className="zen-physics__stats">
              <div className="zen-physics__stat-item">
                <span className="zen-physics__stat-label">Lunar Perilune</span>
                <span className="zen-physics__stat-value">{closestApproachAltKm} km</span>
              </div>
              <div className="zen-physics__stat-item">
                <span className="zen-physics__stat-label">Transit Time</span>
                <span className="zen-physics__stat-value">{transitHours} hrs</span>
              </div>
              <div className="zen-physics__stat-item">
                <span className="zen-physics__stat-label">Earth Distance</span>
                <span className="zen-physics__stat-value">{Math.round(currentPt.distEarth / 1000)} km</span>
              </div>
              <div className="zen-physics__stat-item">
                <span className="zen-physics__stat-label">Moon Distance</span>
                <span className="zen-physics__stat-value">{Math.round(currentPt.distMoon / 1000)} km</span>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="zen-physics__btn"
                style={{ width: '100%' }}
                onClick={() => {
                  setTliDeltaV(DEFAULT_TRANSLUNAR_CONFIG.tliDeltaV);
                  setInjectionAngleDeg(-137);
                  setScrubIndex(0);
                }}
              >
                Reset to Apollo 11 Trajectory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
