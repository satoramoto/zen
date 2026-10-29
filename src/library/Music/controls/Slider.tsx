import { Tree } from '../../view/Tree';
import { sliderHandlers, sliderView, type SliderProps } from './Slider.model';
import './parameters.css';
export type { SliderProps } from './Slider.model';
export function Slider(props: SliderProps) { return <Tree tree={sliderView(props)} handlers={sliderHandlers(props)} />; }
