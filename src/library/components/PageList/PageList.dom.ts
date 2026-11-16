// PageList as the DOM renderer draws it: the same tree and handlers as `PageList.tsx` and `PageList.svelte`.
import { domPart } from '../../foundation/view/dom';
import { pageListHandlers, pageListView, type PageListModelProps } from './PageList.model';
import '../../primitives/Text/Text.css';
import './PageList.css';

export const PageListDom = domPart<PageListModelProps>({ events: ['onChoose'], value: { prop: 'chosen', on: 'onChoose' } }, (props) => ({ tree: pageListView(props), handlers: pageListHandlers(props) }));
