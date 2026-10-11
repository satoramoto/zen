import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import './FolderList.css';

/** One row of a FolderList: a style folder or a sound category. */
export interface FolderItem {
  /** What `onChoose` carries and what `chosen` names. Unique within the list. */
  id: string;
  /** The folder's name ("Pop & Rock"). */
  label: string;
  /** The count at the right end ("128"). */
  count?: string;
  /** The tooltip key, set as `data-tip` for the app's tooltip layer. */
  tip?: string;
  /** Shown, not choosable (an empty or unreadable folder). */
  disabled?: boolean;
}

export interface FolderListProps {
  /** The rows, top to bottom. */
  items: FolderItem[];
  /** The `id` of the chosen row; `null` = none. A click never moves it: the parent does. */
  chosen?: string | null;
  /** The nav's accessible name ("Style folders"). */
  label: string;
  /** A fixed width in px. Default: fills its container. */
  width?: number;
  /** A fixed height in px. Default: fills its container's height. */
  height?: number;
  /** Called with a row's `id` on a click, or when ↑ ↓ Home End move to it. */
  onChoose?: (id: string) => void;
}

/** Labels longer than this keep their last word whole, so the ellipsis falls mid-name. */
const LONG = 24;

/** Split a long label into a head that may truncate and a short tail that never does. */
function splitLabel(label: string): [string, string] {
  if (label.length <= LONG) return [label, ''];
  const at = label.lastIndexOf(' ');
  if (at <= 0 || label.length - at > 14) return [label, ''];
  return [label.slice(0, at + 1), label.slice(at + 1)];
}

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
export function FolderList({ items, chosen = null, label, width, height, onChoose }: FolderListProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  // The row holding tabindex 0: follows focus, reset to `chosen` when it changes.
  const [active, setActive] = useState<string | null>(chosen);
  const [seen, setSeen] = useState<string | null>(chosen);
  if (seen !== chosen) {
    setSeen(chosen);
    setActive(chosen);
  }

  const enabled = items.flatMap((item, i) => (item.disabled ? [] : [i]));
  const activeIndex = items.findIndex((item) => item.id === active);
  const stop = activeIndex >= 0 && !items[activeIndex].disabled ? activeIndex : (enabled[0] ?? -1);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const { key } = event;
    if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'Home' && key !== 'End') return;
    event.preventDefault();
    event.stopPropagation();
    if (enabled.length === 0) return;
    const at = enabled.indexOf(index);
    let target: number;
    if (key === 'Home') target = enabled[0];
    else if (key === 'End') target = enabled[enabled.length - 1];
    else if (key === 'ArrowDown') target = enabled[Math.min(at + 1, enabled.length - 1)];
    else target = enabled[Math.max(at - 1, 0)];
    if (target === index) return;
    const item = items[target];
    setActive(item.id);
    buttons.current[target]?.focus();
    onChoose?.(item.id);
  }

  function onBlur(event: FocusEvent<HTMLElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) setActive(chosen);
  }

  return (
    <nav
      className="yh-folder-list"
      aria-label={label}
      style={{ width: width === undefined ? '100%' : `${width}px`, height: height === undefined ? '100%' : `${height}px` }}
      onBlur={onBlur}
    >
      {items.map((item, i) => {
        const isChosen = item.id === chosen;
        const [head, tail] = splitLabel(item.label);
        return (
          <button
            key={item.id}
            type="button"
            className="yh-folder-list__row"
            ref={(node) => {
              buttons.current[i] = node;
            }}
            // Named outright: the split name's pieces would otherwise be joined without their space.
            aria-label={tail && item.count !== undefined ? `${item.label} ${item.count}` : tail ? item.label : undefined}
            aria-current={isChosen ? 'true' : undefined}
            disabled={item.disabled}
            tabIndex={i === stop ? 0 : -1}
            data-tip={item.tip}
            onClick={() => onChoose?.(item.id)}
            onFocus={() => setActive(item.id)}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            <span className="yh-folder-list__label">
              <span className="yh-folder-list__head">{head}</span>
              {tail && <span className="yh-folder-list__tail">{tail}</span>}
            </span>
            {item.count !== undefined && (
              <>
                {' '}
                <span className="yh-folder-list__count">{item.count}</span>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
