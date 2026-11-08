/**
 * Apollo 11 Lunar Module Powered Descent Guidance Simulation (P63, P64, P66).
 * Incorporates George Cherry / Allan Klumpp MIT guidance law and AGC DSKY telemetry.
 * Pure model: zero React/framework dependencies.
 */

import { G0, massFlowRate, type RocketConfig } from './rocket';
import { add, dist, mag, scale, sub, vec2, type Vec2 } from './vector2';

export const LUNAR_GRAVITY = 1.622; // m/s^2

/** Standard Apollo 11 Lunar Module (LM-5 Eagle) Parameters */
export const APOLLO_11_LM_CONFIG: RocketConfig = {
  dryMass: 4323, // Ascent stage + dry descent stage (kg)
  initialPropellantMass: 8200, // Descent propellant (kg)
  isp: 311, // Descent Propulsion System (DPS) specific impulse (seconds)
  maxThrust: 45040, // 10,125 lbf DPS max thrust (Newtons)
  momentOfInertia: 25000, // kg * m^2 pitch axis
  rcsTorque: 1200, // N * m RCS attitude authority
};

export type DescentProgram = 'P63' | 'P64' | 'P66';

export type FlightStatus =
  | 'BRAKING'
  | 'APPROACH'
  | 'TERMINAL_ROD'
  | 'TOUCHDOWN_SUCCESS'
  | 'CRASH_VELOCITY_HIGH'
  | 'OUT_OF_FUEL';

export interface ApolloTelemetry {
  readonly program: DescentProgram;
  readonly flightStatus: FlightStatus;
  readonly altitude: number; // meters
  readonly downrangeDistance: number; // meters to landing site
  readonly horizontalSpeed: number; // m/s (downrange)
  readonly verticalSpeed: number; // m/s (positive = climbing, negative = descending)
  readonly absoluteSpeed: number; // m/s
  readonly pitchAngleDeg: number; // degrees (0 = horizontal forward, 90 = vertical up)
  readonly throttlePercent: number; // %
  readonly fuelRemainingKg: number;
  readonly fuelPercent: number;
  readonly timeToGo: number; // seconds
  readonly contactLight: boolean;
  readonly alarm1202: boolean;
}

export interface ApolloDescentState {
  readonly t: number; // seconds from PDI
  readonly pos: Vec2; // x: downrange (m), y: altitude (m)
  readonly vel: Vec2; // x: horizontal speed (m/s), y: vertical speed (m/s)
  readonly pitchAngle: number; // radians (0 = horizontal forward, PI/2 = vertical up, PI = retrograde)
  readonly pitchRate: number; // rad/s
  readonly propellantMass: number;
  readonly throttle: number; // 0 to 1
  readonly program: DescentProgram;
  readonly flightStatus: FlightStatus;
  readonly commandedROD: number; // commanded rate of descent for P66 (m/s, negative)
  readonly alarm1202: boolean;
}

/** Initial state at Powered Descent Initiation (PDI) at perilune */
export const INITIAL_APOLLO_11_DESCENT_STATE: ApolloDescentState = {
  t: 0,
  pos: vec2(-50000, 15240), // 50 km downrange from site, 50,000 ft (15,240 m) altitude
  vel: vec2(1680, -0.5), // ~1,680 m/s horizontal orbital velocity, gentle -0.5 m/s descent
  pitchAngle: (170 * Math.PI) / 180, // Retrograde braking attitude (~170 deg)
  pitchRate: 0,
  propellantMass: APOLLO_11_LM_CONFIG.initialPropellantMass,
  throttle: 0.99, // Full Throttle Position (FTP) for P63
  program: 'P63',
  flightStatus: 'BRAKING',
  commandedROD: -1.0, // default -1.0 m/s in P66
  alarm1202: false,
};

/**
 * Apollo Quadratic Guidance Acceleration Law (Cherry & Klumpp, MIT Draper Lab)
 * Computes commanded acceleration vector a_c to arrive at target pos_T with velocity vel_T in time t_go:
 * a_c = (6 / t_go^2) * (pos_T - pos) - (2 / t_go) * (2*vel + vel_T) - g_lunar
 */
