import { isManifold, surfacePoint, type SignalKind, type SignalState } from './signals';

export type SectionAxis = 'u' | 'v';
export type SurfaceColorMode = 'solid' | 'signed' | 'magnitude';
export const sectionExtent = (kind: SignalKind) => isManifold(kind) ? Math.PI : 4;
/** The plotted scalar, also used by the surface's color encoding. */
export function surfaceScalar(kind: SignalKind, u: number, v: number, state: SignalState): number {
  const p = surfacePoint(kind, u, v, state);
  return kind === 'sphere' ? Math.hypot(...p) - 1 : p[1];
}
export const scalarLimit = (kind: SignalKind) => kind === 'sphere' ? .45 : kind === 'torus' ? .35 : kind === 'torus4' ? Math.SQRT2 : 1.5;
export function sectionPoint(kind: SignalKind, axis: SectionAxis, coordinate: number, state: SignalState) {
  return surfacePoint(kind, axis === 'u' ? coordinate : state.slice, axis === 'u' ? state.slice : coordinate, state);
}
export function sectionValue(kind: SignalKind, axis: SectionAxis, coordinate: number, state: SignalState) {
  return surfaceScalar(kind, axis === 'u' ? coordinate : state.slice, axis === 'u' ? state.slice : coordinate, state);
}
/** Uniform finite-window samples; these are estimates, not symbolic extrema or total energy. */
export function sectionStats(kind: SignalKind, axis: SectionAxis, state: SignalState) {
  const extent = sectionExtent(kind), count = 513;
  let min = Infinity, max = -Infinity, square = 0;
  for (let i = 0; i < count; i++) {
    const value = sectionValue(kind, axis, -extent + 2 * extent * i / (count - 1), state);
    min = Math.min(min, value); max = Math.max(max, value); square += value * value;
  }
  return { min, max, rms: Math.sqrt(square / count) };
}
/** Fixed scale across time and experiments, so color changes retain their meaning. */
export function colorPosition(value: number, limit: number, mode: SurfaceColorMode) {
  return mode === 'magnitude' ? Math.min(1, Math.abs(value) / limit) : .5 + .5 * Math.max(-1, Math.min(1, value / limit));
}
