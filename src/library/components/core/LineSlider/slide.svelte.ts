// The line slider's keys and drag as a Svelte action (`use:lineSlider={params}`). The logic is the
// framework-free `slide.ts`.
import type { Action } from 'svelte/action';
import { bindLineSlider, type LineSliderParams } from './slide';

export type { LineSliderParams } from './slide';

export const lineSlider: Action<HTMLElement, LineSliderParams> = (node, params) => {
  const binding = bindLineSlider(node, params ?? { value: 0 });
  return { update: (next) => binding.update(next ?? { value: 0 }), destroy: () => binding.destroy() };
};
