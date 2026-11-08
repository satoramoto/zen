/**
 * Earth-Moon translunar orbital trajectory simulation (Apollo 8 / Apollo 11).
 * Pure model: zero React/framework dependencies.
 */

import {
  DISTANCE_EARTH_MOON,
  earthMoonAccel,
  MU_EARTH,
  MU_MOON,
  RADIUS_EARTH,
  RADIUS_MOON,
} from './gravity';
import { stepRK4, type State2D } from './integrator';
import { add, dist, mag, norm, rotate, scale, vec2, type Vec2 } from './vector2';

export interface TrajectoryPoint {
  readonly t: number; // seconds
  readonly pos: Vec2;
  readonly vel: Vec2;
  readonly moonPos: Vec2;
  readonly distEarth: number;
  readonly distMoon: number;
}

export interface TranslunarConfig {
  /** LEO parking orbit altitude in meters (default: 185,000 m / 100 nmi) */
  readonly parkingAltitude: number;
  /** Trans-Lunar Injection delta-v in m/s (approx 3,050 to 3,150 m/s) */
  readonly tliDeltaV: number;
  /** Angle of injection around Earth relative to Moon position in radians */
  readonly injectionAngle: number;
  /** Total simulation duration in hours (e.g. 72 hours) */
  readonly durationHours: number;
  /** Integrator step size in seconds (e.g. 30s) */
  readonly dt: number;
}

export const DEFAULT_TRANSLUNAR_CONFIG: TranslunarConfig = {
  parkingAltitude: 185_000,
  tliDeltaV: 3180,
  injectionAngle: (-137 * Math.PI) / 180, // ~223 degrees offset (leading Moon)
  durationHours: 72,
  dt: 30,
};

/**
 * Computes Moon's 2D position at time t (seconds) assuming circular orbit in XY plane.
 */
export function getMoonPosition(t: number): Vec2 {
  // Angular rate omega = 2*PI / period
  const omega = (2 * Math.PI) / 2.36e6; // ~27.32 days
  const theta = omega * t;
  return vec2(DISTANCE_EARTH_MOON * Math.cos(theta), DISTANCE_EARTH_MOON * Math.sin(theta));
}

/**
 * Simulates the translunar flight path from LEO burnout to lunar encounter.
 */
export function simulateTranslunarTrajectory(
  config: Partial<TranslunarConfig> = {}
): {
  readonly trajectory: TrajectoryPoint[];
  readonly closestMoonApproach: {
    readonly dist: number;
    readonly altitude: number;
    readonly time: number;
    readonly point: TrajectoryPoint;
  };
  readonly isLunarCaptureCapable: boolean;
  readonly isFreeReturn: boolean;
} {
  const cfg = { ...DEFAULT_TRANSLUNAR_CONFIG, ...config };

  const rLeo = RADIUS_EARTH + cfg.parkingAltitude;
  // Circular speed in LEO: v = sqrt(μ / r)
  const vCirc = Math.sqrt(MU_EARTH / rLeo);
  // Total velocity after TLI burn
  const vTli = vCirc + cfg.tliDeltaV;

  // Spacecraft initial position and velocity at injection
  const pos0 = vec2(rLeo * Math.cos(cfg.injectionAngle), rLeo * Math.sin(cfg.injectionAngle));
  // Tangential velocity vector (perpendicular to radius vector)
  const vel0 = vec2(-vTli * Math.sin(cfg.injectionAngle), vTli * Math.cos(cfg.injectionAngle));

  let state: State2D = { pos: pos0, vel: vel0 };
  let t = 0;
  const maxT = cfg.durationHours * 3600;

  const trajectory: TrajectoryPoint[] = [];
  let minMoonDist = Infinity;
  let minMoonPoint: TrajectoryPoint | null = null;

  // Record every N steps to keep memory bounded and rendering light
  const recordInterval = Math.max(1, Math.round(300 / cfg.dt)); // record every ~5 minutes of flight
  let stepIndex = 0;

  while (t <= maxT) {
    const moonPos = getMoonPosition(t);
    const dEarth = mag(state.pos);
    const dMoon = dist(state.pos, moonPos);

    const pt: TrajectoryPoint = {
      t,
      pos: state.pos,
      vel: state.vel,
      moonPos,
      distEarth: dEarth,
      distMoon: dMoon,
    };

    if (stepIndex % recordInterval === 0 || dMoon < minMoonDist) {
      trajectory.push(pt);
    }

    if (dMoon < minMoonDist) {
      minMoonDist = dMoon;
      minMoonPoint = pt;
    }

    // Stop if collided with Earth or Moon surface
    if (dEarth < RADIUS_EARTH || dMoon < RADIUS_MOON) {
      break;
    }

    // Step physics using combined Earth-Moon gravity
    const accelFn = (p: Vec2) => earthMoonAccel(p, moonPos);
    state = stepRK4(state, accelFn, cfg.dt, t);
    t += cfg.dt;
    stepIndex++;
  }

  const bestApproach = minMoonPoint ?? trajectory[0];
  const lunarAlt = bestApproach.distMoon - RADIUS_MOON;

  // Free return check: does trajectory sling around moon and head back towards Earth (< 50,000 km)
  const finalEarthDist = trajectory[trajectory.length - 1].distEarth;
  const isFreeReturn = lunarAlt < 20_000_000 && finalEarthDist < 80_000_000;
  const isLunarCaptureCapable = lunarAlt > 50_000 && lunarAlt < 2_000_000;

  return {
    trajectory,
    closestMoonApproach: {
      dist: bestApproach.distMoon,
      altitude: lunarAlt,
      time: bestApproach.t,
      point: bestApproach,
    },
    isLunarCaptureCapable,
    isFreeReturn,
  };
}
