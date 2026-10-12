import { useEffect, useRef, useState, type ButtonHTMLAttributes, type FocusEvent, type KeyboardEvent } from 'react';
import type { TipAction } from '../Pad/Pad';
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
  /** The tighter padding a narrow region needs (`--space-2` instead of `--space-3`). Default: false. */
  dense?: boolean;
  /** The app's tooltip action, applied to each tab that has a `tip`, with that tab's key. */
  tipAction?: TipAction;
  /**
   * How the chosen tab is marked: `underline` (the default, every size), ink at the strong weight
   * and a 2px `--selected` rule on the run's hairline, so the solid fill is kept for what plays; or
   * `block`, the solid `--selected` block, kept for compatibility.
   */
  look?: ChosenTabsLook;
}

/** How a ChosenTabs marks its chosen tab: see `ChosenTabsProps.look`. */
export type ChosenTabsLook = 'block' | 'underline';

type Face = 'chosen' | 'off' | 'disabled';

/** Applies `action` to `node` with `key` while all three are set; destroys it on change and unmount. */
function useTip(node: HTMLElement | null, key: string | undefined, action: TipAction | undefined) {
  useEffect(() => {
    if (!node || !action || key === undefined) return;
    const handle = action(node, key);
    return () => handle?.destroy?.();
  }, [node, key, action]);
}

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tip?: string;
  tipAction?: TipAction;
}

/** One tab's button: renders `data-tip` and runs its own tooltip action. */
function TabButton({ tip, tipAction, ...rest }: TabButtonProps) {
  const [node, setNode] = useState<HTMLButtonElement | null>(null);
  useTip(node, tip, tipAction);
  return <button {...rest} ref={setNode} type="button" data-tip={tip} />;
}

/** A tab's words; `data-label` lets CSS reserve the width of the chosen (strong) face. */
function TabLabel({ label }: { label: string }) {
  return (
    <span className="yh-chosen-tabs__label" data-label={label}>
      {label}
    </span>
  );
}

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
 * **Changed**: the chosen tab is marked by ink and a rule, not a fill (`look="underline"`, the
 * default at every size, the app bar included): the label goes to `--text-1` at the strong weight
 * and a 2px `--selected` rule lies on the run's own hairline under it, so it reads as a tab attached
 * to what it shows. The solid `--selected` fill was the loudest mark on the Stage, spent on every
 * header; a solid fill now means sounding or running only (colour meaning, hierarchy). `block`, the
 * full-height `--selected` block with top corners on `--radius-control`, stays as an option. Every
 * state changes one thing only (`references/color.md`, "State changes: structure, not circus"):
 * rest is `--text-2`, hover lifts the label to `--text-1`, chosen adds the rule and weight, and
 * disabled drops to `--text-3` (still readable: a disabled page is information; `--text-4` all but
 * vanished on black); no hue appears, because a tab's position carries no category (colour
 * meaning). Each label reserves the width of its strong face (a hidden copy, kept out of the
 * accessible name), so choosing never shifts the run's widths, and labels use tabular figures
 * (`references/typography.md`, tabular numbers). Labels follow the pack's
 * `--label-case`, and the height follows `--control-h`, so the run sits on the same rhythm as the
 * pack's other controls (rhythm). Focus is a `:focus-visible` accent ring only for keyboard users
 * (`references/craft-details.md`, focus states). `dense` tightens each tab's side padding from
 * `--space-3` to `--space-2`, so a narrow region keeps the whole run in view without faking it
 * through the run's private variable (rhythm). `tipAction` runs the app's tooltip action on each
 * tab with that tab's own `tip`, the same handle shape as Pad's.
 *
 * **Kept**: a run, not buttons: no outline at rest. Labels never wrap and never truncate (they are
 * one or two words). `page` is page navigation with `aria-current`; `header` and `compact` are a
 * tablist with roving tabindex and automatic activation, → ← wrapping and Home / End jumping over
 * disabled tabs, and the keys never reaching the app's window handler. Controlled: it draws
 * `chosen` as given and only calls `onChoose`.
 */
export function ChosenTabs({
  tabs,
  chosen = null,
  size = 'header',
  label,
  onChoose,
  dense = false,
  tipAction,
  look = 'underline',
}: ChosenTabsProps) {
  const isList = size !== 'page';
  const root = useRef<HTMLDivElement>(null);
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
    root.current?.querySelectorAll<HTMLButtonElement>(':scope > .yh-chosen-tabs__tab')[target]?.focus();
    onChoose?.(tab.id);
  }

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) setActive(chosen);
  }

  const density = dense ? 'dense' : undefined;

  if (!isList) {
    return (
      <div className="yh-chosen-tabs" data-size={size} data-density={density} data-look={look}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            className="yh-chosen-tabs__tab"
            aria-current={tab.id === chosen ? 'page' : undefined}
            aria-disabled={tab.disabled ? 'true' : undefined}
            aria-label={tab.name}
            data-face={face(tab, chosen)}
            tip={tab.tip}
            tipAction={tipAction}
            onClick={() => choose(tab)}
          >
            <TabLabel label={tab.label} />
          </TabButton>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={root}
      className="yh-chosen-tabs"
      data-size={size}
      data-density={density}
      data-look={look}
      role="tablist"
      aria-label={label || undefined}
      aria-orientation="horizontal"
      onBlur={onBlur}
    >
      {tabs.map((tab, i) => (
        <TabButton
          key={tab.id}
          role="tab"
          className="yh-chosen-tabs__tab"
          aria-selected={tab.id === chosen}
          aria-disabled={tab.disabled ? 'true' : undefined}
          aria-label={tab.name}
          tabIndex={i === stop ? 0 : -1}
          data-face={face(tab, chosen)}
          tip={tab.tip}
          tipAction={tipAction}
          onClick={() => choose(tab)}
          onFocus={() => setActive(tab.id)}
          onKeyDown={(event) => onKeyDown(event, i)}
        >
          <TabLabel label={tab.label} />
        </TabButton>
      ))}
    </div>
  );
}
