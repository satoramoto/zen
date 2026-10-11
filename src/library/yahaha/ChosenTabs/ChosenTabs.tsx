import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import './ChosenTabs.css';

/** One choice in a ChosenTabs run. */
export interface TabItem {
  /** What `onChoose` carries and what `chosen` names. Unique within the run. */
  id: string;
  /** The word on the tab ("Vol", "Quick Racks"). */
  label: string;
  /** The accessible name when the label is short ("Volume" for "Vol"). Default: the label. */
  name?: string;
  /** Shown, not choosable. */
  disabled?: boolean;
  /** The tooltip key (`view.stage`, `mixer.layer`), set as `data-tip`. */
  tip?: string;
}

export interface ChosenTabsProps {
  /** The choices, left to right. */
  tabs: TabItem[];
  /** The `id` of the chosen tab; `null`: none. A click never moves it: the parent does. */
  chosen?: string | null;
  /**
   * The kind; every size draws the same. `page` is page navigation (buttons with
   * `aria-current`, inside the parent's nav); `header` and `compact` are a tablist with roving
   * focus and automatic activation.
   */
  size?: 'page' | 'header' | 'compact';
  /** The tablist's accessible name (`header`, `compact`). Ignored at `page`. */
  label?: string;
  /** Called with a tab's `id` on a click (the chosen tab too), or when an arrow, Home or End moves to it. */
  onChoose?: (id: string) => void;
}

type Face = 'chosen' | 'off' | 'disabled';

function face(tab: TabItem, chosen: string | null): Face {
  if (tab.disabled) return 'disabled';
  return tab.id === chosen ? 'chosen' : 'off';
}

/**
 * The one tab style for every one-of-many choice in a header: the app's pages, the fader page,
 * the fader layer, the knob page, the pad bank.
 *
 * **Job**: show a short run of choices side by side, make the picked one unmistakable at a glance,
 * and pick another with one click or one arrow key.
 *
 * **Changed**: the chosen tab is now a full-height `--selected` block with its top corners on
 * `--radius-control`, standing on the run's own hairline, so it reads as a tab attached to what it
 * shows rather than a floating short bar (affordance). Every state changes one thing only
 * (`references/color.md`, "State changes: structure, not circus"): rest is `--text-2`, hover lifts
 * the label to `--text-1` on a faint `--surface-2`, chosen is the fill, disabled drops to
 * `--text-4`; no hue appears, because a tab's position carries no category (colour meaning). The
 * weight never changes between states, so choosing never shifts the run's widths, and labels use
 * tabular figures (`references/typography.md`, tabular numbers). Labels follow the pack's
 * `--label-case`, and the height follows `--control-h`, so the run sits on the same rhythm as the
 * pack's other controls (rhythm). Focus is a `:focus-visible` accent ring only for keyboard users
 * (`references/craft-details.md`, focus states).
 *
 * **Kept**: a run, not buttons: no outline at rest. Labels never wrap and never truncate (they are
 * one or two words). `page` is page navigation with `aria-current`; `header` and `compact` are a
 * tablist with roving tabindex and automatic activation, → ← wrapping and Home / End jumping over
 * disabled tabs, and the keys never reaching the app's window handler. Controlled: it draws
 * `chosen` as given and only calls `onChoose`.
 */
export function ChosenTabs({ tabs, chosen = null, size = 'header', label, onChoose }: ChosenTabsProps) {
  const isList = size !== 'page';
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  // The tab holding tabindex 0 in a tablist: follows focus, reset to `chosen` when it changes.
  const [active, setActive] = useState<string | null>(chosen);
  useEffect(() => setActive(chosen), [chosen]);

  const enabled = tabs.flatMap((tab, i) => (tab.disabled ? [] : [i]));
  const activeIndex = tabs.findIndex((tab) => tab.id === active);
  const stop = activeIndex >= 0 && !tabs[activeIndex].disabled ? activeIndex : (enabled[0] ?? 0);

  function choose(tab: TabItem) {
    if (tab.disabled) return;
    onChoose?.(tab.id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const { key } = event;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return;
    event.preventDefault();
    event.stopPropagation();
    if (enabled.length === 0) return;
    let target: number;
    if (key === 'Home') target = enabled[0];
    else if (key === 'End') target = enabled[enabled.length - 1];
    else {
      const step = key === 'ArrowRight' ? 1 : -1;
      const at = enabled.indexOf(index);
      const from = at >= 0 ? at : step > 0 ? -1 : 0;
      target = enabled[(from + step + enabled.length) % enabled.length];
    }
    if (target === index) return;
    const tab = tabs[target];
    setActive(tab.id);
    buttons.current[target]?.focus();
    onChoose?.(tab.id);
  }

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) setActive(chosen);
  }

  if (!isList) {
    return (
      <div className="yh-chosen-tabs" data-size={size}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="yh-chosen-tabs__tab"
            aria-current={tab.id === chosen ? 'page' : undefined}
            aria-disabled={tab.disabled ? 'true' : undefined}
            aria-label={tab.name}
            data-face={face(tab, chosen)}
            data-tip={tab.tip}
            onClick={() => choose(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="yh-chosen-tabs"
      data-size={size}
      role="tablist"
      aria-label={label || undefined}
      aria-orientation="horizontal"
      onBlur={onBlur}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={(node) => {
            buttons.current[i] = node;
          }}
          type="button"
          role="tab"
          className="yh-chosen-tabs__tab"
          aria-selected={tab.id === chosen}
          aria-disabled={tab.disabled ? 'true' : undefined}
          aria-label={tab.name}
          tabIndex={i === stop ? 0 : -1}
          data-face={face(tab, chosen)}
          data-tip={tab.tip}
          onClick={() => choose(tab)}
          onFocus={() => setActive(tab.id)}
          onKeyDown={(event) => onKeyDown(event, i)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
