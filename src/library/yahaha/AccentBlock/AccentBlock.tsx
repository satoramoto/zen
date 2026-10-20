import { useRef, type CSSProperties } from 'react';
import { Text } from '../../primitives/Text';
import { accentBlockView, type AccentBlockModelProps } from './AccentBlock.model';
import { useTip } from './useTip';
import './AccentBlock.css';

// The props and the block are framework-free, in the model; `AccentBlock.svelte` renders the same view.
export type { TipAction, AccentBlockModelProps } from './AccentBlock.model';

export type AccentBlockProps = AccentBlockModelProps;

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
export function AccentBlock(props: AccentBlockProps) {
  const { tip, tipAction, onPress } = props;
  const view = accentBlockView(props);
  const ref = useRef<HTMLElement>(null);

  useTip(ref, { tip, tipAction, enabled: view.tip });

  return (
    <Text
      as={view.as}
      {...view.text}
      ref={ref}
      className={view.block.className}
      style={view.style as CSSProperties | undefined}
      {...view.block.attrs}
      onClick={view.as === 'button' ? () => onPress?.() : undefined}
    >
      <span className="yh-accentblock__text" data-part="text">
        {view.shown}
      </span>
      {view.chevron && (
        <svg className="yh-accentblock__chevron" data-part="chevron" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M4.5 2.5 8 6l-3.5 3.5" />
        </svg>
      )}
    </Text>
  );
}
