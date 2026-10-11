/** One row of a FolderList: a style folder or a sound category. */
export type FolderItem = {
  /** What `onchoose` carries and what `chosen` names. Unique within the list. */
  id: string
  /** The folder's name ("Pop & Rock"). */
  label: string
  /** The count at the right end ("128"). */
  count?: string
  /** The tooltip key, set as `data-tip` and passed to `tipAction`. */
  tip?: string
  /** Shown, not choosable (an empty or unreadable folder). */
  disabled?: boolean
}
