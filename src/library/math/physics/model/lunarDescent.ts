// The Lunar Module's powered descent, from ignition to touchdown, guided as Luminary 099 guided it.
// Pure model: no framework.
//
// The Moon is a sphere and the motion is planar (the descent's out-of-plane steering is left out).
// Guidance works, as Luminary's does, in a frame with its origin at the landing site: x downrange
// (negative before the site), y up. Every two seconds (SERVICER.agc line 73) guidance solves for the
// time to go to the current phase's target and commands an acceleration with the quadratic law
// (LUNAR_LANDING_GUIDANCE_EQUATIONS.agc line 530); the throttle and attitude follow. The phases:
// P63 braking until its time to go falls below TENDBRAK (line 692), P64 approach until its time to
// go falls below TENDAPPR, then P65 automatic vertical descent; a click of the rate-of-descent
// switch during automatic landing moves to P66 (line 205), which holds the commanded rate and lets
// each click change it by RODSCALE (line 953). Each pass also runs the executive (executive.ts),
// which raises 1202 or 1201 when the computer is overloaded. `sources.ts` holds every number.
import { CORE_SETS, requestMonitor, runCycle, startExecutive, type ExecutiveState } from './executive';
import { G0 } from './rocket';
import { DESCENT_SOURCES, src, toGet } from './sources';
import { add, dot, mag, norm, scale, sub, vec2, type Vec2 } from './vector2';

export type DescentProgram = 'P63' | 'P64' | 'P65' | 'P66';
export type DescentStatus = 'awaiting-ignition' | 'flying' | 'landed' | 'crashed' | 'out-of-propellant';

export interface LogEntry {
  /** Seconds after ignition. */
  t: number;
  /** Ground elapsed time, as the mission counted it. */
  get: string;
  kind: 'program' | 'alarm' | 'restart' | 'throttle' | 'crew' | 'touchdown' | 'propellant';
  text: string;
  code?: number;
}

export interface DescentLoad {
  /** The share of each cycle the rendezvous radar steals. Apollo 11's radar switch let it steal about 13%. */
  radarSteal: number;
  /** Seconds after ignition at which the crew calls up the V16N68 monitor display. */
  monitorRequests: number[];
}

export interface DescentState {
  /** Seconds after ignition (negative before it). */
  t: number;
  status: DescentStatus;
  program: DescentProgram;
  /** Moon-centred position and velocity (m, m/s); the landing site is at (0, R). */
  pos: Vec2;
  vel: Vec2;
  mass: number;
  propellant: number;
  /** The thrust acceleration the engine is giving, as a vector (m/s²). */
  thrustAccel: Vec2;
  /** The engine's force as a share of full throttle (FMAXODD). */
  throttle: number;
  /** The current phase's time to go (s, negative, as the AGC counts it). */
  ttf: number;
  /** Seconds until the next guidance pass. */
  nextPass: number;
  /** The descent rate P65 and P66 hold (m/s, negative down). */
  desiredRate: number;
  /** Rate-switch clicks waiting for the next pass (positive slows the descent). */
  rodClicks: number;
  executive: ExecutiveState;
  load: DescentLoad;
  /** Program alarms in order: the DSKY shows them. */
  alarms: number[];
  log: LogEntry[];
  /** Whether the throttle has come down from full (logged once). */
  throttleRecovered: boolean;
}

export const MOON_RADIUS = src('moonRadius');
const MU = src('moonMu');
const FULL = src('fullThrottle');
const MAXPOS = src('maxPositionable');
/** Specific impulse from the source's rated thrust and flow. */
export const DPS_ISP = src('thrust') / (src('massFlow') * G0);
const STEP = 0.1;
const SITE = vec2(0, MOON_RADIUS);

export const NO_LOAD: DescentLoad = { radarSteal: 0, monitorRequests: [] };
/** Apollo 11's: the radar stealing time throughout, and Aldrin calling up N68 at the times the alarms followed. */
export const APOLLO_11_LOAD: DescentLoad = { radarSteal: src('radarSteal'), monitorRequests: [309, 349, 545, 570, 585] };

/** The state at powered descent ignition, waiting for the crew's PRO (V99N62). */
export function ignitionState(load: DescentLoad = NO_LOAD): DescentState {
  const h = src('ignitionAltitude');
  const phi = -src('ignitionRange') / MOON_RADIUS;
  const r = MOON_RADIUS + h;
  const v = src('ignitionSpeed');
  return {
    t: 0,
    status: 'awaiting-ignition',
    program: 'P63',
    pos: vec2(r * Math.sin(phi), r * Math.cos(phi)),
    vel: vec2(v * Math.cos(phi), -v * Math.sin(phi)),
    mass: src('massAtIgnition'),
    propellant: src('descentPropellant'),
    thrustAccel: vec2(0, 0),
    throttle: 0,
    ttf: -600,
    nextPass: 0,
    desiredRate: src('verticalRate'),
    rodClicks: 0,
    executive: startExecutive(),
    load,
    alarms: [],
    log: [],
    throttleRecovered: false,
  };
}

