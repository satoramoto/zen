import { useRef, type KeyboardEvent } from 'react';
import './PageList.css';

/** One page in a PageList. */
export interface PageItem {
  /** What `onChoose` carries and `chosen` names. */
  id: string;
  /** The page's name ("Chord & Split"). */
  label: string;
  /** The tooltip key, set as `data-tip`. */
  tip?: string;
}

export interface PageListProps {
  /** The pages, top to bottom. */
  pages: PageItem[];
  /** The open page's `id`; `null`: none. */
  chosen?: string | null;
  /** The list's accessible name ("Settings pages"). */
  label?: string;
  /** Called with a page's `id` on a click, or when ↑ ↓ Home End move to it. */
  onChoose?: (id: string) => void;
}

const KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'] as const;

/**
 * A vertical list of pages, one row each, with the page's name alone: the Settings screen's left
 * column.
 *
 * **Job**: show every page of a screen at once and which one is open, and open another with one
 * click or one arrow key.
 *
 * **Changed**: the hairline under every row is gone; rows are separated by a small even gap and
 * their own padding, so the only line-like thing in the column is the open page's block (rhythm,
 * hierarchy: one strong mark per column). The open page is a `--selected` block on
 * `--radius-control`, the rest plain `--text-2` names that lift to `--text-1` on a faint
 * `--surface-2` on hover: each state changes one thing (`references/color.md`, "State changes:
 * structure, not circus"), and no hue appears, because a page's place in the list is not a
 * category (colour meaning). Names stay one weight in every state so opening a page never reflows
 * the column, and they left-align on one edge for scanning (alignment). A long name truncates at
 * its end with an ellipsis, keeping its first, distinguishing words (`references/typography.md`,
 * truncation needs `min-width: 0` in flex). Focus is a `:focus-visible` accent ring drawn inset so
 * a scrolling parent never clips it (`references/craft-details.md`, focus states). Names keep their
 * own case rather than `--label-case`: they are nouns read as a list, not short control labels.
 *
 * **Kept**: names only, no summaries. Page navigation: a `nav` of buttons with
 * `aria-current="page"`; ↑ ↓ wrap, Home and End jump, each move focusing the row and calling
 * `onChoose`. Controlled: a click never moves `chosen` itself; the parent does.
 */
export function PageList({ pages, chosen = null, label = 'Pages', onChoose }: PageListProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const key = event.key as (typeof KEYS)[number];
    if (!KEYS.includes(key) || pages.length === 0) return;
    event.preventDefault();
    const to = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: pages.length - 1 }[key];
    const target = (to + pages.length) % pages.length;
    buttons.current[target]?.focus();
    onChoose?.(pages[target].id);
  }

  return (
    <nav className="yh-page-list" aria-label={label}>
      {pages.map((page, i) => (
        <button
          key={page.id}
          ref={(node) => {
            buttons.current[i] = node;
          }}
          type="button"
          className="yh-page-list__row"
          aria-current={page.id === chosen ? 'page' : undefined}
          data-tip={page.tip}
          onClick={() => onChoose?.(page.id)}
          onKeyDown={(event) => onKeyDown(event, i)}
        >
          <span className="yh-page-list__name">{page.label}</span>
        </button>
      ))}
    </nav>
  );
}
