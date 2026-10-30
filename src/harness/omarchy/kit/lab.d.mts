import type {Element} from './ui.mjs';
export interface State {value: number; checked: boolean; choice: string; input: string; count: number}
export function initial(): State;
export function reduce(state: State, action: string, payload?: unknown, value?: unknown): State;
export function view(state: State): Element;
