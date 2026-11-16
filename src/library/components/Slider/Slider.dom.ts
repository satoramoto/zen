// Slider as the DOM renderer draws it: the same tree and handlers as `Slider.tsx` and `Slider.svelte`.
import { domPart } from '../../foundation/view/dom';
import { sliderHandlers, sliderView, type SliderEntry, type SliderModelProps } from './Slider.model';
import '../../primitives/Text/Text.css';
import '../../primitives/Surface/Surface.css';
import './Slider.css';

export const SliderDom = domPart<SliderModelProps>({ events: ['onChange', 'onRelease', 'onDepth'], value: { prop: 'value', on: 'onChange' } }, (props, use) => {
  const entry = use.state<SliderEntry>(null);
  return { tree: sliderView(props, entry.get()), handlers: sliderHandlers(props, entry.set) };
});
