/** Renderer-independent quantities. Views manipulate sources; derived values have one owner. */
export interface Quantity {
  label: string;
  initial: number;
  min: number;
  max: number;
  step: number;
}
export interface Relationship<K extends string, D> {
  quantities: Record<K, Quantity>;
  derive: (sources: Readonly<Record<K, number>>) => D;
}
export function quantityValue(quantity: Quantity, value: number): number {
  return Number.isFinite(value) ? Math.max(quantity.min, Math.min(quantity.max, value)) : quantity.initial;
}
export function relationshipSources<K extends string, D>(relationship: Relationship<K, D>, supplied: Partial<Record<K, number>> = {}): Record<K, number> {
  return Object.fromEntries((Object.keys(relationship.quantities) as K[]).map(key => {
    const quantity = relationship.quantities[key];
    return [key, quantityValue(quantity, supplied[key] ?? quantity.initial)];
  })) as Record<K, number>;
}

export const TAU = Math.PI * 2;
export type SineQuantity = 'amplitude' | 'frequency' | 'time';
export type SineSources = Record<SineQuantity, number>;
export interface SineValues { angle: number; x: number; y: number; period: number }
export const sineRelationship: Relationship<SineQuantity, SineValues> = {
  quantities: {
    amplitude: { label: 'Radius', initial: 1, min: .35, max: 1.65, step: .05 },
    frequency: { label: 'Turns per cycle', initial: 1, min: .5, max: 3, step: .05 },
    time: { label: 'Time', initial: Math.PI / 4, min: 0, max: TAU, step: Math.PI / 36 },
  },
  derive: ({ amplitude, frequency, time }) => ({
    angle: frequency * time,
    x: amplitude * Math.cos(frequency * time),
    y: amplitude * Math.sin(frequency * time),
    period: TAU / frequency,
  }),
};
/** Invert an orbit drag onto the nearest available turn, preserving the current branch. */
export function orbitTime(x: number, y: number, sources: SineSources): number {
  if (Math.hypot(x, y) < 1e-8) return sources.time;
  const angle = Math.atan2(y, x);
  const current = sources.frequency * sources.time;
  const candidates = Array.from({ length: 5 }, (_, turn) => (angle + TAU * turn) / sources.frequency)
    .filter(time => time >= -1e-8 && time <= TAU + 1e-8);
  if (!candidates.length) return sources.time;
  return Math.max(0, Math.min(TAU, candidates.reduce((best, time) => Math.abs(time * sources.frequency - current) < Math.abs(best * sources.frequency - current) ? time : best)));
}
