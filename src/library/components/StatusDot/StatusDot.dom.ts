// StatusDot as the DOM renderer draws it: the same tree and handlers as `StatusDot.tsx` and `StatusDot.svelte`.
import { domPart } from '../../foundation/view/dom';
import { statusDotView, type StatusDotModelProps } from './StatusDot.model';

export const StatusDotDom = domPart<StatusDotModelProps>({}, (props) => ({ tree: statusDotView(props) }));
