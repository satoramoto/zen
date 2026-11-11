// When a pulsing or blinking lamp is bright (openspec: push-surface, "Pulsing and blinking follow
// the tempo"). Pure; the surface's input store runs it once a frame and sets two properties.

/** Without a beat from the app, lamps animate as at this tempo. */
export const FREE_TEMPO = 120; // added

export interface Beat {
  /** Beats a minute. */
  tempo: number;
  /** The time of any one beat, on the clock the surface's times are on (milliseconds). */
  at: number;
}

/** Where `time` is in its beat, 0 to 1. */
export function beatPhase(time: number, beat?: Beat): number {
  const period = 60000 / (beat?.tempo && beat.tempo > 0 ? beat.tempo : FREE_TEMPO);
  const elapsed = time - (beat?.at ?? 0);
  return (((elapsed % period) + period) % period) / period;
}

/** A blinking lamp: lit for the first half of each beat, so it blinks once a beat, on the beat. */
export const blinkAt = (time: number, beat?: Beat): 0 | 1 => (beatPhase(time, beat) < 0.5 ? 1 : 0);

/** A pulsing lamp: brightest on the beat, falling to its dimmest halfway through, 0 to 1. */
export const pulseAt = (time: number, beat?: Beat): number => 0.5 + 0.5 * Math.cos(beatPhase(time, beat) * 2 * Math.PI);
