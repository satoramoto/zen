import { useEffect, useState } from 'react';
import { Text } from '../../../primitives/Text';
import { partMarksView, type PartMarksModelProps } from './PartMarks.model';
import './PartMarks.css';

// The props and what they draw are framework-free, in the model; `PartMarks.svelte` renders the same view.
export type { PartMarksModelProps, TipAction } from './PartMarks.model';

export type PartMarksProps = PartMarksModelProps;

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
export function PartMarks(props: PartMarksProps) {
  const { tip, tipAction } = props;
  const view = partMarksView(props);
  const [node, setNode] = useState<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [node, tip, tipAction]);
  if (view === null) return null;
  return (
    <Text ref={setNode} size="caption" weight="strong" leading="tight" className={view.root.className} {...view.root.attrs}>
      {view.marks.map((m) => {
        if (m.kind === 'dot') return <span key={m.mark} className={m.className} {...m.attrs} />;
        if (m.kind === 'icon')
          return (
            <svg key={m.mark} className={m.className} {...m.attrs}>
              {m.paths.map((d) => (
                <path key={d} d={d} />
              ))}
              {m.dot && <circle {...m.dot} />}
            </svg>
          );
        return (
          <Text key={m.mark} size="inherit" leading="tight" case="label" className={m.className} {...m.attrs}>
            {m.word}
          </Text>
        );
      })}
    </Text>
  );
}
