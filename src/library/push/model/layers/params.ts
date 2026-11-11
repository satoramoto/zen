// What an encoder does to a parameter (openspec: push-device-view, "An encoder asks to change its
// parameter"; push-encoders). Shared by every screen that puts parameters under the encoders.
import { FINE, STEPS_PER_CHOICE, TURN_STEP } from '../timing';
import { push, shift, type Ctx } from '../engine';
import type { BodyCell, Parameter, ParamCell } from '../types';

/**
 * Ask to change a parameter by a turn: an amount that fits a continuous range (finer with Shift),
 * one choice per step for a parameter of choices, on or off for a switch. A disabled parameter's
 * turn is still asked, and marked: the app decides.
 */
export function turnParameter(ctx: Ctx, p: Parameter, steps: number, about: Record<string, unknown> = {}): void {
  if (steps === 0) return;
  const fine = shift(ctx);
  const base = { parameter: p.id, ...about, ...(fine ? { fine: true } : {}), ...(ctx.set.transport.automationArm && ctx.set.transport.recording !== 'off' ? { automation: true } : {}) };
  if (p.kind === 'switch') push(ctx, 'set-parameter', { ...base, value: steps > 0 ? 1 : 0 });
  else if (p.kind === 'choice') push(ctx, 'set-parameter', { ...base, delta: steps / Math.max(1, (p.choices?.length ?? 2) - 1), choice: steps });
  else push(ctx, 'set-parameter', { ...base, delta: steps * TURN_STEP * (fine ? FINE : 1) });
}

/** Steps of an encoder gathered into whole moves of a list or a choice: one move every few steps. `store` holds the remainder between turns. */
export function gather(store: { shift: number }, steps: number): number {
  store.shift += steps;
  const moved = Math.trunc(store.shift / STEPS_PER_CHOICE);
  store.shift -= moved * STEPS_PER_CHOICE;
  return moved;
}

/** A parameter as a display cell in a column, in the colour of what it belongs to. */
export function paramCell(p: Parameter, col: number, more: Partial<ParamCell> = {}): BodyCell {
  const chosen = p.kind === 'choice' && p.choices?.length ? Math.round(p.value * (p.choices.length - 1)) : undefined;
  return {
    type: 'param',
    col,
    name: p.name,
    value: p.display,
    fraction: p.value,
    style: p.kind === 'bipolar' ? 'bipolar' : p.kind === 'switch' ? 'switch' : p.kind === 'choice' ? 'choice' : 'arc',
    ...(p.kind === 'choice' ? { choices: p.choices ?? [], chosen } : {}),
    ...(p.disabled ? { disabled: true } : {}),
    ...(p.automated ? { automated: true } : {}),
    ...(p.overridden ? { overridden: true } : {}),
    ...more,
  };
}
