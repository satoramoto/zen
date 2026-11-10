// A song section as every live pane draws it: PushTwin's row 7 and SectionBar share this one
// anatomy, so a section reads the same on the controller twin and on the bar. Framework-free.
// Playing, queued and ready are the host's to say: a pane only shows them and asks.

/** A section cell's state, as the shared launch cell (`.live-cell[data-state]`) draws it. */
export type SectionCellState = 'on' | 'queued' | 'stopped' | 'empty';

/** What a screen reader hears for each state. */
export const SECTION_WORD: Record<SectionCellState, string> = { on: 'playing', queued: 'queued', stopped: 'ready', empty: 'empty' };

/** A section's state: none (no section there), the one playing, the one queued next, or ready. */
export function sectionState(present: boolean, playing: boolean, queued: boolean): SectionCellState {
  if (!present) return 'empty';
  return playing ? 'on' : queued ? 'queued' : 'stopped';
}

/** A section cell's name for a screen reader: `Section CHORUS, queued`. */
export const sectionLabel = (name: string, state: SectionCellState): string => `Section ${name}, ${SECTION_WORD[state]}`;
