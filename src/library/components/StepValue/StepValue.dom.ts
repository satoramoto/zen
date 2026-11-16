// StepValue as the DOM renderer draws it: the same tree and handlers as `StepValue.tsx` and `StepValue.svelte`.
import { domPart } from '../../foundation/view/dom';
import { stepValueHandlers, stepValueView, type StepValueModelProps } from './StepValue.model';
import '../../primitives/Text/Text.css';
import './StepValue.css';

export const StepValueDom = domPart<StepValueModelProps>({ events: ['onchange'], value: { prop: 'value', on: 'onchange' } }, (props) => ({ tree: stepValueView(props), handlers: stepValueHandlers(props) }));
