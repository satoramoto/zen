// What each control sends in User Mode (openspec: push-device-model, "User Mode turns the device
// into bare controls"): a button a control change, a pad a note, an encoder a relative control
// change when turned and a note when touched, the touch strip pitch bend.
//
// The manual gives no numbers. Those below are the Push 2's, from Ableton's public interface
// document (https://github.com/Ableton/push-interface), which the Push 3 keeps for the controls
// the two share. The Push 3's new controls have no published number: theirs are marked added and
// are free control numbers, to be replaced when a unit is measured.
import { CONTROLS, padAt } from './layout';

const BUTTON_CC: Record<string, number> = {
  'tap-tempo': 3, metronome: 9, delete: 118, undo: 119, mute: 60, solo: 61, 'stop-clip': 29, convert: 35, 'double-loop': 117, quantize: 116,
  duplicate: 88, new: 87, 'fixed-length': 90, automate: 89, record: 86, play: 85, main: 28,
  'dpad-left': 44, 'dpad-right': 45, 'dpad-up': 46, 'dpad-down': 47, select: 48, shift: 49, note: 50, session: 51, add: 52, swap: 53,
  'octave-down': 54, 'octave-up': 55, repeat: 56, accent: 57, scale: 58, layout: 31, setup: 30, user: 59, 'page-left': 62, 'page-right': 63,
  device: 110, mix: 112, clip: 113,
  sets: 80, // added
  learn: 81, // added
  save: 82, // added
  lock: 83, // added
  capture: 65, // added
  'session-screen': 34, // added
  'dpad-centre': 91, // added
};

/** A button's control number. Display buttons: upper 102 to 109, lower 20 to 27. Scene buttons: 43 at the top down to 36. */
export function controlNumber(id: string): number | undefined {
  if (id in BUTTON_CC) return BUTTON_CC[id];
  let m = /^upper-([1-8])$/.exec(id);
  if (m) return 101 + Number(m[1]);
  m = /^lower-([1-8])$/.exec(id);
  if (m) return 19 + Number(m[1]);
  m = /^scene-([1-8])$/.exec(id);
  if (m) return 44 - Number(m[1]);
  return undefined;
}

/** A pad's note: 36 at the bottom left, rising to the right and then up, to 99 at the top right. */
export function padNote(id: string): number | undefined {
  const at = padAt(id);
  return at ? 36 + (8 - at.row) * 8 + (at.col - 1) : undefined;
}

/** An encoder's control number when turned (a relative change) and its note when touched. */
export function encoderNumbers(id: string): { turn: number; touch: number; press?: number } | undefined {
  const m = /^encoder-([1-8])$/.exec(id);
  if (m) return { turn: 70 + Number(m[1]), touch: Number(m[1]) - 1 };
  if (id === 'volume') return { turn: 79, touch: 8, press: 111 /* added */ };
  if (id === 'tempo') return { turn: 14, touch: 10, press: 15 /* added */ };
  if (id === 'jog') return { turn: 70 /* added */, touch: 11 /* added */, press: 94 /* added */ };
  return undefined;
}

/** The touch strip's touch note. */
export const STRIP_TOUCH_NOTE = 12;

/** A relative turn as a control value: 1 to 63 clockwise, 127 down to 65 counter-clockwise. */
export const relativeValue = (steps: number) => (steps >= 0 ? Math.min(63, steps) : 128 + Math.max(-63, steps));

/** Every control's User Mode message, as data: a developer's table of what the bare device sends. */
export function userModeMap(): { control: string; message: 'control-change' | 'note' | 'pitch-bend'; number?: number }[] {
  return CONTROLS.filter((c) => c.kind !== 'display').map((c) => {
    if (c.kind === 'pad') return { control: c.id, message: 'note' as const, number: padNote(c.id) };
    if (c.kind === 'strip') return { control: c.id, message: 'pitch-bend' as const };
    if (c.kind === 'encoder' || c.kind === 'wheel') return { control: c.id, message: 'control-change' as const, number: encoderNumbers(c.id)?.turn };
    return { control: c.id, message: 'control-change' as const, number: controlNumber(c.id) };
  });
}
