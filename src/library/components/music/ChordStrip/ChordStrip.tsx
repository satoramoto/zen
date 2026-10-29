import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { CHORD_STRIP_FORMS } from './ChordStrip.forms';
import { chordStripHandlers, chordStripView, type ChordStripModelProps } from './ChordStrip.model';
// The blocks and actions are Surface keys and the words are Texts, drawn with their class and data.
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './ChordStrip.css';

export { CHORD_STRIP_FORMS, type ChordStripForm } from './ChordStrip.forms';
// The props and the tree they draw are framework-free, in the model; `ChordStrip.svelte` draws the same tree.
export type { ChordStripModelProps, ChordStripState } from './ChordStrip.model';

export type ChordStripProps = ChordStripModelProps;

/**
 * **Job.** Show where a song's chords are going, from a playing position: one block per chord
 * across the strip, the chord sounding now, the one after it, and the notes the player's hands
 * need under the active one. A press follows a chord; a small action row changes, keeps or
 * reverts the selected chord, and is absent entirely when the app passes none of the three.
 *
 * **Changed.** *Hierarchy*: the chord names carry the weight (body ink, strong on the active one);
 * the notes are a caption under *now* only, so the strip never looks like eight equal paragraphs
 * (`typography.md`, type scale). *Colour meaning*: the strip has no hue of its own — a chord is not
 * an identity — so *now* is the contract's accent (its `Ring`, a lit key and primary ink), *next* a
 * strong edge and secondary ink, the rest muted (`color.md`, 60/30/10). *Affordance*: each block is
 * a key Surface button with a focus and press Ring, so what can be followed reads as pressable;
 * the selected chord, the one the actions apply to, keeps a small accent mark and a strong edge
 * instead of borrowing *now*'s ring. *One empty-slot vocabulary*: no chords is one quiet well with
 * "No chords", not a row of blanks. *Forms*: `full → compact` (`CHORD_STRIP_FORMS`), read with
 * `useForm`, carried as `data-form`; compact drops the notes line and shortens the action words,
 * and never drops a block.
 *
 * **Kept.** Pure: it holds nothing, draws `chords`/`index`/`selected` and asks through `onFollow`,
 * `onMutate`, `onKeep`, `onRevert`. Eight blocks stay across at any width; a long name ellipsizes.
 * The spoken name of a block says its place ("Dm7, next") and its notes; the actions keep their
 * whole words for a screen reader even when the compact form shortens them.
 *
 * **Built from.** `Surface` keys for the blocks and the actions, `Text` for every word, `focusRing`
 * and `pressRing` for focus and for *now*.
 *
 * **Tuning knobs.**
 * - `--yh-chord-strip-gap`: the space between blocks (a full step, a tight one in compact).
 */
export function ChordStrip(props: ChordStripProps) {
  const form = useForm(CHORD_STRIP_FORMS);
  return <Tree tree={chordStripView(props, form)} handlers={chordStripHandlers(props)} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
ChordStrip.forms = CHORD_STRIP_FORMS;

export default ChordStrip;
