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
    // The first-run guide is paged with the last two upper display buttons.
    const guide = ctx.set.unit.onboarding;
    if (ctx.set.unit.power === 'starting' && guide && ctx.input.kind === 'down') {
      if (ctx.input.control === 'upper-8') push(ctx, 'onboarding', guide.step >= guide.steps.length - 1 ? { done: true } : { step: guide.step + 1 });
      else if (ctx.input.control === 'upper-7' && guide.step > 0) push(ctx, 'onboarding', { step: guide.step - 1 });
    }
    return true;
  },
  paint(paint) {
    for (const c of CONTROLS) paint.lamps[c.id] = OFF;
    paint.notes = {};
    paint.strip = { kind: 'off' };
    const { power: state, starting } = paint.set.unit;
    if (state === 'off') paint.screen = screen('blank');
    else if (state === 'starting') {
      const guide = paint.set.unit.onboarding;
      paint.screen = guide
        ? screen('onboarding', { top: [null, null, null, null, null, null, { label: 'Back' }, { label: guide.step >= guide.steps.length - 1 ? 'Done' : 'Next' }], body: [{ type: 'text', text: guide.steps[guide.step] ?? '', size: 'value', align: 'centre', col: 1, span: 8 }, { type: 'text', text: `${guide.step + 1} of ${guide.steps.length}`, size: 'label', tone: 'dim', align: 'centre', col: 1, span: 8 }] })
        : screen('starting', { body: [{ type: 'text', text: 'Push', size: 'large', align: 'centre', col: 1, span: 8 }], overlays: [{ type: 'progress', label: 'Starting up', fraction: starting ?? 0 }] });
    } else if (state === 'shutting-down') paint.screen = screen('shutting-down', { body: [{ type: 'text', text: 'Saving the Set. Push will switch off.', size: 'value', align: 'centre', col: 1, span: 8 }], overlays: [{ type: 'battery', percent: paint.set.unit.battery?.percent ?? 0, charging: false, low: true }] });
    else paint.screen = screen('low-battery', { body: [{ type: 'text', text: 'Battery empty. Connect the power supply.', size: 'value', tone: 'warn', align: 'centre', col: 1, span: 8 }], overlays: [{ type: 'battery', percent: paint.set.unit.battery?.percent ?? 0, charging: false, low: true }] });
  },
};
