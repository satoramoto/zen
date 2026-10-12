import { useEffect, useState } from 'react';
import type { TipAction } from '../Pad/Pad';
import { Text } from '../../../primitives/Text';
import { visibleMarks, type Mark } from './marks';
import './PartMarks.css';

export interface PartMarksProps {
  /** The part's sound was changed since it was loaded: the dot. */
  edited?: boolean;
  /** The part's plugin isn't installed: the warning triangle. Wins over `failed`. */
  missing?: boolean;
  /** The part's plugin failed to load or crashed: the danger cross, drawn only when `missing` is false. */
  failed?: boolean;
  /** The part is off and silent: the word "off". Not drawn when `bass` is true. */
  off?: boolean;
  /** The part plays the bass line (in Yahaha, the Style's bass under Manual Bass): the word "bass". */
  bass?: boolean;
  /** The gap between marks: `cell` (the sound cell) or `strip` (the tighter fader strip name). */
  size?: 'cell' | 'strip';
  /** The tooltip key, rendered as `data-tip` on the marks while any show. */
  tip?: string;
  /** The app's tooltip action, applied with `tip` when both are set and a mark shows. */
  tipAction?: TipAction;
}

/** Which contract role each mark draws in; kept as `data-tone` so tests and parents can read it. */
const TONE: Record<Mark, string> = {
  edited: 'text',
  missing: 'warning',
  failed: 'danger',
  off: 'faint',
  bass: 'muted',
};

/**
 * PartMarks: the small marks after a part's sound name.
 *
 * **Job.** Tell a player, in one glance down the sound cells or fader names, which parts need
 * attention (a plugin missing or failed), which were edited since loading, and which are off or
 * playing the bass. The marks are facts about the part, never decoration, and sit inline after
 * the name at its own size.
 *
 * **Changed.** *Colour meaning*: the original drew "failed" in `--ending`, a section hue, so red
 * meant both "the Ending section" and "broken". Here the cross uses the contract's `--danger` and
 * the triangle `--warning`; no categorical hue appears, so the app's hue slots (`--hue-1..4`)
 * keep their one meaning (colour.md › Semantic colours: semantics are their own roles). *Affordance without
 * colour*: problems differ by shape (an outlined triangle with a bang versus a cross), so they
 * read in greyscale and to colour-blind players. *Legibility at small sizes*: every mark is sized
 * from the caption type (`1em` icons, the edited ring at 0.6em) instead of fixed 5px and 12px, so it
 * scales with each theme's type and stays optically centred on the name; strokes are 1.5px so the
 * glyphs survive a 10px caption (icons.md › one stroke weight). *Hierarchy*: "bass" (the part
 * sounds) sits in secondary text and "off" (silent) in faint text, so the silent part recedes,
 * and both are at body weight, never heavier than the name they follow. The words follow the
 * theme's label case. *One glyph, one meaning* (the 2026-10 review): "edited" is a hollow ring,
 * not a filled dot, so it can't be mistaken for a lamp's lit LED or the fader cap's grip; it
 * takes the chrome's pill radius (a square in the square chromes, round in Linear). New `tip` and `tipAction` (Pad's handle shape)
 * let the parent explain the marks on hover; the tooltip lives only while a mark shows.
 *
 * **Kept.** The facts and their precedence (⚠ wins over ✕, "bass" over "off") in `marks.ts`,
 * the drawing order, `marksText` for the parent's `aria-label`, hidden from assistive tech, and
 * rendering nothing when no mark shows.
 */
export function PartMarks({
  edited = false,
  missing = false,
  failed = false,
  off = false,
  bass = false,
  size = 'cell',
  tip,
  tipAction,
}: PartMarksProps) {
  const marks = visibleMarks({ edited, missing, failed, off, bass });
  const [node, setNode] = useState<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [node, tip, tipAction]);
  if (marks.length === 0) return null;
  return (
    <Text
      ref={setNode}
      size="caption"
      weight="strong"
      leading="tight"
      className="yh-partmarks"
      data-part="root"
      data-size={size}
      data-tip={tip}
      aria-hidden="true"
    >
      {marks.map((mark) => {
        if (mark === 'edited') return <span key={mark} className="yh-partmarks__dot" data-part="dot" data-mark={mark} data-tone={TONE[mark]} />;
        if (mark === 'missing')
          return (
            <svg key={mark} className="yh-partmarks__icon" data-part="icon" data-mark={mark} data-tone={TONE[mark]} viewBox="0 0 12 12">
              <path d="M6 1.25 11 10.25H1Z" />
              <path d="M6 4.75v2.5" />
              <circle cx="6" cy="8.6" r="0.5" />
            </svg>
          );
        if (mark === 'failed')
          return (
            <svg key={mark} className="yh-partmarks__icon" data-part="icon" data-mark={mark} data-tone={TONE[mark]} viewBox="0 0 12 12">
              <path d="M2.75 2.75 9.25 9.25M9.25 2.75 2.75 9.25" />
            </svg>
          );
        return (
          <Text
            key={mark}
            size="inherit"
            leading="tight"
            case="label"
            className="yh-partmarks__word"
            data-part="word"
            data-mark={mark}
            data-tone={TONE[mark]}
          >
            {mark}
          </Text>
        );
      })}
    </Text>
  );
}
