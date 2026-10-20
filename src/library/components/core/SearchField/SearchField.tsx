import type { Ref } from 'react';
import { Tree } from '../../../view/Tree';
import { searchFieldHandlers, searchFieldView, type SearchFieldModelProps } from './SearchField.model';
import '../../../primitives/Text.css';
import './SearchField.css';

// The props, the field and its keys are framework-free, in the model and its stores; this file and
// `SearchField.svelte` only hand the model's tree to their `Tree`.
export type { SearchFieldModelProps } from './SearchField.model';

export interface SearchFieldProps extends SearchFieldModelProps {
  /** The `<input>` itself, so the page can focus it (a ⌘F shortcut) or read its selection. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * The search field of the Library pages (styles, sounds, instruments).
 *
 * **Job**: take a few letters fast and narrow the list beside it, while the arrow keys keep
 * driving that list. A player needs to see that the field is a field, whether it has focus,
 * and whether a filter is on.
 *
 * **Changed**: the field follows the pack's input chrome (`--input-fill`,
 * `--input-border-sides`, `--input-border-bottom`, `--radius-input`) on the density's
 * `--control-h`, instead of always drawing an underline, so it sits with the other inputs of
 * any theme (consistency). Focus draws the accent ring around the whole field, not only a darker
 * line, so it reads at a glance (affordance; `references/craft-details.md` on `:focus-within`
 * for compound controls). The magnifier is `--text-3` while empty and steps up to `--text-2`
 * once a filter is on, and the placeholder is `--text-3` against typed text in `--text-1`, so
 * "filter on" never depends on reading the text (`references/typography.md`'s text colour
 * system; `references/color.md`: no hue, nothing here means a category). A non-empty field gains
 * a clear button, the pointer twin of Esc, kept out of the tab order so the field stays one
 * stop.
 *
 * **Kept**: controlled `value` with `onInput` per edit; Esc on a non-empty field clears it and
 * stops there; on an empty field Esc and every other key reach `onKeyDown` and the page;
 * a `searchbox` named by a visually hidden label; no autocomplete or spellcheck.
 *
 * **Added**: `ref` reaches the `<input>` (a page focuses it from a shortcut); `disabled` dims the
 * field to `--text-4` with a dashed edge, as a disabled key reads, takes the input out of reach
 * and drops the clear button; `title` is the field's hover hint.
 */
export function SearchField({ ref, ...props }: SearchFieldProps) {
  return <Tree tree={searchFieldView(props)} handlers={searchFieldHandlers({ ...props, ref })} />;
}
