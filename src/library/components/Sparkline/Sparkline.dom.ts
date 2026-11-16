// Sparkline as the DOM renderer draws it: the same tree as `Sparkline.tsx` and `Sparkline.svelte`.
import { domPart } from '../../foundation/view/dom';
import { sparklineView, type SparklineModelProps } from './Sparkline.model';
import './Sparkline.css';

export const SparklineDom = domPart<SparklineModelProps>({}, (props) => ({ tree: sparklineView(props) }));
