/**
 * Pure numerical integration methods for particle and rigid-body mechanics.
 * Pure model: zero React/framework dependencies.
 */

import { add, scale, vec2, type Vec2 } from './vector2';

export interface State2D {
  readonly pos: Vec2;
  readonly vel: Vec2;
}

export type AccelerationFn = (pos: Vec2, vel: Vec2, t: number) => Vec2;

/**
 * Standard forward Euler integration.
 * O(dt) accuracy. Tends to artificially gain energy over time.
 */
export function stepEuler(state: State2D, accelFn: AccelerationFn, dt: number, t: number = 0): State2D {
  const a = accelFn(state.pos, state.vel, t);
  return {
    pos: add(state.pos, scale(state.vel, dt)),
    vel: add(state.vel, scale(a, dt)),
  };
}

/**
 * Symplectic (semi-implicit) Euler integration.
 * Updates velocity first, then position using the new velocity.
 * Symplectic: preserves phase space volume and bounds energy drift for orbital/Hamiltonian systems.
 */
export function stepSymplecticEuler(state: State2D, accelFn: AccelerationFn, dt: number, t: number = 0): State2D {
  const a = accelFn(state.pos, state.vel, t);
  const nextVel = add(state.vel, scale(a, dt));
  const nextPos = add(state.pos, scale(nextVel, dt));
  return {
    pos: nextPos,
    vel: nextVel,
  };
}

/**
 * Classical 4th-Order Runge-Kutta (RK4) integration.
 * O(dt^4) accuracy. The industry standard for high-fidelity orbital and flight trajectory simulation.
 */
export function stepRK4(state: State2D, accelFn: AccelerationFn, dt: number, t: number = 0): State2D {
  const p0 = state.pos;
  const v0 = state.vel;

  // k1
  const k1_v = accelFn(p0, v0, t);
  const k1_p = v0;

  // k2 (at t + 0.5*dt)
  const p1 = add(p0, scale(k1_p, dt * 0.5));
  const v1 = add(v0, scale(k1_v, dt * 0.5));
  const k2_v = accelFn(p1, v1, t + dt * 0.5);
  const k2_p = v1;

  // k3 (at t + 0.5*dt)
  const p2 = add(p0, scale(k2_p, dt * 0.5));
  const v2 = add(v0, scale(k2_v, dt * 0.5));
  const k3_v = accelFn(p2, v2, t + dt * 0.5);
  const k3_p = v2;

  // k4 (at t + dt)
  const p3 = add(p0, scale(k3_p, dt));
  const v3 = add(v0, scale(k3_v, dt));
  const k4_v = accelFn(p3, v3, t + dt);
  const k4_p = v3;

  // Weighted average: (k1 + 2*k2 + 2*k3 + k4) / 6
  const dPos = scale(
    add(add(k1_p, scale(k2_p, 2)), add(scale(k3_p, 2), k4_p)),
    dt / 6
  );
  const dVel = scale(
    add(add(k1_v, scale(k2_v, 2)), add(scale(k3_v, 2), k4_v)),
    dt / 6
  );

  return {
    pos: add(p0, dPos),
    vel: add(v0, dVel),
  };
}
