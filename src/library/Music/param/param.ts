/** Framework-free parameter contract, ported unchanged from openflowfm/widgets. */
export type ParamKind = 'float' | 'int' | 'enum' | 'blob';
export type UnitStyle = 'native' | 'int' | 'float' | 'time' | 'hertz' | 'decibel' | 'percent' | 'pan' | 'semitones' | 'midi' | 'custom';
export interface Param {
  readonly kind: ParamKind;
  readonly min: number;
  readonly max: number;
  readonly defaultValue: number;
  readonly unit?: UnitStyle;
  readonly customUnit?: string;
  readonly exponent?: number;
  readonly steps?: number;
  readonly items?: readonly string[];
  readonly name?: string;
  readonly shortName?: string;
}
export function span(p: Param): number {
  const width = p.max - p.min;
  return Math.abs(width) < Number.EPSILON ? 1 : width;
}
export function clamp(p: Param, value: number): number {
  if (Number.isNaN(value)) return p.min;
  return Math.max(p.min, Math.min(p.max, value));
}
export function quantize(p: Param, value: number): number {
  let held = clamp(p, value);
  if (p.steps !== undefined && p.steps >= 2) {
    const intervals = p.steps - 1;
    const linear = (held - p.min) / span(p);
    held = p.min + (Math.round(linear * intervals) / intervals) * span(p);
  }
  if (p.kind === 'int' || p.kind === 'enum') held = Math.round(held);
  return clamp(p, held);
}
export function fractionOf(p: Param, value: number): number {
  const linear = (clamp(p, value) - p.min) / span(p);
  const held = Math.max(0, Math.min(1, linear));
  const exponent = p.exponent ?? 1;
  return exponent === 1 ? held : held ** (1 / exponent);
}
export function valueAt(p: Param, fraction: number): number {
  const held = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const exponent = p.exponent ?? 1;
  const linear = exponent === 1 ? held : held ** exponent;
  return quantize(p, p.min + linear * span(p));
}
export function stepSize(p: Param, fine = false): number {
  if (p.kind === 'enum' || p.kind === 'int') return 1;
  if (p.steps !== undefined && p.steps >= 2) return span(p) / (p.steps - 1);
  return Math.abs(span(p)) / (fine ? 1000 : 100);
}
export function isSwitch(p: Param): boolean {
  return (p.kind === 'int' || p.kind === 'enum') && p.max - p.min === 1;
}
export function enumParam(items: readonly string[], options: { defaultIndex?: number; name?: string } = {}): Param {
  return { kind: 'enum', min: 0, max: Math.max(0, items.length - 1), defaultValue: options.defaultIndex ?? 0, items, name: options.name };
}
