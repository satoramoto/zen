// BarList as the DOM renderer draws it: the same tree as `BarList.tsx` and `BarList.svelte`.
import { domPart } from '../../foundation/view/dom';
import { barListView, type BarListModelProps } from './BarList.model';
import '../../primitives/Text/Text.css';
import './BarList.css';

export const BarListDom = domPart<BarListModelProps>({}, (props) => ({ tree: barListView(props) }));
