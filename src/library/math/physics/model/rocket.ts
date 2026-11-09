/**
 * Rocket propulsion, variable mass depletion, and attitude dynamics.
 * Pure model: zero React/framework dependencies.
 */

import { rotate, scale, vec2, type Vec2 } from './vector2';

export const G0 = 9.80665; // Standard gravity constant (m/s^2) for Isp calculations

export interface RocketConfig {
  /** Dry mass without propellant (kg) */
  readonly dryMass: number;
  /** Initial propellant mass (kg) */
  readonly initialPropellantMass: number;
  /** Specific impulse Isp in seconds */
  readonly isp: number;
  /** Maximum engine thrust (Newtons) */
  readonly maxThrust: number;
  /** Moment of inertia for pitch rotation (kg * m^2) */
  readonly momentOfInertia: number;
  /** Reaction Control System (RCS) torque authority (N * m) */
  readonly rcsTorque: number;
}

export interface RocketState {
  readonly propellantMass: number;
  /** Pitch angle in radians (0 = pointing right along +X, PI/2 = pointing up along +Y) */
  readonly pitchAngle: number;
  /** Pitch angular velocity in rad/s */
  readonly pitchRate: number;
  /** Throttle fraction [0, 1] */
  readonly throttle: number;
  /** RCS control command [-1, +1] */
  readonly rcsCommand: number;
}

/** Tsiolkovsky rocket equation: Δv = Isp * g0 * ln(m0 / mf) */
export function tsiolkovskyDeltaV(initialMass: number, finalMass: number, isp: number): number {
  if (finalMass <= 0 || initialMass < finalMass) return 0;
  return isp * G0 * Math.log(initialMass / finalMass);
}

/** Mass flow rate dm/dt in kg/s for a given thrust */
export function massFlowRate(thrustNewtons: number, isp: number): number {
  if (isp <= 0) return 0;
  return thrustNewtons / (isp * G0);
}

/**
 * Steps the rocket propulsion and attitude dynamics over time dt.
 */
export function stepRocket(
  config: RocketConfig,
  state: RocketState,
  dt: number
): {
  readonly nextState: RocketState;
  readonly currentMass: number;
  readonly thrustForce: Vec2;
  readonly thrustMag: number;
} {
  const currentMass = config.dryMass + Math.max(0, state.propellantMass);

  // If out of propellant, thrust is zero
  const isFueled = state.propellantMass > 0;
  const clampedThrottle = isFueled ? Math.min(1, Math.max(0, state.throttle)) : 0;
  const thrustMag = clampedThrottle * config.maxThrust;

  // Propellant consumption
  const mDot = massFlowRate(thrustMag, config.isp);
  const propellantBurned = mDot * dt;
  const nextPropellant = Math.max(0, state.propellantMass - propellantBurned);

  // Thrust direction vector in 2D
  // Unit thrust vector along pitch angle
  const thrustDirection = vec2(Math.cos(state.pitchAngle), Math.sin(state.pitchAngle));
  const thrustForce = scale(thrustDirection, thrustMag);

  // Attitude dynamics (pitch torque from RCS)
  const clampedRcs = Math.min(1, Math.max(-1, state.rcsCommand));
  const torque = clampedRcs * config.rcsTorque;
  const alpha = torque / config.momentOfInertia; // angular acceleration rad/s^2

  const nextPitchRate = state.pitchRate + alpha * dt;
  const nextPitchAngle = state.pitchAngle + nextPitchRate * dt;

  return {
    nextState: {
      propellantMass: nextPropellant,
      pitchAngle: nextPitchAngle,
      pitchRate: nextPitchRate,
      throttle: state.throttle,
      rcsCommand: state.rcsCommand,
    },
    currentMass,
    thrustForce,
    thrustMag,
  };
}
