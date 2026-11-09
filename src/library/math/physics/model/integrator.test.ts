import { describe, expect, it } from 'vitest';
import { stepEuler, stepRK4, stepSymplecticEuler } from './integrator';
import { magSq, vec2 } from './vector2';

describe('integrators', () => {
  it('predicts constant acceleration motion accurately with RK4', () => {
    // Constant gravity: a = [0, -9.8]
    const g = vec2(0, -9.8);
    const accel = () => g;

    let state = { pos: vec2(0, 100), vel: vec2(10, 0) };
    const dt = 0.1;
    for (let i = 0; i < 10; i++) {
      state = stepRK4(state, accel, dt);
    }
    // After t = 1.0s:
    // x = 10 * 1 = 10
    // y = 100 - 0.5 * 9.8 * 1^2 = 95.1
    // vy = -9.8 * 1 = -9.8
    expect(state.pos.x).toBeCloseTo(10, 5);
    expect(state.pos.y).toBeCloseTo(95.1, 5);
    expect(state.vel.x).toBeCloseTo(10, 5);
    expect(state.vel.y).toBeCloseTo(-9.8, 5);
  });

  it('demonstrates superior energy preservation of Symplectic Euler and RK4 over standard Euler on Harmonic Oscillator', () => {
    // Harmonic oscillator: a = -k * x
    const k = 1;
    const accel = (pos: { x: number; y: number }) => vec2(-k * pos.x, -k * pos.y);

    let stateEuler = { pos: vec2(1, 0), vel: vec2(0, 1) };
    let stateSymplectic = { pos: vec2(1, 0), vel: vec2(0, 1) };
    let stateRK4 = { pos: vec2(1, 0), vel: vec2(0, 1) };

    const initialEnergy = 0.5 * (magSq(stateEuler.pos) + magSq(stateEuler.vel));

    const dt = 0.05;
    const steps = 200; // 10 seconds (approx 1.5 orbits)

    for (let i = 0; i < steps; i++) {
      stateEuler = stepEuler(stateEuler, accel, dt);
      stateSymplectic = stepSymplecticEuler(stateSymplectic, accel, dt);
      stateRK4 = stepRK4(stateRK4, accel, dt);
    }

    const energyEuler = 0.5 * (magSq(stateEuler.pos) + magSq(stateEuler.vel));
    const energySymplectic = 0.5 * (magSq(stateSymplectic.pos) + magSq(stateSymplectic.vel));
    const energyRK4 = 0.5 * (magSq(stateRK4.pos) + magSq(stateRK4.vel));

    // Forward Euler drastically gains artificial energy
    expect(energyEuler).toBeGreaterThan(initialEnergy * 1.5);

    // Symplectic Euler bounds energy oscillation
    expect(Math.abs(energySymplectic - initialEnergy)).toBeLessThan(0.05);

    // RK4 maintains ultra-high precision energy conservation
    expect(Math.abs(energyRK4 - initialEnergy)).toBeLessThan(1e-5);
  });
});
