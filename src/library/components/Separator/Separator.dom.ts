// Separator as the DOM renderer draws it: the same tree and handlers as `Separator.tsx` and `Separator.svelte`.
import { domPart } from '../../foundation/view/dom';
import { separatorView, type SeparatorModelProps } from './Separator.model';
import './Separator.css';

export const SeparatorDom = domPart<SeparatorModelProps>({}, (props) => ({ tree: separatorView(props) }));
