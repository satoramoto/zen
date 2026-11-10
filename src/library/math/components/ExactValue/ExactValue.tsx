import { Tree } from '../../../foundation/view/Tree';
import { exactValueView, type ExactValueProps } from './ExactValue.model';
import '../../../primitives/Text/Text.css';
import './ExactValue.css';
export type { ExactValueProps } from './ExactValue.model';
/** A selectable canonical value with explicit exactness. Tuning knobs: none. */
export function ExactValue(props: ExactValueProps) { return <Tree tree={exactValueView(props)} />; }
