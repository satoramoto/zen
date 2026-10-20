// The Fader's drag, keys and wheel as a Svelte action (`use:faderInput={params}`). The logic is the
// framework-free `faderInput.ts`. (Not `fader.ts`: on a case-insensitive disk it would shadow `Fader`.)
import type { Action } from 'svelte/action';
import { bindFader, type FaderParams } from './faderInput';

export const faderInput: Action<HTMLElement, FaderParams> = (node, params) => {
  const binding = bindFader(node, params ?? { level: 0 });
  return { update: (next) => binding.update(next ?? { level: 0 }), destroy: () => binding.destroy() };
};
