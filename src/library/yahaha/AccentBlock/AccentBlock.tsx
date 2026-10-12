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
  /**
   * The button's trailing chevron. Default `true`; `false` where the block already sits between
   * step keys (‹ name ›), so the line doesn't carry three arrows. Ignored for `span`.
   */
  chevron?: boolean;
}

/**
 * AccentBlock: "the device", named in a block marked with the style's hue.
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
 * palettes. Here the colour is a bar on the block's leading edge in the contract's `--style` role
 * hue (the style's own colour, as its name is the style's; `--accent` stays the focus ring) and
 * the name is primary text on the raised `--surface-2`, so it passes in every palette
 * and never looks pressed (color.md › semantics; one meaning per colour). The bar is `--space-1`
 * wide, so the style's hue reads as a mark rather than a hairline. *Hierarchy*: the name is
 * strong weight at body size in the theme's label case, the loudest text on the line (it was the
 * smallest, at label size beside the metre) without a louder colour. *Affordance*: the button
 * form lifts to `--surface-3` on hover and carries a trailing chevron, so "this opens something"
 * reads before it is clicked; where it sits between ‹ and › step keys (`chevron={false}`) the
 * chevron goes, so the line doesn't show three arrows in a row. The plain label has neither.
 * *Rhythm*: heights come from `--control-h` (line) and three quarters of it (knob),
 * so the block sits flush with the density's controls beside it. *Materials:* named parts
 * (`data-part`: block, text, chevron); the button form is a `key` made of the theme's key
 * material (hover tints it, a press uses `--mat-key-pressed`); the plain label keeps the raised
 * `--surface-2`. The style's bar stays on the leading edge whatever the material.
 *
 * **Kept.** One line, ellipsized at its width with the whole name in the button's accessible
 * name; the `empty` text so the block never collapses; the two sizes; `button` versus `span`; the
 * tooltip key and hook on the button only; Space and Enter press it (a native button); focus
 * ring only on keyboard focus.
 */
export function AccentBlock({ label, empty = '—', as = 'span', size = 'line', width, name, tip, tipAction, onPress, chevron = true }: AccentBlockProps) {
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
        data-part="block"
        data-material="key"
        data-face="accent"
        data-size={size}
        data-tip={tip}
        onClick={() => onPress?.()}
      >
        <span className="yh-accentblock__text" data-part="text">{shown}</span>
        {chevron && (
          <svg className="yh-accentblock__chevron" data-part="chevron" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M4.5 2.5 8 6l-3.5 3.5" />
          </svg>
        )}
      </button>
    );
  }
  return (
    <span className="yh-accentblock" style={style} data-part="block" data-face="accent" data-size={size}>
      <span className="yh-accentblock__text" data-part="text">{shown}</span>
    </span>
  );
}
