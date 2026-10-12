import { useEffect, useState, type ButtonHTMLAttributes } from 'react';
import type { TipAction } from '../../components/music/Pad/Pad';
import { Text } from '../../primitives/Text';
import './OneTouchPicker.css';

/** A number's button: a `numeral` Text at label size; renders `data-tip` and runs the tooltip action with its own key. */
function NumberButton({ tip, tipAction, role, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tip: string; tipAction?: TipAction }) {
  const [node, setNode] = useState<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!node || !tipAction) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [node, tip, tipAction]);
  return <Text {...rest} as="button" role="numeral" size="label" ariaRole={role} ref={setNode} type="button" data-tip={tip} />;
}

export interface OneTouchPickerProps {
  /** The applied One Touch, 1 to `numbers`; 0 when none is. */
  applied?: number;
  /** How many One Touch settings the style has: numbers past it are disabled. */
  count?: number;
  /** How many numbers to draw. */
  numbers?: number;
  /** The words before the numbers. */
  label?: string;
  /** `horizontal`: label then one strip of numbers. `vertical`: the label on top, the strip under it. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Cells: no wrapper. The label and each number are top-level elements, 1 + `numbers` of them,
   * each filling its parent's cell; the parent supplies the group role and name.
   */
  cells?: boolean;
  /** Cells: the outlines' and the applied mark's colour, `neutral` or `a` (the style's own colour: a One Touch is a setting of the style). */
  hue?: 'neutral' | 'a';
  /** The group's accessible name. Default: says which is applied and the Launchkey's Shift + pads 9 to 12. */
  name?: string;
  /** Called with 1 to `count` when a number is pressed (applies it at once). */
  onApply?: (n: number) => void;
  /** The app's tooltip action, applied to each number with its own key (`ots.<n>`). */
  tipAction?: TipAction;
}

/**
 * **Job.** Shows which of the style's One Touch Settings is applied and applies another with one
 * press. At a glance a player needs: is one applied, which, and which numbers this style has at all.
 *
 * **Changed.** The original drew bare digits with an underline for the applied one, so the numbers
 * barely read as buttons and "applied" was a thin line (affordance, contrast). Here the numbers sit
 * in one segmented strip of equal square cells, so the set reads as one choice. *Colour meaning:*
 * a solid fill on the Stage means "sounding or running" (the playing section's block), so the
 * applied number is chosen, not filled: primary ink with a 2px rule in the style's role hue
 * (`--style`) along the cell's foot, the same ink-plus-underline mark an underlined tab uses, and the
 * hero no longer shows two solid blocks side by side (`../hues`, `color.md`: colour has one
 * meaning). The others are quiet outlined cells that lift on hover. *State clarity:* numbers past
 * the style's count keep their cell with a dashed edge and the muted ink (`--text-3`), the Stage's
 * one disabled face: absent, not "wrong" as the struck-through face read. Digits use the readout
 * face with tabular numerals so 1-4 sit on one rhythm (`typography.md`), and the label is the
 * Stage's one caption (caption size, body weight, `--text-3`, label case) above or beside the
 * strip (hierarchy: the label names, the numbers act). In cells, the `a` hue draws the outlines
 * and the mark in `--style`, so the style's One Touch numbers wear the style's colour and never
 * the `--accent` focus/highlight role. `tipAction` runs the app's tooltip
 * action, in Pad's handle shape, on each number with that number's own key, since each number is
 * its own control with its own tooltip; the label and group have none. *Materials:* named parts
 * (`data-part`: root, label, strip, number); each number is a `key` of the theme's key material,
 * the applied one pressed (`--mat-key-pressed`) under its mark, the missing ones bare slots.
 *
 * **Kept.** A press asks for that One Touch through `onApply` and changes nothing itself; each number
 * is its own button with `aria-pressed` and a spoken name naming its Launchkey pad (Shift + pad 9-12);
 * the group's default name says which is applied; `cells` still renders without a wrapper for a
 * parent grid; `data-face` and `data-tip` (`ots.<n>`) are unchanged.
 */
export function OneTouchPicker({
  applied = 0,
  count = 4,
  numbers = 4,
  label = 'One Touch',
  orientation = 'horizontal',
  cells = false,
  hue = 'neutral',
  name,
  onApply,
  tipAction,
}: OneTouchPickerProps) {
  const list = Array.from({ length: Math.max(0, numbers) }, (_, i) => i + 1);
  const spoken =
    name ??
    `One Touch Setting (OTS): ${applied ? `${applied} applied` : 'none applied'}. ` +
      'Click to apply; on the Launchkey, Shift + pads 9 to 12';

  const buttons = list.map((n) => {
    const on = n === applied;
    const disabled = n > count;
    const face = cells ? (disabled ? 'disabled' : on ? 'on' : 'off') : on ? 'chosen' : 'off';
    return (
      <NumberButton
        key={n}
        className={`yh-onetouchpicker__number${cells ? ' yh-onetouchpicker__cell' : ''}`}
        data-part="number"
        data-material="key"
        disabled={disabled}
        aria-pressed={on}
        aria-label={on ? `One Touch ${n}, applied (Shift + pad ${n + 8})` : `Apply One Touch ${n} (Shift + pad ${n + 8})`}
        data-face={face}
        data-ink={cells ? hue : undefined}
        tip={`ots.${n}`}
        tipAction={tipAction}
        onClick={() => onApply?.(n)}
      >
        {n}
      </NumberButton>
    );
  });

  if (cells) {
    return (
      <>
        <Text role="caption" case="label" className="yh-onetouchpicker__label yh-onetouchpicker__cell" data-part="label">{label}</Text>
        {buttons}
      </>
    );
  }

  return (
    <div className="yh-onetouchpicker" data-part="root" data-orientation={orientation} role="group" aria-label={spoken}>
      <Text role="caption" case="label" className="yh-onetouchpicker__label" data-part="label" aria-hidden="true">
        {label}
      </Text>
      <span className="yh-onetouchpicker__strip" data-part="strip">{buttons}</span>
    </div>
  );
}
