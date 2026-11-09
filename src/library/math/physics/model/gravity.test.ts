import { describe, expect, it } from 'vitest';
import {
  calculateOrbitElements,
  circularOrbitSpeed,
  escapeSpeed,
  MU_EARTH,
  RADIUS_EARTH,
  visVivaVelocity,
} from './gravity';
import { vec2 } from './vector2';

describe('gravity and orbital mechanics', () => {
  it('calculates correct circular speed and escape speed for Low Earth Orbit (LEO)', () => {
    const rLeo = RADIUS_EARTH + 200_000; // 200 km altitude
    const vCirc = circularOrbitSpeed(rLeo, MU_EARTH);
    // ~7,788.5 m/s (approx 7.8 km/s)
    expect(vCirc).toBeCloseTo(7788.5, 0);

    const vEsc = escapeSpeed(rLeo, MU_EARTH);
    // Escape speed is sqrt(2) * circular speed
    expect(vEsc).toBeCloseTo(vCirc * Math.SQRT2, 1);
  });

  it('determines circular orbit elements properly', () => {
    const r = RADIUS_EARTH + 300_000; // 300 km altitude
    const v = circularOrbitSpeed(r, MU_EARTH);

    const pos = vec2(r, 0);
    const vel = vec2(0, v);

    const orb = calculateOrbitElements(pos, vel, MU_EARTH);
    expect(orb.eccentricity).toBeCloseTo(0, 4);
    expect(orb.semiMajorAxis).toBeCloseTo(r, -2);
    expect(orb.periapsis).toBeCloseTo(r, -2);
    expect(orb.apoapsis).toBeCloseTo(r, -2);

    // Orbital period ~90.5 minutes
    const periodMinutes = orb.period! / 60;
    expect(periodMinutes).toBeGreaterThan(89);
    expect(periodMinutes).toBeLessThan(92);
  });

  it('determines elliptical transfer orbit elements properly', () => {
    const rPeriapsis = RADIUS_EARTH + 200_000;
    const rApoapsis = 384_400_000; // Lunar distance
    const a = (rPeriapsis + rApoapsis) / 2;

    const vInjection = visVivaVelocity(rPeriapsis, a, MU_EARTH);
    // TLI velocity is ~10,800 m/s
    expect(vInjection).toBeGreaterThan(10500);
    expect(vInjection).toBeLessThan(11000);

    const pos = vec2(rPeriapsis, 0);
    const vel = vec2(0, vInjection);
    const orb = calculateOrbitElements(pos, vel, MU_EARTH);

    expect(orb.eccentricity).toBeGreaterThan(0.96);
    expect(orb.eccentricity).toBeLessThan(1.0);
    expect(orb.periapsis).toBeCloseTo(rPeriapsis, -3);
    expect(orb.apoapsis).toBeCloseTo(rApoapsis, -3);
  });
});
