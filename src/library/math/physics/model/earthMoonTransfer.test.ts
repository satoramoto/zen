import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRANSLUNAR_CONFIG,
  getMoonPosition,
  simulateTranslunarTrajectory,
} from './earthMoonTransfer';
import { dist, mag, vec2 } from './vector2';

describe('translunar transfer simulation', () => {
  it('computes Moon position on orbit', () => {
    const moon0 = getMoonPosition(0);
    expect(mag(moon0)).toBeCloseTo(384.4e6, -4);
  });

  it('simulates translunar trajectory and reaches Moon vicinity', () => {
    // 3,180 m/s TLI injection at -137 deg produces Apollo-like lunar encounter in ~60-65 hours
    const sim = simulateTranslunarTrajectory({
      tliDeltaV: 3180,
      injectionAngle: (-137 * Math.PI) / 180,
      durationHours: 72,
      dt: 60,
    });

    expect(sim.trajectory.length).toBeGreaterThan(10);
    // Closest approach should reach Moon vicinity (< 10,000 km)
    expect(sim.closestMoonApproach.dist).toBeLessThan(10_000_000);
    // Transit time to Moon is ~55 to 65 hours (~200,000 to 240,000 seconds)
    expect(sim.closestMoonApproach.time).toBeGreaterThan(190_000);
    expect(sim.closestMoonApproach.time).toBeLessThan(250_000);
  });
});
