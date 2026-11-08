import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApolloDescentState,
  getApolloTelemetry,
  INITIAL_APOLLO_11_DESCENT_STATE,
  stepApolloDescent,
} from './model/apolloDescent';
import { DskyDisplay } from './DskyDisplay';
import './physics.css';

export interface ApolloDescentSimulatorProps {
  /** Optional initial custom state */
  readonly initialState?: ApolloDescentState;
  /** Whether simulation auto-plays on load */
  readonly autoPlay?: boolean;
}

export const ApolloDescentSimulator: React.FC<ApolloDescentSimulatorProps> = ({
  initialState = INITIAL_APOLLO_11_DESCENT_STATE,
  autoPlay = false,
}) => {
  const [state, setState] = useState<ApolloDescentState>(initialState);
  const [playing, setPlaying] = useState<boolean>(autoPlay);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([
    { x: initialState.pos.x, y: initialState.pos.y },
  ]);

  const animFrame = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);

  const resetFlight = useCallback(() => {
    setState(initialState);
    setTrail([{ x: initialState.pos.x, y: initialState.pos.y }]);
    setPlaying(false);
  }, [initialState]);

  const stepSim = useCallback((dt: number, manual?: { pitchCommand?: number; rodDelta?: number }) => {
    setState((curr) => {
      if (curr.flightStatus === 'TOUCHDOWN_SUCCESS' || curr.flightStatus === 'CRASH_VELOCITY_HIGH') {
        return curr;
      }
      const next = stepApolloDescent(
        curr,
        {
          pitchCommand: manual?.pitchCommand,
          rodCommandDelta: manual?.rodDelta,
        },
        dt
      );
      setTrail((t) => {
        const last = t[t.length - 1];
        if (!last || Math.hypot(next.pos.x - last.x, next.pos.y - last.y) > 250) {
          return [...t, { x: next.pos.x, y: next.pos.y }];
        }
        return t;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!playing) {
      lastTime.current = null;
      return;
    }
    const loop = (now: number) => {
      if (lastTime.current !== null) {
        const deltaSec = Math.min(0.1, (now - lastTime.current) / 1000);
        stepSim(deltaSec * simSpeed);
      }
      lastTime.current = now;
      animFrame.current = requestAnimationFrame(loop);
    };
    animFrame.current = requestAnimationFrame(loop);
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [playing, simSpeed, stepSim]);

  const telemetry = getApolloTelemetry(state);

  // SVG coordinate transformation for descent view
  // World: x in [-52000, 2000], y in [0, 16000]
  // In terminal phases (P64/P66), we zoom into the landing area
  const isTerminalZoom = state.pos.y < 1200 && state.pos.x > -4000;

  const viewWidth = 600;
  const viewHeight = 360;

  let xMin = -52000;
  let xMax = 4000;
  let yMin = -500;
  let yMax = 16500;

  if (isTerminalZoom) {
    xMin = Math.min(-1500, state.pos.x - 400);
    xMax = Math.max(1000, state.pos.x + 800);
    yMin = -50;
    yMax = Math.max(250, state.pos.y * 1.8);
  }

  const toSvgX = (wx: number) => ((wx - xMin) / (xMax - xMin)) * viewWidth;
  const toSvgY = (wy: number) => viewHeight - ((wy - yMin) / (yMax - yMin)) * viewHeight;

  const lmX = toSvgX(state.pos.x);
  const lmY = toSvgY(state.pos.y);

  // SVG trail path
  const trailD = trail
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.x).toFixed(1)},${toSvgY(pt.y).toFixed(1)}`)
    .join(' ');

  const getStatusBadge = () => {
    switch (state.flightStatus) {
      case 'BRAKING':
        return <span className="zen-physics__badge zen-physics__badge--braking">P63 Braking</span>;
      case 'APPROACH':
        return <span className="zen-physics__badge zen-physics__badge--approach">P64 Approach</span>;
      case 'TERMINAL_ROD':
        return <span className="zen-physics__badge zen-physics__badge--rod">P66 Rate of Descent</span>;
      case 'TOUCHDOWN_SUCCESS':
        return <span className="zen-physics__badge zen-physics__badge--touchdown">Tranquility Base Touchdown</span>;
      case 'CRASH_VELOCITY_HIGH':
        return <span className="zen-physics__badge zen-physics__badge--crash">Hard Impact / Crash</span>;
      default:
        return null;
    }
  };

  return (
    <div className="zen-physics" aria-label="Apollo 11 Powered Descent Simulator">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
            Apollo 11 Lunar Module Descent Guidance
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-3, #8e929b)' }}>
            MIT Draper Apollo Guidance Computer (P63 Braking · P64 Approach · P66 Manual ROD)
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      <div className="zen-physics__layout">
        {/* Left: Interactive Flight Viewport */}
        <div className="zen-physics__viewport">
          <svg className="zen-physics__svg" viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
            {/* Stars / Moon sky */}
            <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="#090a0f" />

            {/* Lunar surface ground line */}
            <line
              x1="0"
              y1={toSvgY(0)}
              x2={viewWidth}
              y2={toSvgY(0)}
              stroke="#595c68"
              strokeWidth="2"
            />
            {/* Lunar terrain fill */}
            <rect
              x="0"
              y={toSvgY(0)}
              width={viewWidth}
              height={viewHeight - toSvgY(0)}
              fill="#181a20"
            />

            {/* Landing Site Marker */}
            <g transform={`translate(${toSvgX(0)}, ${toSvgY(0)})`}>
              <line x1="0" y1="0" x2="0" y2="-20" stroke="#f59e0b" strokeWidth="1.5" />
              <polygon points="0,-20 12,-15 0,-10" fill="#f59e0b" />
              <circle cx="0" cy="0" r="3" fill="#fbbf24" />
              <text x="6" y="-2" fill="#fbbf24" fontSize="9" fontFamily="monospace">
                Tranquility Site
              </text>
            </g>

            {/* West Crater hazard obstacle */}
            <ellipse
              cx={toSvgX(-350)}
              cy={toSvgY(0) + 4}
              rx={Math.max(6, (120 / (xMax - xMin)) * viewWidth)}
              ry="4"
              fill="#0d0e12"
              stroke="#3a3d47"
            />

            {/* Historical trajectory trail */}
            {trail.length > 1 && (
              <path d={trailD} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.75" />
            )}

            {/* Current Lunar Module */}
            <g transform={`translate(${lmX}, ${lmY})`}>
              {/* Attitude rotation (LM pitch angle: 90 deg is vertical up) */}
              <g transform={`rotate(${90 - (state.pitchAngle * 180) / Math.PI})`}>
                {/* Engine thrust plume */}
                {state.throttle > 0.05 && (
                  <polygon
                    points={`-3,10 0,${10 + state.throttle * 22} 3,10`}
                    fill="#38bdf8"
                    opacity="0.85"
                  />
                )}
                {/* LM Ascent / Descent Stage Body */}
                <rect x="-7" y="0" width="14" height="10" rx="1" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                <rect x="-5" y="-8" width="10" height="8" rx="2" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />
                {/* Landing gear legs */}
                <line x1="-7" y1="10" x2="-12" y2="15" stroke="#9ca3af" strokeWidth="1.2" />
                <line x1="7" y1="10" x2="12" y2="15" stroke="#9ca3af" strokeWidth="1.2" />
              </g>

              {/* Contact probe */}
              {state.pos.y <= 2.5 && (
                <line x1="0" y1="15" x2="0" y2="22" stroke="#34d399" strokeWidth="2" />
              )}
            </g>

            {/* Altitude readout on canvas */}
            <text x="12" y="24" fill="#9ca3af" fontSize="11" fontFamily="monospace">
              T+{Math.round(state.t)}s · Phase: {state.program} {state.flightStatus}
            </text>
          </svg>
        </div>

        {/* Right: AGC DSKY & Flight Director */}
        <div className="zen-physics__sidebar">
          <DskyDisplay
            telemetry={telemetry}
            onTriggerAlarm={() => setState((s) => ({ ...s, alarm1202: true }))}
            onResetAlarm={() => setState((s) => ({ ...s, alarm1202: false }))}
          />

          <div className="zen-physics__panel">
            <div className="zen-physics__stats">
              <div className="zen-physics__stat-item">
                <span className="zen-physics__stat-label">Descent Fuel</span>
                <span className="zen-physics__stat-value">{telemetry.fuelPercent}%</span>
              </div>
              <div className="zen-physics__stat-item">
                <span className="zen-physics__stat-label">Throttle</span>
                <span className="zen-physics__stat-value">{telemetry.throttlePercent}%</span>
              </div>
              <div className="zen-physics__stat-item">
                <span className="zen-physics__stat-label">Pitch Attitude</span>
                <span className="zen-physics__stat-value">{telemetry.pitchAngleDeg.toFixed(1)}°</span>
              </div>
              <div className="zen-physics__stat-item">
                <span className="zen-physics__stat-label">Downrange</span>
                <span className="zen-physics__stat-value">{(telemetry.downrangeDistance / 1000).toFixed(2)} km</span>
              </div>
            </div>

            <div style={{ marginTop: 12 }} className="zen-physics__controls">
              <div className="zen-physics__control-row">
                <div className="zen-physics__buttons">
                  <button
                    type="button"
                    className="zen-physics__btn zen-physics__btn--primary"
                    onClick={() => setPlaying(!playing)}
                  >
                    {playing ? 'Pause' : 'Simulate'}
                  </button>
                  <button
                    type="button"
                    className="zen-physics__btn"
                    onClick={() => stepSim(1.0)}
                  >
                    +1s Step
                  </button>
                  <button
                    type="button"
                    className="zen-physics__btn"
                    onClick={resetFlight}
                  >
                    Reset PDI
                  </button>
                </div>
              </div>

              {/* P66 Manual Control Takeover (Armstrong mode) */}
              <div style={{ borderTop: '1px solid var(--border, #26282e)', paddingTop: 8 }}>
                <div style={{ fontSize: '0.7rem', color: '#8e929b', marginBottom: 4, fontWeight: 600 }}>
                  ASTRONAUT MANUAL CONTROLS (P66 ROD)
                </div>
                <div className="zen-physics__buttons">
                  <button
                    type="button"
                    className="zen-physics__btn"
                    onClick={() => setState((s) => ({ ...s, program: 'P66', flightStatus: 'TERMINAL_ROD' }))}
                  >
                    P66 Takeover
                  </button>
                  <button
                    type="button"
                    className="zen-physics__btn"
                    onClick={() => stepSim(0.2, { rodDelta: +0.3 })}
                    title="Click ROD switch UP: decreases descent rate (+1 ft/s)"
                  >
                    ROD +1 fps
                  </button>
                  <button
                    type="button"
                    className="zen-physics__btn"
                    onClick={() => stepSim(0.2, { rodDelta: -0.3 })}
                    title="Click ROD switch DOWN: increases descent rate (-1 ft/s)"
                  >
                    ROD -1 fps
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
