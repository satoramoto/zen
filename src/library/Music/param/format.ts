/** Source-compatible fallback formatting; an engine's authoritative display wins. */
import { clamp, span, type Param } from './param';
const SAMPLES = 129;
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function decimalsFor(width: number): number {
  const size = Math.abs(width);
  if (size <= 20) return 2;
  if (size <= 200) return 1;
  return 0;
}
function fixed(value: number, decimals: number): string {
  return (Object.is(value, -0) ? 0 : value).toFixed(decimals);
}
function sprintf(pattern: string, value: number): string {
  return pattern.replace(/%(-)?(0)?(\d+)?(?:\.(\d+))?([dfs])/, (_match, left, zero, width, precision, conversion) => {
    let text: string;
    if (conversion === 'd') text = String(Math.round(value));
    else if (conversion === 'f') text = value.toFixed(precision ? Number(precision) : 6);
    else text = String(value);
    const target = width ? Number(width) : 0;
    if (text.length >= target) return text;
    const pad = (zero && !left ? '0' : ' ').repeat(target - text.length);
    return left ? text + pad : pad + text;
  });
}
export function noteName(value: number): string {
  const note = Math.round(value);
  return `${NOTES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 2}`;
}
function panText(p: Param, value: number): string {
  const reach = Math.max(Math.abs(p.min), Math.abs(p.max), Number.EPSILON);
  const amount = Math.round((Math.abs(value) / reach) * 50);
  return amount === 0 ? 'C' : `${amount}${value < 0 ? 'L' : 'R'}`;
}
export function format(p: Param, value: number): string {
  if (p.kind === 'enum' && p.items?.length) return p.items[Math.max(0, Math.min(p.items.length - 1, Math.round(value)))] ?? '';
  const held = clamp(p, value);
  const decimals = decimalsFor(span(p));
  switch (p.unit ?? 'native') {
    case 'int': return String(Math.round(held));
    case 'time': return Math.abs(held) < 1000 ? `${fixed(held, held === Math.round(held) ? 0 : 1)} ms` : `${fixed(held / 1000, 2)} s`;
    case 'hertz': return Math.abs(held) < 1000 ? `${fixed(held, decimalsFor(1000))} Hz` : `${fixed(held / 1000, 2)} kHz`;
    case 'decibel': return Number.isFinite(held) ? `${fixed(held, 1)} dB` : '-inf dB';
    case 'percent': return `${fixed(held, 0)} %`;
    case 'pan': return panText(p, held);
    case 'semitones': return `${held > 0 ? '+' : ''}${fixed(held, 0)} st`;
    case 'midi': return noteName(held);
    case 'custom': {
      const pattern = p.customUnit ?? '';
      if (/%[-0-9.]*[dfs]/.test(pattern)) return sprintf(pattern, held);
      return pattern ? `${fixed(held, decimals)} ${pattern}` : fixed(held, decimals);
    }
    case 'float':
    case 'native':
    default: return p.kind === 'int' ? String(Math.round(held)) : fixed(held, decimals);
  }
}
export function widestText(p: Param): number {
  if (p.kind === 'enum' && p.items?.length) return p.items.reduce((widest, item) => Math.max(widest, item.length), 0);
  const reach = p.kind === 'int' ? Math.round(Math.abs(span(p))) + 1 : SAMPLES;
  const count = Math.max(2, Math.min(reach, SAMPLES));
  let widest = 0;
  for (let i = 0; i < count; i += 1) widest = Math.max(widest, format(p, p.min + (span(p) * i) / (count - 1)).length);
  return widest;
}
