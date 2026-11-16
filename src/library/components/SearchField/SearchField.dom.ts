// SearchField as the DOM renderer draws it: the same tree and handlers as `SearchField.tsx` and `SearchField.svelte`.
import { domPart } from '../../foundation/view/dom';
import { searchFieldHandlers, searchFieldView, type SearchFieldModelProps } from './SearchField.model';
import '../../primitives/Text/Text.css';
import './SearchField.css';

export const SearchFieldDom = domPart<SearchFieldModelProps & { ref?: (element: HTMLInputElement | null) => void }>(
  { events: ['onInput', 'onKeyDown'], value: { prop: 'value', on: 'onInput' } },
  ({ ref, ...props }) => ({ tree: searchFieldView(props), handlers: searchFieldHandlers({ ...props, ref: (element: HTMLInputElement | null) => ref?.(element) }) }),
);
