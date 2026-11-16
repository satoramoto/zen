// FigureStrip as the DOM renderer draws it: the same tree as `FigureStrip.tsx` and `FigureStrip.svelte`.
import { domPart } from '../../foundation/view/dom';
import { figureStripView, type FigureStripModelProps } from './FigureStrip.model';
import '../../primitives/Text/Text.css';
import './FigureStrip.css';

export const FigureStripDom = domPart<FigureStripModelProps>({}, (props) => ({ tree: figureStripView(props) }));