const logAt = (state: DescentState, kind: LogEntry['kind'], text: string, code?: number): LogEntry => ({ t: state.t, get: toGet(state.t), kind, text, code });

/** Gravity at a Moon-centred position. */
export const gravity = (p: Vec2): Vec2 => scale(p, -MU / Math.pow(mag(p), 3));

/** Altitude above the (spherical) surface. */
export const altitude = (s: { pos: Vec2 }) => mag(s.pos) - MOON_RADIUS;

/** Local up and local downrange (horizontal, in the direction of travel toward the site). */
export function localAxes(p: Vec2): { up: Vec2; downrange: Vec2 } {
  const up = norm(p);
  return { up, downrange: vec2(up.y, -up.x) };
}

/** Altitude rate and horizontal speed, as the crew read them. */
export function rates(s: { pos: Vec2; vel: Vec2 }): { altitudeRate: number; horizontal: number } {
  const { up, downrange } = localAxes(s.pos);
  return { altitudeRate: dot(s.vel, up), horizontal: dot(s.vel, downrange) };
}

/** Ground distance to the landing site (negative before it). */
export const rangeToSite = (s: { pos: Vec2 }) => MOON_RADIUS * Math.atan2(s.pos.x, s.pos.y);

/** A phase's targets in the guidance frame: position, velocity, acceleration. */
function targets(program: 'P63' | 'P64'): { r: Vec2; v: Vec2; a: Vec2 } {
  return program === 'P63'
    ? { r: vec2(src('brakingTargetX'), src('brakingTargetY')), v: vec2(src('brakingTargetVX'), src('brakingTargetVY')), a: vec2(src('brakingTargetAX'), src('brakingTargetAY')) }
    : { r: vec2(src('approachTargetX'), src('approachTargetY')), v: vec2(src('approachTargetVX'), src('approachTargetVY')), a: vec2(src('approachTargetAX'), src('approachTargetAY')) };
}

/**
 * Time to go: the negative root of the downrange equation 6·ADG·T² + (18·VDG + 6·VG)·T +
 * 24(RDG − RG) = 0 (the jerk term taken as zero), nearest the last value.
 */
export function timeToGo(rg: Vec2, vg: Vec2, t: { r: Vec2; v: Vec2; a: Vec2 }, previous: number): number {
  const a = 6 * t.a.x;
  const b = 18 * t.v.x + 6 * vg.x;
  const c = 24 * (t.r.x - rg.x);
  let roots: number[];
  if (Math.abs(a) < 1e-9) roots = [-c / b];
  else {
    const disc = b * b - 4 * a * c;
    if (disc < 0) return previous;
    roots = [(-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a)];
  }
  const negative = roots.filter((x) => x < 0 && Number.isFinite(x));
  if (!negative.length) return -1e-3;
  return negative.reduce((best, x) => (Math.abs(x - previous) < Math.abs(best - previous) ? x : best));
}

/** The quadratic guidance law: ACG = ADG + 6(VDG + VG)/TTF + 12(RDG − RG)/TTF². */
export function quadraticGuidance(rg: Vec2, vg: Vec2, t: { r: Vec2; v: Vec2; a: Vec2 }, ttf: number): Vec2 {
  return add(add(t.a, scale(add(t.v, vg), 6 / ttf)), scale(sub(t.r, rg), 12 / (ttf * ttf)));
}

