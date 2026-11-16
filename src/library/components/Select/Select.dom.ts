// Select as the DOM renderer draws it: the same tree and handlers as `Select.tsx` and `Select.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { ControlContextValue } from '../../primitives/control';
import { SELECT_CLOSED, selectHandlers, selectView, type SelectModelProps } from './Select.model';

export const SelectDom = domPart<SelectModelProps>({ events: ['onChange'], value: { prop: 'index', on: 'onChange' } }, (props, use) => {
  const state = use.state(SELECT_CLOSED);
  const { quiet } = use.context<ControlContextValue>('control');
  return { tree: selectView(props, { ...state.get(), quiet, id: use.id() }), handlers: selectHandlers(props, state.set) };
});
