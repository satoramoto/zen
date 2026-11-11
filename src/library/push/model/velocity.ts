// The maths of a pad under a finger, a pen or a mouse (openspec: push-pads). Pure functions: the
// surface's input store calls them, and the Sensitivity tab draws its curve with the same one.

export interface Sensitivity {
  /** Each 0 to 1. Drive and Compand are centred: 0.5 leaves the force as it is. */
  threshold: number;
  drive: number;
  compand: number;
  range: number;
}

export const DEFAULT_SENSITIVITY: Sensitivity = { threshold: 0.2, drive: 0.5, compand: 0.5, range: 1 };

/** The velocity of a plain mouse click, and of the hard-press gesture (Alt held). */
export const MOUSE_VELOCITY = 100; // added
export const HARD_VELOCITY = 127; // added
/** Pressure a wheel notch adds to a pad held with a mouse. */
export const WHEEL_PRESSURE = 0.1; // added
/** How far a pointer moves up or down, as a share of the pad's height, before it changes the slide. */
export const SLIDE_DEAD = 0.08; // added

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** The least force that triggers, and the force that reaches full velocity, from the settings. */
export function forceWindow(s: Sensitivity): { least: number; full: number } {
  const least = 0.02 + clamp01(s.threshold) * 0.58; // added: Threshold spans the lower 60 percent of force
  const full = Math.max(least + 0.05, 0.3 + clamp01(s.range) * 0.7); // added
  return { least, full };
}

/**
 * Force (0 to 1) shaped into where the velocity is in its range (0 to 1), or undefined when the
 * force is under the threshold and nothing sounds. Threshold is the least force that triggers,
 * Range the force that reaches full velocity, Drive pushes velocities up (or down, under the
 * middle), and Compand spreads them to the extremes when over the middle and holds them to the
 * middle when under it.
 */
export function shapeForce(force: number, s: Sensitivity = DEFAULT_SENSITIVITY): number | undefined {
  const { least, full } = forceWindow(s);
  if (force < least) return undefined;
  let x = clamp01((force - least) / (full - least));
  const drive = (clamp01(s.drive) - 0.5) * 2;
  x = x ** (2 ** (-2 * drive));
  const compand = (clamp01(s.compand) - 0.5) * 2;
  const d = x - 0.5;
  if (compand < 0) x = 0.5 + d * (1 + compand);
  else if (compand > 0) x = 0.5 + Math.sign(d) * 0.5 * Math.abs(2 * d) ** (1 / (1 + 3 * compand));
  return clamp01(x);
}

/** Force as a velocity, 1 to 127, or undefined under the threshold. */
export function velocityOf(force: number, s: Sensitivity = DEFAULT_SENSITIVITY): number | undefined {
  const shaped = shapeForce(force, s);
  return shaped === undefined ? undefined : Math.round(1 + shaped * 126);
}

/**
 * A sideways offset from the in-tune place (in pads) as a bend (in pads): nothing inside the
 * in-tune width around each pad's centre, and a straight run between one pad's zone and the next,
 * so the centre of the pad `n` to the side bends exactly `n` pads.
 */
export function bendOf(offset: number, inTuneWidth: number): number {
  const half = Math.min(0.49, Math.max(0, inTuneWidth) / 2);
  const whole = Math.round(offset);
  const rest = offset - whole;
  if (Math.abs(rest) <= half) return whole;
  return whole + (Math.sign(rest) * (Math.abs(rest) - half)) / (1 - 2 * half);
}

/** Where a press lands on the pad's height (0 at the bottom edge) as slide, over the slide height. */
export function slideOf(y: number, range: 'full' | 'half' = 'full'): number {
  return range === 'half' ? clamp01((y - 0.25) / 0.5) : clamp01(y);
}

/** Whether a pointer reports real force: a pen, or a touch that gives something other than the fixed 0 or 0.5 or 1. */
export function hasForce(pointerType: string, pressure: number): boolean {
  if (pointerType === 'pen') return true;
  return pointerType === 'touch' && pressure > 0 && pressure !== 0.5 && pressure !== 1;
}

/** The computer keyboard's four rows of eight, top to bottom, for playing pads from the keys. */
export const KEY_ROWS = ['12345678', 'qwertyui', 'asdfghjk', 'zxcvbnm,'] as const;

/** The pad a key plays when the grid has focus in its upper or lower half: row and column, 1 to 8 from the top left. */
export function padForKey(key: string, lowerHalf: boolean): { row: number; col: number } | undefined {
  const k = key.toLowerCase();
  for (let r = 0; r < KEY_ROWS.length; r++) {
    const c = KEY_ROWS[r].indexOf(k);
    if (c >= 0 && k.length === 1) return { row: r + 1 + (lowerHalf ? 4 : 0), col: c + 1 };
  }
  return undefined;
}