export function apolloGuidanceLaw(
  currentPos: Vec2,
  currentVel: Vec2,
  targetPos: Vec2,
  targetVel: Vec2,
  timeToGo: number
): Vec2 {
  if (timeToGo <= 0.1) return vec2(0, 0);

  const tSq = timeToGo * timeToGo;
  const pDiff = sub(targetPos, currentPos);
  const term1 = scale(pDiff, 6 / tSq);

  const vSum = add(scale(currentVel, 2), targetVel);
  const term2 = scale(vSum, 2 / timeToGo);

  // Lunar gravity vector pointing downward [0, -g]
  const gLunar = vec2(0, -LUNAR_GRAVITY);

  return sub(sub(term1, term2), gLunar);
}

/**
 * Steps the Apollo LM flight physics and guidance computer for time step dt.
 */
export function stepApolloDescent(
  state: ApolloDescentState,
  manualControls?: {
    pitchCommand?: number; // manual pitch rate in P66 (rad/s)
    rodCommandDelta?: number; // change commanded ROD (e.g. +0.3 m/s or -0.3 m/s)
    triggerAlarm?: boolean;
    takeoverP66?: boolean;
  },
  dt: number = 0.2
): ApolloDescentState {
  if (state.flightStatus === 'TOUCHDOWN_SUCCESS' || state.flightStatus === 'CRASH_VELOCITY_HIGH') {
    return state;
  }

  const currentMass = APOLLO_11_LM_CONFIG.dryMass + Math.max(0, state.propellantMass);
  let nextProgram: DescentProgram = state.program;
  let nextStatus: FlightStatus = state.flightStatus;
  let commandedThrottle = state.throttle;
  let targetPitch = state.pitchAngle;
  let nextROD = state.commandedROD;

  if (manualControls?.rodCommandDelta) {
    nextROD = Math.max(-10, Math.min(0, nextROD + manualControls.rodCommandDelta));
  }

  if (manualControls?.takeoverP66 && nextProgram !== 'P66') {
    nextProgram = 'P66';
    nextStatus = 'TERMINAL_ROD';
  }

  // Guidance logic across phases
  if (nextProgram === 'P63') {
    // Braking phase: Full thrust, pitch to eliminate horizontal velocity and maintain trajectory
    commandedThrottle = 0.99;
    // Pitch gently adjusts as speed drops
    const speedRatio = Math.max(0, state.vel.x / 1680);
    targetPitch = (Math.PI * (165 + (1 - speedRatio) * 15)) / 180;

    // Transition to P64 (High Gate: ~2,300m altitude and ~150 m/s horizontal speed)
    if (state.pos.y <= 2300 || state.vel.x <= 160) {
      nextProgram = 'P64';
      nextStatus = 'APPROACH';
    }
  } else if (nextProgram === 'P64') {
    // Approach phase: Apollo guidance law steers to target landing point at [0, 0]
    const targetPos = vec2(0, 50); // Aiming for 50m above site at Low Gate
    const targetVel = vec2(5, -2.5); // 5 m/s forward, -2.5 m/s descent
    const tGo = Math.max(10, Math.min(120, state.pos.y / 25));

    const aCmd = apolloGuidanceLaw(state.pos, state.vel, targetPos, targetVel, tGo);
    const requiredThrustMag = mag(aCmd) * currentMass;
    commandedThrottle = Math.min(0.95, Math.max(0.15, requiredThrustMag / APOLLO_11_LM_CONFIG.maxThrust));

    // Pitch attitude aligns with thrust vector command
    targetPitch = Math.atan2(aCmd.y, aCmd.x);

    // Transition to P66 (Low Gate: ~150m altitude)
    if (state.pos.y <= 150) {
      nextProgram = 'P66';
      nextStatus = 'TERMINAL_ROD';
    }
  } else {
    // P66: Rate-of-descent manual/semi-auto landing mode
    // Throttle automatically maintains commanded vertical descent rate
    const vError = nextROD - state.vel.y;
    const hoverThrust = currentMass * LUNAR_GRAVITY;
    const correctiveThrust = hoverThrust + vError * currentMass * 1.5;
    commandedThrottle = Math.min(0.9, Math.max(0.15, correctiveThrust / APOLLO_11_LM_CONFIG.maxThrust));

    // Manual attitude steering
    if (manualControls?.pitchCommand !== undefined) {
      targetPitch += manualControls.pitchCommand * dt;
    } else {
      // Auto-level attitude to vertical upright (PI/2) and eliminate residual horizontal drift
      const hError = -state.vel.x;
      targetPitch = Math.PI / 2 + Math.max(-0.25, Math.min(0.25, hError * 0.05));
    }
  }

  // Apply pitch smoothing / rate limits
  const pitchDiff = targetPitch - state.pitchAngle;
  const maxPitchRate = 0.25; // max ~14 deg/sec
  const pitchChange = Math.max(-maxPitchRate * dt, Math.min(maxPitchRate * dt, pitchDiff));
  const nextPitch = state.pitchAngle + pitchChange;

  // Compute propulsion and forces
  const isFueled = state.propellantMass > 0;
  const actualThrottle = isFueled ? commandedThrottle : 0;
  const thrustMag = actualThrottle * APOLLO_11_LM_CONFIG.maxThrust;

  const mDot = massFlowRate(thrustMag, APOLLO_11_LM_CONFIG.isp);
  const nextPropellant = Math.max(0, state.propellantMass - mDot * dt);

  // Thrust vector (thrust acts opposite to exhaust; LM engine points downward along body -Y)
  // When pitch is PI/2 (upright), thrust pushes upwards (+Y).
  const thrustVec = vec2(
    thrustMag * Math.cos(nextPitch),
    thrustMag * Math.sin(nextPitch)
  );

  // Accelerations
  const aThrust = scale(thrustVec, 1 / currentMass);
  const aGravity = vec2(0, -LUNAR_GRAVITY);
  const aTotal = add(aThrust, aGravity);

  // Update velocity and position
  const nextVel = add(state.vel, scale(aTotal, dt));
  let nextPos = add(state.pos, scale(nextVel, dt));

  // Touchdown / Ground collision check
  let alarm = manualControls?.triggerAlarm ? true : state.alarm1202;
  if (nextPos.y <= 0) {
    nextPos = vec2(nextPos.x, 0);
    const vertSpeed = Math.abs(nextVel.y);
    const horizSpeed = Math.abs(nextVel.x);

    if (vertSpeed < 2.5 && horizSpeed < 1.5) {
      nextStatus = 'TOUCHDOWN_SUCCESS';
    } else {
      nextStatus = 'CRASH_VELOCITY_HIGH';
    }
  } else if (!isFueled) {
    nextStatus = 'OUT_OF_FUEL';
  }

  return {
    t: state.t + dt,
    pos: nextPos,
    vel: nextPos.y <= 0 ? vec2(0, 0) : nextVel,
    pitchAngle: nextPitch,
    pitchRate: pitchChange / dt,
    propellantMass: nextPropellant,
    throttle: actualThrottle,
    program: nextProgram,
    flightStatus: nextStatus,
    commandedROD: nextROD,
    alarm1202: alarm,
  };
}

