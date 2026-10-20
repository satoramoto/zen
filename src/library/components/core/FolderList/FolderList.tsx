import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { folderListHandlers, folderListView, type FolderListLocal, type FolderListModelProps } from './FolderList.model';
import '../../../primitives/Text.css';
import './FolderList.css';

// The props, the tree and the behaviour are framework-free, in the model and its
// `folderListKeys.ts` store; this file and `FolderList.svelte` only hand the model's tree to their
// `Tree`, keeping the roving tab stop as view state.
export type { FolderItem } from './FolderList.model';

export type FolderListProps = FolderListModelProps;

/**
 * A vertical one-of-many list: the Library's style folders and sound categories.
 *
 * **Job**: let a player see every folder and how full it is, spot the one they are in, and move
 * to another with one press or one arrow key. The name is read; the count is glanced at.
 *
 * **Changed**: the chosen row takes the palette's `--selected` fill on the control radius with
 * its name at the strong weight, so "where am I" survives a glance and stays clear even where
 * `--selected` is close to the ground (hierarchy; `references/typography.md` on weight carrying
 * emphasis). Rows gain a hover step (`--surface-2`, name to `--text-1`) and a keyboard ring in
 * the accent inset on the row, so pointer and keyboard each show where they are and the ring is
 * never clipped by the scroller (affordance; `references/craft-details.md` on `:focus-visible`).
 * Counts drop to caption size in `--text-3` with tabular numerals, right-aligned, so they form a
 * quiet column the eye can scan down without competing with the names (numerals, alignment).
 * Long names truncate in the middle: the last word stays whole ("User styles on the ext… name")
 * because the end of a folder name is usually what tells siblings apart. Rows sit on the
 * density's `--control-h`, inset by `--space-1`, for one rhythm with the rest of the page. No
 * hue is used: a folder list carries no category meaning (`references/color.md`).
 *
 * **Kept**: one tab stop with ↑ ↓ Home End moving focus and choosing, stopping at the ends and
 * skipping disabled rows; keys never reach the page; a controlled `chosen` with
 * `aria-current`; disabled rows shown but not choosable; the list scrolls inside its box.
 */
export function FolderList(props: FolderListProps) {
  // The row holding tabindex 0: follows focus, back to `chosen` when it changes or focus leaves.
  const [local] = useState(() => viewState<FolderListLocal | null>(null));
  const current = useSyncExternalStore(local.subscribe, local.get);
  return <Tree tree={folderListView(props, current)} handlers={folderListHandlers(props, local.set)} />;
}
