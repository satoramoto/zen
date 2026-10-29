/** Measured min/max columns and their folded, transient-preserving halvings (widgets mirror). */
export interface Peak { min: number; max: number }
/** Min and max interleaved: cell i is [i * 2], [i * 2 + 1]. */
export type Steps = Float32Array;
export const cellsIn = (steps: Steps): number => steps.length >> 1;

export function packedOf(peaks: readonly Peak[]): Steps {
  const out = new Float32Array(peaks.length * 2);
  for (let i = 0; i < peaks.length; i++) {
    out[i * 2] = peaks[i].min;
    out[i * 2 + 1] = peaks[i].max;
  }
  return out;
}

export function coarser(steps: Steps): Steps {
  const cells = cellsIn(steps) >> 1;
  const out = new Float32Array(cells * 2);
  for (let i = 0; i < cells; i++) {
    const a = i << 2;
    out[i * 2] = Math.min(steps[a], steps[a + 2]);
    out[i * 2 + 1] = Math.max(steps[a + 1], steps[a + 3]);
  }
  return out;
}

/** Fold, never decimate: the widest excursion survives to the coarsest reading. */
export function levelsOf(master: Steps, floor = 512): readonly Steps[] {
  const levels: Steps[] = [master];
  while (cellsIn(levels[levels.length - 1]) > floor) levels.push(coarser(levels[levels.length - 1]));
  return levels;
}

export interface Chosen { level: number; steps: Steps; from: number; to: number }

/** The coarsest level with at least one cell per drawn column. */
export function levelFor(levels: readonly Steps[], from: number, to: number, columns: number): Chosen {
  let level = 0;
  while (level + 1 < levels.length) {
    const cells = cellsIn(levels[level + 1]);
    if (Math.ceil(to * cells) - Math.floor(from * cells) < columns) break;
    level++;
  }
  const steps = levels[level];
  const cells = cellsIn(steps);
  return { level, steps, from: Math.max(0, Math.floor(from * cells)), to: Math.min(cells, Math.ceil(to * cells)) };
}
