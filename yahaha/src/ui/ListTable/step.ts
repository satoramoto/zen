/**
 * The id a list key moves the selection to: ArrowUp/ArrowDown one row, PageUp/PageDown `page`
 * rows, Home/End the ends; clamped, no wrap. With nothing selected (or a selection not in `ids`),
 * ArrowDown, Home and PageDown go to the first row, ArrowUp, End and PageUp to the last. `null`
 * when the key isn't one of these or `ids` is empty. ListTable uses it; pages reuse it to drive the
 * list from a search field.
 */
export function stepSelection(
  ids: readonly string[],
  selected: string | null,
  key: string,
  page: number,
): string | null {
  const n = ids.length
  if (n === 0) return null
  const at = selected === null ? -1 : ids.indexOf(selected)
  const rows = Math.max(1, Math.floor(page))
  let to: number
  switch (key) {
    case 'ArrowDown':
      to = at < 0 ? 0 : at + 1
      break
    case 'ArrowUp':
      to = at < 0 ? n - 1 : at - 1
      break
    case 'PageDown':
      to = at < 0 ? 0 : at + rows
      break
    case 'PageUp':
      to = at < 0 ? n - 1 : at - rows
      break
    case 'Home':
      to = 0
      break
    case 'End':
      to = n - 1
      break
    default:
      return null
  }
  return ids[Math.min(n - 1, Math.max(0, to))]
}
