// NumberField as the DOM renderer draws it: the same tree and handlers as `NumberField.tsx` and `NumberField.svelte`.
import { domPart } from '../../foundation/view/dom';
import { numberFieldHandlers, numberFieldView, type NumberFieldModelProps } from './NumberField.model';
import '../../primitives/Text/Text.css';
import './NumberField.css';

export const NumberFieldDom = domPart<NumberFieldModelProps>({ events: ['onChange', 'onRelease'], value: { prop: 'value', on: 'onChange' } }, (props, use) => {
  const draft = use.state<string | null>(null);
  return { tree: numberFieldView(props, draft.get()), handlers: numberFieldHandlers(props, draft.set) };
});
