// Disclosure as the DOM renderer draws it: the same tree and handlers as `Disclosure.tsx` and `Disclosure.svelte`.
import { domPart } from '../../foundation/view/dom';
import { disclosureHandlers, disclosureView, type DisclosureModelProps } from './Disclosure.model';

export const DisclosureDom = domPart<DisclosureModelProps>({ events: ['onChange'], value: { prop: 'expanded', on: 'onChange' } }, (props, use) => {
  const own = use.state(props.defaultExpanded ?? false);
  return { tree: disclosureView(props, own.get()), handlers: disclosureHandlers(props, own.get(), own.set) };
});
