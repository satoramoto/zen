// Toggle and Switch as the DOM renderer draws them: the same trees and handlers as `Toggle.tsx`, `Toggle.svelte` and `Switch.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { switchHandlers, switchView, toggleHandlers, toggleView, type SwitchModelProps, type ToggleModelProps } from './Toggle.model';

export const ToggleDom = domPart<ToggleModelProps & { children?: DomFill }>({ events: ['onChange'], value: { prop: 'on', on: 'onChange' } }, ({ children, ...props }) => ({
  tree: toggleView(props, children !== undefined),
  slots: { children },
  handlers: toggleHandlers(props),
}));

export const SwitchDom = domPart<SwitchModelProps & { children?: DomFill }>({ events: ['onChange'], value: { prop: 'checked', on: 'onChange' } }, ({ children, ...props }, use) => {
  const own = use.state(props.defaultChecked ?? false);
  return { tree: switchView(props, own.get(), children !== undefined), slots: { children }, handlers: switchHandlers(props, own.get(), own.set) };
});
