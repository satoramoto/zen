// The knob's input as a Svelte action (`use:knobInput={params}`, or through a component with
// `{@attach fromAction(knobInput, () => params)}`). The logic is the framework-free `knobInput.ts`.
import type { Action } from 'svelte/action';
import { bindKnob, type KnobParams } from './knobInput';

export const knobInput: Action<HTMLElement, KnobParams> = (node, params) => {
  const binding = bindKnob(node, params ?? {});
  return { update: (next) => binding.update(next ?? {}), destroy: () => binding.destroy() };
};