/** One guidance pass: switch phase if its time is up, command a thrust acceleration, run the executive. */
function guidancePass(state: DescentState): DescentState {
  let s = { ...state, log: [...state.log], alarms: [...state.alarms] };
  // A click of the rate switch during automatic landing moves to P66 at the current rate (lines 205, 147).
  if (s.rodClicks !== 0 && s.program !== 'P66' && (s.program === 'P64' || s.program === 'P65')) {
    s.program = 'P66';
    s.desiredRate = rates(s).altitudeRate;
    // The entering click starts P66 and is then zeroed (line 190): it doesn't change the rate.
    s.rodClicks = 0;
    s.log.push(logAt(s, 'program', 'P66: rate of descent, entered by the rate switch'));
  }
  if (s.program === 'P66' && s.rodClicks !== 0) {
    s.desiredRate += s.rodClicks * src('rodClick');
    s.rodClicks = 0;
  }
  let afc: Vec2;
  const g = gravity(s.pos);
  if (s.program === 'P63' || s.program === 'P64') {
    const rg = sub(s.pos, SITE);
    const tg = targets(s.program);
    // Re-solved each pass from the last value; it may not fall behind the clock (see `sources.ts`, timeToGo).
    s.ttf = Math.max(timeToGo(rg, s.vel, tg, s.ttf), s.ttf + src('guidancePeriod'));
    const end = s.program === 'P63' ? src('brakingEnd') : src('approachEnd');
    if (s.ttf > -end) {
      if (s.program === 'P63') {
        s.program = 'P64';
        s.log.push(logAt(s, 'program', 'P64: approach, at high gate'));
        s.ttf = timeToGo(rg, s.vel, targets('P64'), -120);
      } else {
        s.program = 'P65';
        s.desiredRate = src('verticalRate');
        s.log.push(logAt(s, 'program', 'P65: automatic vertical descent, at low gate'));
      }
    }
  }
  if (s.program === 'P63' || s.program === 'P64') {
    const rg = sub(s.pos, SITE);
    const acg = quadraticGuidance(rg, s.vel, targets(s.program), s.ttf);
    afc = sub(acg, g);
  } else {
    // P65 and P66: hold the desired descent rate (TAUROD) and null the horizontal speed.
    const { up, downrange } = localAxes(s.pos);
    const { altitudeRate, horizontal } = rates(s);
    const vertical = (s.desiredRate - altitudeRate) / src('rodTimeConstant');
    const sideways = -horizontal / 4;
    afc = sub(add(scale(up, vertical), scale(downrange, sideways)), g);
  }
  // The throttle: full until guidance asks for less than the recovery share; then it follows.
  let force = s.mass * mag(afc);
  if (s.program === 'P63' && !s.throttleRecovered && force > src('throttleRecovery') * FULL) force = FULL;
  else {
    if (!s.throttleRecovered && s.status === 'flying' && s.t > 1) {
      s.throttleRecovered = true;
      s.log.push(logAt(s, 'throttle', 'Throttle recovery: the engine comes down from full throttle'));
    }
    force = Math.min(MAXPOS, Math.max(0.1 * FULL, force));
  }
  if (s.propellant <= 0) force = 0;
  s.throttle = force / FULL;
  s.thrustAccel = scale(norm(afc), force / s.mass);
  // The executive: this pass's jobs, the radar's steal, any monitor display the crew has asked for.
  let exec = s.executive;
  if (s.load.monitorRequests.some((t) => t > s.t - src('guidancePeriod') && t <= s.t)) {
    exec = requestMonitor(exec);
    s.log.push(logAt(s, 'crew', 'V16N68: the crew calls up the range, time to go and altitude monitor'));
  }
  const cycle = runCycle(exec, { radarSteal: s.load.radarSteal, phaseExtra: s.program === 'P64' ? 0.02 : 0 });
  s.executive = cycle.state;
  if (cycle.alarm) {
    s.alarms.push(cycle.alarm);
    s.log.push(logAt(s, 'alarm', cycle.alarm === 1202 ? '1202: no core sets available' : '1201: no VAC areas available', cycle.alarm));
    s.log.push(logAt(s, 'restart', 'Restart: jobs dropped, guidance and navigation carry on, the monitor display is shed'));
  }
  return s;
}

export interface Controls {
  /** Rate-switch clicks this step: +1 slows the descent by RODSCALE, −1 speeds it. */
  rodClicks?: number;
  /** The crew calls up V16N68 now. */
  monitor?: boolean;
}

/** The crew presses PRO on V99N62: the engine lights. */
export function ignite(state: DescentState): DescentState {
  if (state.status !== 'awaiting-ignition') return state;
  const s = { ...state, status: 'flying' as const, log: [...state.log] };
  s.log.push(logAt(s, 'program', 'P63: braking. Ignition, the crew having pressed PRO on V99N62'));
  return { ...s, nextPass: 0 };
}

