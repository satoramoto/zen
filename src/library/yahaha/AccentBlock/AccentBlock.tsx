import { useEffect, useRef, type CSSProperties } from 'react';
import './AccentBlock.css';

/** The app's tooltip hook (a Svelte action): given the element and a tooltip key; may return a handle. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => { update?: (key: string) => void; destroy?: () => void } | void;

export interface AccentBlockProps {
  /** The text in the block ("Sunday Drive Pop", "Style", "Swap R1"). */
  label: string;
  /** Shown when the label is empty or whitespace only. */
  empty?: string;
  /** `button` calls `onPress` (the style name); `span` is a plain label (the knob page). */
  as?: 'span' | 'button';
  /** `line`: a control's height (the style line); `knob`: three quarters of it (a band header row). */
  size?: 'line' | 'knob';
  /** A fixed width in px; a longer label ends in an ellipsis. Default: as wide as the label. */
  width?: number;
  /** The button's accessible name when the label alone isn't enough ("Sunday Drive Pop: open the Browser"). */
  name?: string;
  /** The tooltip key, set as `data-tip` on the button. Ignored for `span`. */
  tip?: string;
  /** The app's tooltip hook, applied to the button when `tip` is set. Ignored for `span`. */
  tipAction?: TipAction;
  /** Called on a click, Space or Enter (`button` only). */
  onPress?: () => void;
}

/**
 * AccentBlock: "the device", named in an accent-marked block.
 *
 * **Job.** Name what the player is driving: the loaded style on the style line (a button that
 * opens the Browser) and the knob page over the knobs (a plain label). It is the anchor a player
 * looks for first, so it must be the strongest name on its row, yet it must never read as on,
 * chosen or waiting.
 *
 * **Changed.** *Colour meaning*: the original filled the block with the violet accent and wrote
 * the name in the ground colour. On the contract that collides twice: a solid fill is how
 * `--selected` and `--action` speak, and `--accent` is the role for focus rings and small
 * highlights with no ink paired to it, so a name on a full accent fill falls under 4.5:1 in some
 * palettes. Here the accent is a bar on the block's leading edge (a small highlight, its contract
 * role) and the name is primary text on the raised `--surface-2`, so it passes in every palette
 * and never looks pressed (color.md › semantics; one meaning per colour). *Hierarchy*: the name is
 * strong weight at label size in the theme's label case, the loudest text on the line without a
 * louder colour. *Affordance*: the button form carries a trailing chevron and lifts to
 * `--surface-3` on hover, so "this opens something" reads before it is clicked; the plain label
 * has neither. *Rhythm*: heights come from `--control-h` (line) and three quarters of it (knob),
 * so the block sits flush with the density's controls beside it.
 *
 * **Kept.** One line, ellipsized at its width with the whole name in the button's accessible
 * name; the `empty` text so the block never collapses; the two sizes; `button` versus `span`; the
 * tooltip key and hook on the button only; Space and Enter press it (a native button); focus
 * ring only on keyboard focus.
 */
export function AccentBlock({ label, empty = '—', as = 'span', size = 'line', width, name, tip, tipAction, onPress }: AccentBlockProps) {
  const shown = label.trim() === '' ? empty : label;
  const style: CSSProperties | undefined = width === undefined ? undefined : { width: `${width}px` };
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (as !== 'button' || !tip || !tipAction || !ref.current) return;
    const handle = tipAction(ref.current, tip);
    return () => handle?.destroy?.();
  }, [as, tip, tipAction]);

  if (as === 'button') {
    return (
      <button
        ref={ref}
        type="button"
        className="yh-accentblock"
        style={style}
        aria-label={name}
        data-face="accent"
        data-size={size}
        data-tip={tip}
        onClick={() => onPress?.()}
      >
        <span className="yh-accentblock__text">{shown}</span>
        <svg className="yh-accentblock__chevron" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M4.5 2.5 8 6l-3.5 3.5" />
        </svg>
      </button>
    );
  }
  return (
    <span className="yh-accentblock" style={style} data-face="accent" data-size={size}>
      <span className="yh-accentblock__text">{shown}</span>
    </span>
  );
}
