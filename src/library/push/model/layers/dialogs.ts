// The screens that are entered and left: text entry, a confirmation before something is removed,
// and a dialog with a code or an address (openspec: push-display). Each shows an X over the first
// upper display button, which leaves without choosing.
import { clamp } from '../state';
import { isDown, push, screen, type Ctx, type Layer } from '../engine';
import type { RowCell } from '../types';

/** The characters text entry offers, in the order the jog wheel moves through them. */
export const CHARACTERS: readonly string[] = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -_.,!&()+#'];

const X: RowCell = { label: '', icon: 'close' };
const row = (cells: Record<number, RowCell>): (RowCell | null)[] => Array.from({ length: 8 }, (_, i) => cells[i + 1] ?? null);

/** Whether this input turns the jog wheel or presses a D-pad arrow that moves the same way: the steps moved, or 0. */
export function listMove(ctx: Ctx, axis: 'vertical' | 'horizontal' = 'vertical'): number {
  const { input } = ctx;
  if (input.control === 'jog' && input.kind === 'turn') return Math.sign(input.value ?? 0) * Math.max(1, Math.abs(Math.trunc(input.value ?? 0)));
  if (input.kind !== 'down') return 0;
  if (axis === 'vertical') return input.control === 'dpad-up' ? -1 : input.control === 'dpad-down' ? 1 : 0;
  return input.control === 'dpad-left' ? -1 : input.control === 'dpad-right' ? 1 : 0;
}
/** Whether this input chooses: the jog wheel pressed, or the D-pad's centre. */
export const listChoose = (ctx: Ctx) => isDown(ctx, 'jog') || isDown(ctx, 'dpad-centre');
/** A nudge of the jog wheel: -1 left (back), 1 right (in), or 0. */
export const nudged = (ctx: Ctx) => (ctx.input.control === 'jog' && ctx.input.kind === 'nudge' ? Math.sign(ctx.input.value ?? 0) : 0);

export const textEntry: Layer = {
  name: 'text-entry',
  active: (state) => !!state.textEntry,
  step(ctx) {
    const { state, input, target } = ctx;
    const entry = state.textEntry!;
    const caret = clamp(entry.caret ?? entry.text.length, 0, entry.text.length);
    const put = (text: string, at: number) => {
      entry.text = text;
      entry.caret = at;
    };
    // The jog wheel and the D-pad's left and right move through the characters.
    const move = listMove(ctx, 'horizontal') || (input.control === 'jog' && input.kind === 'turn' ? listMove(ctx) : 0);
    if (move) {
      entry.highlighted = clamp(entry.highlighted + move, 0, CHARACTERS.length - 1);
      return true;
    }
    if (listChoose(ctx)) return put(entry.text.slice(0, caret) + CHARACTERS[entry.highlighted] + entry.text.slice(caret), caret + 1), true;
    const nudge = nudged(ctx);
    if (nudge) return (entry.caret = clamp(caret + nudge, 0, entry.text.length)), true;
    if (input.kind === 'down' && target?.cluster === 'upper') {
      if (target.id === 'upper-1') delete state.textEntry;
      else if (target.id === 'upper-6' && caret > 0) put(entry.text.slice(0, caret - 1) + entry.text.slice(caret), caret - 1);
      else if (target.id === 'upper-7') put(`${entry.text.slice(0, caret)} ${entry.text.slice(caret)}`, caret + 1);
      else if (target.id === 'upper-8') {
        ctx.intents.push({ ...entry.then, text: entry.text });
        delete state.textEntry;
      }
      return true;
    }
    // Everything else on the face waits until the text is done, but the pads still play.
    return target?.kind !== 'pad';
  },
  paint(paint) {
    const entry = paint.state.textEntry!;
    paint.screen = screen('text-entry', {
      top: row({ 1: X, 6: { label: 'Delete' }, 7: { label: 'Space' }, 8: { label: 'Done', icon: 'check' } }),
      overlays: [{ type: 'text-entry', title: entry.title, text: entry.text, caret: clamp(entry.caret ?? entry.text.length, 0, entry.text.length), characters: [...CHARACTERS], highlighted: entry.highlighted }],
      close: true,
    });
  },
};

export const confirm: Layer = {
  name: 'confirm',
  active: (state) => !!state.confirm,
  step(ctx) {
    const { state, target } = ctx;
    if (listChoose(ctx)) {
      ctx.intents.push(state.confirm!.yes);
      delete state.confirm;
      return true;
    }
    if (isDown(ctx, 'upper-1')) {
      delete state.confirm;
      return true;
    }
    return target?.kind !== 'pad';
  },
  paint(paint) {
    const { text, yes } = paint.state.confirm!;
    paint.screen = { ...paint.screen, top: row({ 1: X }), close: true, overlays: [...paint.screen.overlays, { type: 'confirm', text, yes: typeof yes.label === 'string' ? yes.label : 'Confirm', no: 'Cancel' }] };
  },
};

const PURPOSE = { authorize: 'Authorize this Push', cloud: 'Connect to Ableton Cloud', 'crash-reports': 'Send crash reports', pair: 'Pair this Push' } as const;

/** A code or an address the app says to show, for a step finished on another device. */
export const codeDialog: Layer = {
  name: 'code-dialog',
  active: (_state, set) => !!set.unit.software.code,
  step(ctx) {
    if (isDown(ctx, 'upper-1')) {
      push(ctx, 'authorize', { purpose: ctx.set.unit.software.code!.purpose, cancel: true });
      return true;
    }
    return ctx.target?.kind !== 'pad';
  },
  paint(paint) {
    const code = paint.set.unit.software.code!;
    paint.screen = screen('dialog', {
      top: row({ 1: X }),
      overlays: [{ type: 'dialog', title: PURPOSE[code.purpose], text: 'Enter this code at the address below.', code: code.code.replace(/^(\d{3})(\d{3})$/, '$1 $2'), address: code.address }],
      close: true,
    });
  },
};
