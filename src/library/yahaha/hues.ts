// What colour means across the Yahaha redesigns. The contract's four categorical hues
// belong to the four keyboard parts, everywhere: a fader, a keyboard zone, a sound name
// and a knob that belongs to Right 2 all wear the same hue. Nothing else takes a hue.
//
// Song sections (intro, main, fill, break, ending) are not hues: what is playing is
// `--selected`, what is queued next is `--accent`, the rest is neutral text. A section
// tells itself apart by its name and its place in the song, not by colour.
//
// Two role hues sit beside the parts, and neither is categorical: each names exactly one
// thing. `--style` is the current style and what belongs to it (its name, its One Touch
// numbers, a queued style, the Style fader group). `--transport` is the controls that move
// time (Start / Stop, sync, fills, Tap, tempo up and down, the metronome, their pad twins).
// Neither stands for a part, a section or a state; neither indexes a list or appears in the
// hue legend; a part's control never wears one. Solid fills of them take `--style-text` and
// `--transport-text`. Start / Stop while running is still `--success`: running is a state,
// not the transport's identity.
//
// So every meaning-bearing colour is distinct: the four part hues, success, warning, danger,
// `--style`, `--transport`, `--accent` (next) and `--selected` (playing). The contract test
// holds every pair at least 0.12 apart in OKLab, in every palette, with no exemptions. When
// a source's own colours collided (Push's orange warning was Right 3's hue, Elektron's amber
// was both the accent and Left, Linear's indigo and green were both a role and a part), the
// newer role hue, the state or an approximated part hue moved; a brand accent moved only in
// Push light, where Right 1's blue left no room. `themes/palettes.ts` notes each move.

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

/** The two role hues: one job each, never categorical. */
export const STYLE_HUE = 'var(--style)';
export const TRANSPORT_HUE = 'var(--transport)';

/** Where a song section stands; each maps to one contract role, never a hue. */
export type SectionState = 'playing' | 'next' | 'idle' | 'absent';

export const SECTION_STATE_COLOUR: Record<SectionState, string> = {
  playing: 'var(--selected)',
  next: 'var(--accent)',
  idle: 'var(--text-2)',
  absent: 'var(--text-4)',
};
