import { Tree } from '../../../view/Tree';
import { expressionFieldView, expressionFieldHandlers, type ExpressionFieldProps } from './ExpressionField.model';
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './ExpressionField.css';
export type { ExpressionFieldProps } from './ExpressionField.model';
/** Controlled text for a mathematical expression; Enter commits, Escape cancels. Tuning knobs: none. */
export function ExpressionField(props: ExpressionFieldProps) { return <Tree tree={expressionFieldView(props)} handlers={expressionFieldHandlers(props)} />; }
