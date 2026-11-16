// LineSlider as the DOM renderer draws it: the same tree and handlers as `LineSlider.tsx` and `LineSlider.svelte`.
import { domPart } from '../../foundation/view/dom';
import { lineSliderHandlers, lineSliderView, type LineSliderModelProps } from './LineSlider.model';

export const LineSliderDom = domPart<LineSliderModelProps>({ events: ['onchange'], value: { prop: 'value', on: 'onchange' } }, (props) => ({ tree: lineSliderView(props), handlers: lineSliderHandlers(props) }));
