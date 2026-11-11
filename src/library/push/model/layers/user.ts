// User Mode: the device asks nothing of the Set. Every button reports a control change, every pad
// a note, every encoder a relative control change when turned and a note when touched, the touch
// strip pitch bend; lamps show only what the app sets (openspec: push-device-model).
import { CONTROLS } from '../layout';
import { LIT, OFF, push, screen, type Layer } from '../engine';
import { STRIP_TOUCH_NOTE, controlNumber, encoderNumbers, padNote, relativeValue } from '../midi';

export const user: Layer = {
  name: 'user',
  active: (state) => state.user,
  step(ctx) {
    const { input, target } = ctx;
    if (input.kind === 'tick') return true;
    if (input.control === 'pedal-2') {
      if (input.kind === 'down' || input.kind === 'up') push(ctx, 'sustain', { down: input.kind === 'down' });
      return true;
    }
    if (!target) return true;
    // The User button always leaves.
    if (target.id === 'user') {
      if (input.kind === 'down') ctx.state.user = false;
      return true;
    }
    const control = target.id;
    if (target.kind === 'pad') {
      const number = padNote(control)!;
      if (input.kind === 'down') push(ctx, 'note-on', { number, velocity: input.velocity ?? 100, control });
      else if (input.kind === 'up') push(ctx, 'note-off', { number, control });
      else if (input.kind === 'pressure') push(ctx, 'pressure', { number, value: input.value ?? 0, control });
    } else if (target.kind === 'strip') {
      if (input.kind === 'touch') {
        push(ctx, 'note-on', { number: STRIP_TOUCH_NOTE, velocity: 127, control });
        push(ctx, 'pitch-bend', { value: (input.value ?? 0.5) * 2 - 1, control });
      } else if (input.kind === 'move') push(ctx, 'pitch-bend', { value: (input.value ?? 0.5) * 2 - 1, control });
      else if (input.kind === 'release') {
        push(ctx, 'pitch-bend', { value: 0, control });
        push(ctx, 'note-off', { number: STRIP_TOUCH_NOTE, control });
      }
    } else if (target.kind === 'encoder' || target.kind === 'wheel') {
      const numbers = encoderNumbers(control)!;
      if (input.kind === 'turn') push(ctx, 'control-change', { number: numbers.turn, value: relativeValue(input.value ?? 0), relative: true, control });
      else if (input.kind === 'nudge') push(ctx, 'control-change', { number: numbers.turn, value: relativeValue(input.value ?? 0), relative: true, control });
      else if (input.kind === 'touch') push(ctx, 'note-on', { number: numbers.touch, velocity: 127, control });
      else if (input.kind === 'release') push(ctx, 'note-off', { number: numbers.touch, control });
      else if ((input.kind === 'down' || input.kind === 'up') && numbers.press !== undefined) push(ctx, 'control-change', { number: numbers.press, value: input.kind === 'down' ? 127 : 0, control });
    } else if (target.kind === 'button') {
      const number = controlNumber(control);
      if (number !== undefined && (input.kind === 'down' || input.kind === 'up')) push(ctx, 'control-change', { number, value: input.kind === 'down' ? 127 : 0, control });
    }
    return true;
  },
  paint(paint) {
    const set = paint.set.userLamps ?? {};
    for (const c of CONTROLS) paint.lamps[c.id] = set[c.id] ?? OFF;
    paint.lamps.user = LIT;
    paint.notes = {};
    paint.screen = screen('user', { body: [{ type: 'text', text: 'User Mode', size: 'large', align: 'centre', col: 1, span: 8 }] });
  },
};
