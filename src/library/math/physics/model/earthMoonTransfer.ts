/**
 * Earth-Moon translunar trajectories in a planar model: the Earth fixed, the Moon on a circular
 * orbit about it, the spacecraft a test particle in their combined gravity, integrated with RK4 (the
 * Moon moving within each step). In this model the Jacobi integral, the spacecraft's energy measured
 * in the frame that turns with the Moon, is conserved exactly, so its drift measures the
 * integrator's error: ordinary energy is not conserved, since the Moon's pull changes with time.
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
import { dist, dot, mag, sub, vec2, type Vec2 } from './vector2';

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
 * A free return in this model: a tangential burn of 3,165 m/s from the 185 km parking orbit at
 * −132° (the Moon starting at 0°) swings behind the Moon about 4,000 km above its surface near 69 h
 * and comes back to Earth's atmosphere near 182 h with no further burn. Found by searching angle and
 * burn; wider than Apollo's (about 250 km), since the Earth here is fixed and the motion planar.
 */
export const FREE_RETURN_CONFIG: TranslunarConfig = {
  parkingAltitude: 185_000,
  tliDeltaV: 3165,
  injectionAngle: (-132 * Math.PI) / 180,
  durationHours: 200,
  dt: 60,
};

/** The altitude at which a returning spacecraft meets the atmosphere: 400,000 ft. */
export const ENTRY_INTERFACE = 121_920;

/** The Moon's angular speed about the Earth in this model. */
export const MOON_OMEGA = (2 * Math.PI) / 2.36e6;

/**
 * The Jacobi integral: energy in the frame turning with the Moon, ½|v − ω×r|² − ½ω²|r|² − μE/|r| −
 * μM/|r − rM|. Conserved exactly by the model's motion; the integrator's drift in it is its error.
 */
export function jacobiIntegral(pos: Vec2, vel: Vec2, t: number): number {
  const w = MOON_OMEGA;
  const vRot = vec2(vel.x + w * pos.y, vel.y - w * pos.x);
  const moon = getMoonPosition(t);
  return 0.5 * dot(vRot, vRot) - 0.5 * w * w * dot(pos, pos) - MU_EARTH / mag(pos) - MU_MOON / dist(pos, moon);
}

/**
 * Computes Moon's 2D position at time t (seconds) assuming circular orbit in XY plane.
 */
export function getMoonPosition(t: number): Vec2 {
  const theta = MOON_OMEGA * t;
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
  /** Whether the closest approach to the Moon was on its far side, seen from the Earth. */
  readonly passedBehindMoon: boolean;
  /** When the spacecraft reached the atmosphere on its way back, if it did (seconds). */
  readonly returnedAt: number | null;
  /** The largest change in the Jacobi integral over the flight, relative to its starting value. */
  readonly jacobiDrift: number;
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
  const jacobi0 = jacobiIntegral(pos0, vel0, 0);
  let jacobiDrift = 0;
  let returnedAt: number | null = null;
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

    jacobiDrift = Math.max(jacobiDrift, Math.abs((jacobiIntegral(state.pos, state.vel, t) - jacobi0) / jacobi0));

    // Back at the atmosphere after the flyby: a free return ends here.
    if (minMoonPoint && t > minMoonPoint.t + 3600 && dEarth < RADIUS_EARTH + ENTRY_INTERFACE) {
      returnedAt = t;
      if (!trajectory.includes(pt)) trajectory.push(pt);
      break;
    }
    // Stop if collided with Earth or Moon surface
    if (dEarth < RADIUS_EARTH || dMoon < RADIUS_MOON) {
      break;
    }

    // Step physics using combined Earth-Moon gravity, the Moon moving within the step.
    state = stepRK4(state, (p, _v, tt) => earthMoonAccel(p, getMoonPosition(tt)), cfg.dt, t);
    t += cfg.dt;
    stepIndex++;
  }

  const bestApproach = minMoonPoint ?? trajectory[0];
  const lunarAlt = bestApproach.distMoon - RADIUS_MOON;

  const passedBehindMoon = dot(sub(bestApproach.pos, bestApproach.moonPos), bestApproach.moonPos) > 0;
  // A free return: around the far side of the Moon and back to the atmosphere with no burn.
  const isFreeReturn = passedBehindMoon && returnedAt !== null;
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
    passedBehindMoon,
    returnedAt,
    jacobiDrift,
  };
}
