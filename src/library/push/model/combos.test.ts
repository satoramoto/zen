import { describe, expect, it } from 'vitest';
import { COMBOS, combinations } from './combos';
import { firstOf } from './engine';
import { control } from './layout';
import { sampleSet } from './sample';
import { initialState } from './state';
import { stepTraced } from './step';
import type { PushInput } from './types';

describe('the combination list', () => {
  it('is published as data: controls, mode and what it asks', () => {
    const list = combinations();
    expect(list.length).toBe(COMBOS.length);
    expect(JSON.parse(JSON.stringify(list))).toEqual(list);
    expect(new Set(list.map((c) => c.id)).size).toBe(list.length);
    for (const c of list) {
      expect(c.hold.length, c.id).toBeGreaterThan(0);
      for (const id of c.hold) expect(control(id), `${c.id} holds ${id}`).toBeDefined();
      expect(firstOf(c.press), `${c.id} presses ${c.press}`).toBeDefined();
      expect(c.mode, c.id).not.toBe('');
      expect(c.asks, c.id).not.toBe('');
    }
    expect(list.find((c) => c.id === 'shift+undo')).toMatchObject({ hold: ['shift'], press: 'undo', asks: 'Redo the last undone change' });
  });

  it.each(COMBOS.map((c) => [c.id, c] as const))('%s is reached by holding its buttons and using its control', (_id, combo) => {
    const set = sampleSet();
    combo.example?.set?.(set);
    let state = initialState();
    combo.example?.state?.(state, set);
    let time = 0;
    for (const id of combo.hold) state = stepTraced(state, set, { control: id, kind: 'down', time: (time += 10) }).state;
    const press = combo.example?.press ?? firstOf(combo.press)!.id;
    const kind = combo.kind ?? 'down';
    const input: PushInput = { control: press, kind, time: time + 10, ...(kind === 'down' && control(press)?.kind === 'pad' ? { velocity: 100 } : {}), ...(combo.example?.value === undefined ? (kind === 'turn' ? { value: 1 } : {}) : { value: combo.example.value }) };
    expect(stepTraced(state, set, input).combo).toBe(combo.id);
  });
});
