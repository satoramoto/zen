import type { CSSProperties } from 'react';
import { Text } from '../../../primitives/Text';
import { sectionNameView, type SectionNameModelProps } from './SectionName.model';
import './SectionName.css';

// The props and the view are framework-free, in the model; `SectionName.svelte` renders the same view.
export type { SectionState, SectionHue, SectionNameModelProps } from './SectionName.model';

export type SectionNameProps = SectionNameModelProps;

/**
 * The playing section's name on the display ("Main B"). A readout, not a control.
 *
 * **Job**: tell a player across the room which section is playing. The name is the one thing on
 * the display read from a distance.
 *
 * **Changed**: the name sits on the display type with tight display tracking (hierarchy; see
 * `references/typography.md` on one display size per screen). *Typography, one face per word:*
 * the variation ("B", "III") stays in the display face with tabular figures; it used to switch
 * to the readout face, which on mono packs set "Main **B**" in two faces and drew "III" as three
 * ticks, and the variations are letters, not digits. *Colour meaning, said once:* the name is
 * neutral and inherits its ink; whatever holds it says where it stands (in Yahaha, the Display's
 * `--selected` block while playing, its "then" tab for next). The state colours and the playing
 * glow it used to carry were overridden by every parent, so playing and idle differed only by a
 * halo; they are gone (what plays is `--selected`, and that is the holder's job).
 * `state` and `idle` still land on `data-state` for the parent's CSS. *Sizing*: the size is one
 * custom property, `--yh-section-name-size` (default `--size-numeral`), which a parent sets on the
 * root or passes as `size`, so a display can make the name its hero without overriding this
 * widget's CSS. *Materials:* two named parts (`data-part`: name, variant); ink on whatever holds
 * it, so it reads no material of its own.
 *
 * **Kept**: one line, never wrapping; an empty name shows "—" rather than collapsing the layout;
 * the `hue` prop and `data-hue` hook; `state` / `idle` on `data-state`.
 *
 * **Tuning knobs.**
 * - `--yh-section-name-size`: the name's size (default `--size-numeral`); a parent sets it on
 *   the element, or `size` inline.
 */
export function SectionName(props: SectionNameProps) {
  const { name, style, word, variant } = sectionNameView(props);
  return (
    <Text {...name.text} className={name.className} {...name.attrs} style={style as CSSProperties | undefined}>
      {word}
      {variant && (
        <>
          {' '}
          <Text {...variant.text} className={variant.className} {...variant.attrs}>
            {variant.content}
          </Text>
        </>
      )}
    </Text>
  );
}
