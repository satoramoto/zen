// The top layer: a unit that is not on. Off, it is dark and asks nothing, though the surface
// still reports presses to the app (openspec: push-surface, "A powered-off unit is dark").
import { CONTROLS } from '../layout';
import { OFF, push, screen, type Layer } from '../engine';

export const power: Layer = {
  name: 'power',
  modal: true,
  active: (_state, set) => set.unit.power !== 'on',
  step(ctx) {
    // Off, the power button switches the unit on. Nothing else is asked.
    if (ctx.set.unit.power === 'off' && ctx.input.control === 'power' && ctx.input.kind === 'down') push(ctx, 'power', { on: true });
    return true;
  },
  paint(paint) {
    for (const c of CONTROLS) paint.lamps[c.id] = OFF;
    paint.notes = {};
    paint.strip = { kind: 'off' };
    const { power: state, starting } = paint.set.unit;
    if (state === 'off') paint.screen = screen('blank');
    else if (state === 'starting') paint.screen = screen('starting', { overlays: [{ type: 'progress', label: 'Starting up', fraction: starting ?? 0 }] });
    else if (state === 'shutting-down') paint.screen = screen('shutting-down', { body: [{ type: 'text', text: 'Shutting down', size: 'value', align: 'centre', col: 1, span: 8 }] });
    else paint.screen = screen('low-battery', { body: [{ type: 'text', text: 'Battery empty. Connect the power supply.', size: 'value', tone: 'warn', align: 'centre', col: 1, span: 8 }], overlays: [{ type: 'battery', percent: paint.set.unit.battery?.percent ?? 0, charging: false, low: true }] });
  },
};
