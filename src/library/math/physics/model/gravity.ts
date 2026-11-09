/**
 * Gravitational fields, Keplerian orbits, and celestial astrodynamics.
 * Pure model: zero React/framework dependencies.
 */

import { cross, dist, mag, magSq, scale, sub, vec2, type Vec2 } from './vector2';

// Standard Physical Constants (SI Units: meters, kilograms, seconds)
export const G_CONSTANT = 6.6743e-11;

/** Standard Gravitational Parameter μ = G*M */
export const MU_EARTH = 3.986004418e14; // m^3 / s^2
export const MU_MOON = 4.9048695e12;   // m^3 / s^2

export const RADIUS_EARTH = 6.371e6;   // 6,371 km
export const RADIUS_MOON = 1.7374e6;   // 1,737.4 km

export const DISTANCE_EARTH_MOON = 384.4e6; // 384,400 km
export const MOON_ORBITAL_SPEED = 1022;     // ~1.022 km/s around Earth
export const MOON_ORBITAL_PERIOD = 2.36e6;  // ~27.3 days in seconds

/** Lunar Moon Sphere of Influence (Laplace SOI radius ~ 66,100 km) */
export const MOON_SOI_RADIUS = 6.61e7;

export interface OrbitElements {
  /** Specific orbital energy (J/kg) */
  readonly specificEnergy: number;
  /** Semi-major axis in meters (a > 0 for ellipse, a < 0 for hyperbola) */
  readonly semiMajorAxis: number;
  /** Specific relative angular momentum (m^2/s) */
  readonly angularMomentum: number;
  /** Orbital eccentricity (0 = circular, 0 < e < 1 = elliptical, e = 1 parabolic, e > 1 hyperbolic) */
  readonly eccentricity: number;
  /** Periapsis distance from center (meters) */
  readonly periapsis: number;
  /** Apoapsis distance from center (meters, null for hyperbolic escape) */
  readonly apoapsis: number | null;
  /** Orbital period in seconds (null if unbound / hyperbolic) */
  readonly period: number | null;
  /** Current true anomaly angle in radians */
  readonly trueAnomaly: number;
}

/**
 * Calculates gravitational acceleration towards a central point mass:
 * a = -μ / r^2 * (r_hat) = -μ * r_vec / |r|^3
 */
export function centralBodyAccel(pos: Vec2, centerPos: Vec2 = vec2(0, 0), mu: number = MU_EARTH, softeningSq: number = 0): Vec2 {
  const rVec = sub(pos, centerPos);
  const rSq = magSq(rVec) + softeningSq;
  const r = Math.sqrt(rSq);
  if (r < 1e-6) return vec2(0, 0);
  const factor = -mu / (rSq * r);
  return scale(rVec, factor);
}

/**
 * Combined Earth-Moon gravitational field.
 */
export function earthMoonAccel(
  pos: Vec2,
  moonPos: Vec2,
  muEarth: number = MU_EARTH,
  muMoon: number = MU_MOON
): Vec2 {
  const aEarth = centralBodyAccel(pos, vec2(0, 0), muEarth);
  const aMoon = centralBodyAccel(pos, moonPos, muMoon);
  return {
    x: aEarth.x + aMoon.x,
    y: aEarth.y + aMoon.y,
  };
}

/** Vis-Viva equation: v^2 = μ * (2/r - 1/a) */
export function visVivaVelocity(r: number, a: number, mu: number = MU_EARTH): number {
  const vSq = mu * (2 / r - 1 / a);
  return vSq > 0 ? Math.sqrt(vSq) : 0;
}

/** Circular orbit speed at radius r: v = sqrt(μ / r) */
export function circularOrbitSpeed(r: number, mu: number = MU_EARTH): number {
  return Math.sqrt(mu / r);
}

/** Escape velocity at radius r: v = sqrt(2 * μ / r) */
export function escapeSpeed(r: number, mu: number = MU_EARTH): number {
  return Math.sqrt((2 * mu) / r);
}

/**
 * Extracts 2D Keplerian orbital elements from state vector relative to central body.
 */
export function calculateOrbitElements(pos: Vec2, vel: Vec2, mu: number = MU_EARTH): OrbitElements {
  const r = mag(pos);
  const vSq = magSq(vel);
  const specificEnergy = vSq / 2 - mu / r;

  // Semi-major axis
  const semiMajorAxis = -mu / (2 * specificEnergy);

  // Angular momentum: h = r x v (z-scalar in 2D)
  const angularMomentum = cross(pos, vel);

  // Eccentricity vector: e_vec = (v x h)/μ - r_hat
  // In 2D: (v x h)_x = v_y * h, (v x h)_y = -v_x * h
  const vxH_x = vel.y * angularMomentum;
  const vxH_y = -vel.x * angularMomentum;
  const rHat_x = pos.x / r;
  const rHat_y = pos.y / r;

  const eVec_x = vxH_x / mu - rHat_x;
  const eVec_y = vxH_y / mu - rHat_y;
  const eccentricity = Math.hypot(eVec_x, eVec_y);

  const periapsis = semiMajorAxis * (1 - eccentricity);
  const apoapsis = eccentricity < 1 ? semiMajorAxis * (1 + eccentricity) : null;
  const period = (eccentricity < 1 && semiMajorAxis > 0)
    ? 2 * Math.PI * Math.sqrt((semiMajorAxis ** 3) / mu)
    : null;

  // True anomaly: angle between eccentricity vector and position vector
  const dotER = eVec_x * pos.x + eVec_y * pos.y;
  const crossER = eVec_x * pos.y - eVec_y * pos.x;
  const trueAnomaly = Math.atan2(crossER, dotER);

  return {
    specificEnergy,
    semiMajorAxis,
    angularMomentum,
    eccentricity,
    periapsis,
    apoapsis,
    period,
    trueAnomaly,
  };
}
