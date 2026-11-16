// Readout as the DOM renderer draws it: the same tree and handlers as `Readout.tsx` and `Readout.svelte`.
import { domPart } from '../../foundation/view/dom';
import { readoutHandlers, readoutView, type ReadoutModelProps } from './Readout.model';
import '../../primitives/Text/Text.css';
import './Readout.css';

export const ReadoutDom = domPart<ReadoutModelProps>({ events: ['onChange'], value: { prop: 'value', on: 'onChange' } }, (props) => ({ tree: readoutView(props), handlers: readoutHandlers(props) }));