/** Extracts formatted telemetry for DSKY and pilot displays */
export function getApolloTelemetry(state: ApolloDescentState): ApolloTelemetry {
  const alt = Math.max(0, state.pos.y);
  const downrange = Math.abs(state.pos.x);
  const hSpeed = Math.abs(state.vel.x);
  const vSpeed = state.vel.y;
  const absSpeed = mag(state.vel);
  const fuelPct = (state.propellantMass / APOLLO_11_LM_CONFIG.initialPropellantMass) * 100;

  // Approximate time to go based on velocity and altitude
  const tGo = alt > 0 ? (vSpeed < -0.1 ? Math.abs(alt / vSpeed) : alt / 5) : 0;

  return {
    program: state.program,
    flightStatus: state.flightStatus,
    altitude: alt,
    downrangeDistance: downrange,
    horizontalSpeed: hSpeed,
    verticalSpeed: vSpeed,
    absoluteSpeed: absSpeed,
    pitchAngleDeg: (state.pitchAngle * 180) / Math.PI,
    throttlePercent: Math.round(state.throttle * 100),
    fuelRemainingKg: Math.round(state.propellantMass),
    fuelPercent: Math.round(fuelPct * 10) / 10,
    timeToGo: Math.round(tGo),
    contactLight: alt <= 1.7 && state.flightStatus !== 'CRASH_VELOCITY_HIGH',
    alarm1202: state.alarm1202,
  };
}
