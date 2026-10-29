import { Tree } from '../../view/Tree';
import { knobHandlers, knobView, type KnobProps } from './Knob.model';
import './parameters.css';
export type { KnobProps } from './Knob.model';
export function Knob(props: KnobProps) { return <Tree tree={knobView(props)} handlers={knobHandlers(props)} />; }
