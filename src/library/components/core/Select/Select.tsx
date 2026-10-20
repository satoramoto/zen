import { useId, useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { useControlContext } from '../../../primitives/Stack';
import { viewState } from '../../music/viewState';
import { SELECT_CLOSED, selectHandlers, selectView, type SelectModelProps } from './Select.model';
import { TYPING_WINDOW, useSelect, type UseSelectOptions } from './useSelect';
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import '../Popover/Popover.css';
import './Select.css';

// The props and the tree are framework-free, in the model; the behaviour is the `select` and
// `selectMenu` stores (`selectInput.ts`). `Select.svelte` draws the same tree.
export { TYPING_WINDOW, useSelect, type UseSelectOptions };

export interface SelectProps extends SelectModelProps {
  onChange(next: number): void;
}

/**
 * A compact enum: one member on screen, the rest in a menu of our own.
 *
 * **Job.** Choose one of many where only the choice needs to be seen (a blend mode, a scale, an
 * input): a field the width of its longest member, so changing it never resizes the panel it
 * sits in. The open menu is ours, not the system's, so it wears the same theme as everything
 * around it.
 *
 * **Behaviour.** An ARIA select-only combobox (behaviour in the `select` and `selectMenu` stores,
 * `selectInput.ts`). Click, Enter or Space
 * opens; closed, the arrows, Home, End and type-ahead pick straight away; open, they move the
 * highlight and Enter takes it. A letter repeated walks the members starting with it; a word
 * searches. `onChange` fires only on a change. Focus never leaves the trigger. Escape, a pointer
 * or a wheel elsewhere closes it (only Escape puts focus back); Tab closes without being
 * swallowed. Handled keys are stopped so a surface underneath doesn't act on them.
 *
 * **In a toolbar.** Inside a toolbar `Group` (`ControlContext { quiet: true }`) the trigger is
 * quiet: no fill, border or shadow, the value in the bar's ink and the caret in a quieter one, a
 * faint tint from the material only on hover and while open. Same height, width and hit target;
 * keys and the menu are unchanged. The root says so as `data-quiet`. There is no prop for it: the
 * context changes the look, never a per-use style.
 *
 * **Parts.** `root` (`--lib-select-chars`, the longest member; `--lib-select-width` when `width`
 * is set), `caption` (the `name`), `trigger` (a `key`), `value`, `caret`, `menu` (drawn as a
 * `Popover` is, so a float `Layer` in the top layer, at least the trigger's width), `option`
 * (`data-active` while highlighted, `data-chosen` for the held member).
 */
export function Select(props: SelectProps) {
  // Open and the highlighted row: view state the stores set through `state`.
  const [state] = useState(() => viewState(SELECT_CLOSED));
  const view = useSyncExternalStore(state.subscribe, state.get);
  // In a toolbar Group the trigger is quiet: the context decides the look, not the caller.
  const { quiet } = useControlContext();
  const id = useId();
  return <Tree tree={selectView(props, { ...view, quiet, id })} handlers={selectHandlers(props, state.set)} />;
}

export default Select;
