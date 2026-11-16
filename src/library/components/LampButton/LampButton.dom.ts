// LampButton as the DOM renderer draws it: the same tree and handlers as `LampButton.tsx` and `LampButton.svelte`.
import { domPart } from '../../foundation/view/dom';
import { lampButtonHandlers, lampButtonView, type LampButtonModelProps } from './LampButton.model';
import '../../primitives/Text/Text.css';
import './LampButton.css';

export const LampButtonDom = domPart<LampButtonModelProps>({ events: ['onToggle', 'onLongPress', 'onLongRelease'], value: { prop: 'on', on: 'onToggle' } }, (props) => ({ tree: lampButtonView(props), handlers: lampButtonHandlers(props) }));
