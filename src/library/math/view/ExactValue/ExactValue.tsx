import { Tree } from '../../../view/Tree';
import { exactValueView, type ExactValueProps } from './ExactValue.model';
import '../../../primitives/Text.css';
import './ExactValue.css';
export type { ExactValueProps } from './ExactValue.model';
/** A selectable canonical value with explicit exactness. Tuning knobs: none. */
export function ExactValue(props: ExactValueProps) { return <Tree tree={exactValueView(props)} />; }
