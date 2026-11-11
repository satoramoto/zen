// A note's parameters, as the encoders edit them in Clip View's Note Edit mode and on held steps
// (openspec: push-clip-view, "The encoders edit the highlighted note"; push-step-sequencing,
// "Holding steps opens their parameters"). One list, so both places agree on what each encoder is.
import { noteName } from '../scales';
import type { BodyCell, Note } from '../types';

export interface NoteParam {
  key: 'position' | 'nudge' | 'length' | 'pitch' | 'velocity' | 'velocityRange' | 'probability';
  name: string;
  /** What one step of the encoder asks for, and with Shift. */
  step: number;
  fine: number;
  read(note: Note): number;
  word(value: number): string;
  /** Where a value is in its range, 0 to 1. */
  fraction(value: number): number;
  bipolar?: boolean;
}

const pct = (v: number) => `${Math.round(v * 100)} %`;

/** The parameters, in encoder order. `drum` reads the fourth as Drum Pad. */
export function noteParams(drum: boolean): NoteParam[] {
  return [
    { key: 'position', name: 'Position', step: 0.25, fine: 0.0625, read: (n) => n.start, word: (v) => `${(v + 1).toFixed(2)}`, fraction: () => 0.5 },
    { key: 'nudge', name: 'Nudge', step: 0.01, fine: 0.001, read: (n) => n.nudge ?? 0, word: pct, fraction: (v) => 0.5 + v, bipolar: true },
    { key: 'length', name: 'Length', step: 0.25, fine: 0.0625, read: (n) => n.length, word: (v) => `${v.toFixed(2)} beats`, fraction: (v) => Math.min(1, v / 4) },
    { key: 'pitch', name: drum ? 'Drum Pad' : 'Pitch', step: 1, fine: 1, read: (n) => n.pitch, word: noteName, fraction: (v) => v / 127 },
    { key: 'velocity', name: 'Velocity', step: 1, fine: 1, read: (n) => n.velocity, word: (v) => String(Math.round(v)), fraction: (v) => v / 127 },
    { key: 'velocityRange', name: 'Vel Range', step: 1, fine: 1, read: (n) => n.velocityRange ?? 0, word: (v) => String(Math.round(v)), fraction: (v) => 0.5 + v / 254, bipolar: true },
    { key: 'probability', name: 'Probability', step: 0.01, fine: 0.001, read: (n) => n.probability ?? 1, word: pct, fraction: (v) => v },
  ];
}

/** A parameter of some notes as a display cell: its value, or the range when the notes differ. */
export function noteParamCell(p: NoteParam, notes: readonly Note[], col: number, more: Partial<BodyCell> = {}): BodyCell {
  const values = notes.map(p.read);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const value = notes.length === 0 ? '-' : low === high ? p.word(low) : `${p.word(low)} to ${p.word(high)}`;
  return { type: 'param', col, name: p.name, value, fraction: notes.length ? p.fraction(high) : 0, style: p.bipolar ? 'bipolar' : 'arc', ...(notes.length ? {} : { disabled: true }), ...more } as BodyCell;
}
