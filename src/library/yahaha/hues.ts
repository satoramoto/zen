// What colour means across the Yahaha redesigns. The contract's four categorical hues
// belong to the four keyboard parts, everywhere: a fader, a keyboard zone, a sound name
// and a knob that belongs to Right 2 all wear the same hue. Nothing else takes a hue.
//
// Song sections (intro, main, fill, break, ending) are not hues: what is playing is
// `--selected`, what is queued next is `--accent`, the rest is neutral text. A section
// tells itself apart by its name and its place in the song, not by colour.

export type Part = 'r1' | 'r2' | 'r3' | 'l';

export const PARTS: readonly Part[] = ['r1', 'r2', 'r3', 'l'];

/** The CSS variable a part wears. */
export const PART_HUE: Record<Part, string> = {
  r1: 'var(--hue-1)',
  r2: 'var(--hue-2)',
  r3: 'var(--hue-3)',
  l: 'var(--hue-4)',
};

/** A part's hue index, for `data-hue` attributes that CSS maps to `--hue-n`. */
export const PART_HUE_INDEX: Record<Part, 1 | 2 | 3 | 4> = { r1: 1, r2: 2, r3: 3, l: 4 };

/** Where a song section stands; each maps to one contract role, never a hue. */
export type SectionState = 'playing' | 'next' | 'idle' | 'absent';

export const SECTION_STATE_COLOUR: Record<SectionState, string> = {
  playing: 'var(--selected)',
  next: 'var(--accent)',
  idle: 'var(--text-2)',
  absent: 'var(--text-4)',
};