/** Advance by `dt` seconds (in internal steps of 0.1 s), applying the crew's controls first. */
export function stepDescent(state: DescentState, dt: number, controls: Controls = {}): DescentState {
  if (state.status !== 'flying') return state;
  let s: DescentState = { ...state, rodClicks: state.rodClicks + (controls.rodClicks ?? 0) };
  if (controls.monitor) s = { ...s, load: { ...s.load, monitorRequests: [...s.load.monitorRequests, s.t + 1e-6] } };
  let left = dt;
  while (left > 1e-9 && s.status === 'flying') {
    const h = Math.min(STEP, left);
    if (s.nextPass <= 1e-9) s = { ...guidancePass(s), nextPass: src('guidancePeriod') };
    // Integrate with RK4, thrust held over the step.
    const accel = (p: Vec2) => add(gravity(p), s.thrustAccel);
    const k1v = accel(s.pos);
    const k1r = s.vel;
    const k2v = accel(add(s.pos, scale(k1r, h / 2)));
    const k2r = add(s.vel, scale(k1v, h / 2));
    const k3v = accel(add(s.pos, scale(k2r, h / 2)));
    const k3r = add(s.vel, scale(k2v, h / 2));
    const k4v = accel(add(s.pos, scale(k3r, h)));
    const k4r = add(s.vel, scale(k3v, h));
    const pos = add(s.pos, scale(add(add(k1r, scale(k2r, 2)), add(scale(k3r, 2), k4r)), h / 6));
    const vel = add(s.vel, scale(add(add(k1v, scale(k2v, 2)), add(scale(k3v, 2), k4v)), h / 6));
    const force = s.throttle * FULL;
    const burned = Math.min(s.propellant, (force / (DPS_ISP * G0)) * h);
    left -= h;
    s = { ...s, t: s.t + h, pos, vel, mass: s.mass - burned, propellant: s.propellant - burned, nextPass: s.nextPass - h };
    if (s.propellant <= 0 && force > 0) {
      s = { ...s, status: 'out-of-propellant', throttle: 0, log: [...s.log, logAt(s, 'propellant', 'Propellant exhausted')] };
      break;
    }
    if (altitude(s) <= 0) {
      const { altitudeRate, horizontal } = rates(s);
      const soft = Math.abs(altitudeRate) <= src('touchdownVertical') && Math.abs(horizontal) <= src('touchdownHorizontal');
      const text = `${soft ? 'Touchdown' : 'Impact'} at ${(-altitudeRate / 0.3048).toFixed(1)} ft/s down, ${(Math.abs(horizontal) / 0.3048).toFixed(1)} ft/s across, ${Math.round(s.propellant)} kg of propellant left`;
      s = { ...s, status: soft ? 'landed' : 'crashed', throttle: 0, thrustAccel: vec2(0, 0), log: [...s.log, logAt(s, 'touchdown', text)] };
    }
  }
  return s;
}

/** Fly from ignition until the state stops changing (landed, crashed, out of propellant) or `limit` seconds pass. */
export function flyToEnd(state: DescentState, limit = 1500, until?: (s: DescentState) => boolean): DescentState {
  let s = state.status === 'awaiting-ignition' ? ignite(state) : state;
  while (s.status === 'flying' && s.t < limit && !(until && until(s))) s = stepDescent(s, 1);
  return s;
}

/** The numbers the displays and the DSKY read, in SI units. */
export interface DescentReadout {
  altitude: number;
  altitudeRate: number;
  horizontal: number;
  speed: number;
  range: number;
  /** Straight-line distance to the landing site. */
  slantRange: number;
  ttf: number;
  /** Pitch from local vertical (0 upright), degrees. */
  pitch: number;
  throttle: number;
  propellant: number;
  /** Seconds of propellant left at the current flow. */
  propellantSeconds: number;
  /** How many core sets are in use. */
  coreSets: number;
}

export function readout(s: DescentState): DescentReadout {
  const { altitudeRate, horizontal } = rates(s);
  const { up } = localAxes(s.pos);
  const thrust = mag(s.thrustAccel);
  const pitch = thrust > 1e-6 ? (Math.acos(Math.max(-1, Math.min(1, dot(norm(s.thrustAccel), up)))) * 180) / Math.PI : 0;
  const flow = (s.throttle * FULL) / (DPS_ISP * G0);
  return {
    altitude: altitude(s),
    altitudeRate,
    horizontal,
    speed: mag(s.vel),
    range: rangeToSite(s),
    slantRange: mag(sub(s.pos, SITE)),
    ttf: s.ttf,
    pitch,
    throttle: s.throttle,
    propellant: s.propellant,
    propellantSeconds: flow > 0 ? s.propellant / flow : Infinity,
    coreSets: Math.min(CORE_SETS, s.executive.jobs.length),
  };
}

/** What the DSKY's descent nouns read beyond `readout`: N64's redesignation time and LPD angle, N68's ΔH. */
export interface DskyReadout extends DescentReadout {
  /** Seconds left in which the landing point can be redesignated (P64), 0 otherwise. */
  lpdTime: number;
  /** Degrees between the line of sight to the site and the LM's downward thrust axis. */
  lpdAngle: number;
  /** Landing-radar altitude minus computed altitude: 0 here, as the model has no radar. */
  deltaH: number;
}

export function dskyReadout(s: DescentState): DskyReadout {
  const r = readout(s);
  const los = norm(sub(SITE, s.pos));
  const down = mag(s.thrustAccel) > 1e-6 ? scale(norm(s.thrustAccel), -1) : scale(localAxes(s.pos).up, -1);
  const lpdAngle = (Math.acos(Math.max(-1, Math.min(1, dot(los, down)))) * 180) / Math.PI;
  return { ...r, lpdTime: s.program === 'P64' ? Math.max(0, -s.ttf - src('approachEnd')) : 0, lpdAngle, deltaH: 0 };
}

/** The descent's sources, for a figure that lists them. */
export { DESCENT_SOURCES };
