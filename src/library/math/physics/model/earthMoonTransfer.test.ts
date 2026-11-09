import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRANSLUNAR_CONFIG,
  ENTRY_INTERFACE,
  FREE_RETURN_CONFIG,
  getMoonPosition,
  jacobiIntegral,
  simulateTranslunarTrajectory,
} from './earthMoonTransfer';
import { RADIUS_EARTH } from './gravity';
import { mag, vec2 } from './vector2';

/** The accuracy the design states: the Jacobi integral's drift over a full transfer at the default 30 s step. */
export const JACOBI_BOUND = 1e-5;
/** And over the free return at its 60 s step. */
export const JACOBI_BOUND_FREE_RETURN = 1e-4;

describe('translunar transfer simulation', () => {
  it('computes Moon position on orbit', () => {
    const moon0 = getMoonPosition(0);
    expect(mag(moon0)).toBeCloseTo(384.4e6, -4);
  });

  it('simulates translunar trajectory and reaches Moon vicinity', () => {
    const sim = simulateTranslunarTrajectory(DEFAULT_TRANSLUNAR_CONFIG);
    expect(sim.trajectory.length).toBeGreaterThan(10);
    // Closest approach should reach Moon vicinity (< 10,000 km)
    expect(sim.closestMoonApproach.dist).toBeLessThan(10_000_000);
    // Transit time to Moon is ~55 to 65 hours (~200,000 to 240,000 seconds)
    expect(sim.closestMoonApproach.time).toBeGreaterThan(190_000);
    expect(sim.closestMoonApproach.time).toBeLessThan(250_000);
  });

  it('keeps the Jacobi integral to within 1e-5 over the full transfer at the default step', () => {
    const sim = simulateTranslunarTrajectory(DEFAULT_TRANSLUNAR_CONFIG);
    expect(DEFAULT_TRANSLUNAR_CONFIG.dt).toBe(30);
    expect(sim.jacobiDrift).toBeLessThan(JACOBI_BOUND);
  });

  it('the Jacobi integral is what the model conserves: a coarse step drifts more', () => {
    const fine = simulateTranslunarTrajectory({ ...DEFAULT_TRANSLUNAR_CONFIG, dt: 30 }).jacobiDrift;
    const coarse = simulateTranslunarTrajectory({ ...DEFAULT_TRANSLUNAR_CONFIG, dt: 120 }).jacobiDrift;
    expect(coarse).toBeGreaterThan(fine * 10);
    expect(Number.isFinite(jacobiIntegral(vec2(7e6, 0), vec2(0, 10_000), 0))).toBe(true);
  });

  it('the free return passes behind the Moon and comes back to the atmosphere without a burn', () => {
    const sim = simulateTranslunarTrajectory(FREE_RETURN_CONFIG);
    expect(sim.passedBehindMoon).toBe(true);
    expect(sim.returnedAt).not.toBeNull();
    expect(sim.isFreeReturn).toBe(true);
    const last = sim.trajectory[sim.trajectory.length - 1];
    expect(last.distEarth).toBeLessThan(RADIUS_EARTH + ENTRY_INTERFACE);
    expect(sim.jacobiDrift).toBeLessThan(JACOBI_BOUND_FREE_RETURN);
  });

  it('the default transfer is not a free return: it passes the near side', () => {
    const sim = simulateTranslunarTrajectory(DEFAULT_TRANSLUNAR_CONFIG);
    expect(sim.isFreeReturn).toBe(false);
  });
});
