import { Tree } from '../../../view/Tree';
import { mathInspectorView, type MathInspectorProps } from './MathInspector.model';
import '../../../primitives/Text.css';
import '../../../primitives/Stack.css';
import '../ExactValue/ExactValue.css';
import './MathInspector.css';
export type { MathInspectorProps, MathProperty, MathMembership } from './MathInspector.model';
/** Exact object facts and predicate membership, supplied by the application. Tuning knobs: none. */
export function MathInspector(props: MathInspectorProps) { return <Tree tree={mathInspectorView(props)} />; }
