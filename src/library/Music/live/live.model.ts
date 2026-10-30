// The live panes' shared vocabulary: the stem inks a track can wear and the pieces every pane draws
// the same way (its root, its head row, its axis captions), so a looper page reads as mix[flow]'s
// own face. Framework-free: every pane's model builds its tree from these.
import { h, styleText, type ChildArg, type Node } from '../../view/Tree.model';

/** The six stem inks mix[flow] colours sources with (`--stem-<ink>`, `--stem-<ink>-label`). */
export const STEM_INKS = ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'] as const;
export type StemInk = (typeof STEM_INKS)[number];

/** A track as every pane names it: an id, a name and the stem ink it wears. */
export interface LiveTrackRef {
  id: string;
  name: string;
  ink: StemInk;
}

/** The custom properties a node wearing `ink` sets: `--stem-ink` and `--stem-label`, as the mixer's cells do. */
export function inkVars(ink: StemInk | undefined): Record<string, string | undefined> {
  return ink === undefined ? {} : { '--stem-ink': `var(--stem-${ink})`, '--stem-label': `var(--stem-${ink}-label)` };
}

/** `inkVars` plus any other properties, as an inline style string. */
export const inkStyle = (ink: StemInk | undefined, extra: Record<string, string | undefined> = {}): string | undefined => styleText({ ...inkVars(ink), ...extra });

/**
 * A pane's root: its own `.zen-music` vocabulary boundary (as `MixerView`'s), the shared
 * `live-pane` face and the pane's own class, with its form as `data-form`.
 */
export function livePane(kind: string, attrs: Record<string, string | undefined>, ...children: ChildArg[]): Node {
  const { class: extra, ...rest } = attrs;
  return h('section', { class: `zen-music wdg live-pane live-${kind}${extra ? ` ${extra}` : ''}`, 'data-part': 'root', ...rest }, ...children);
}

export interface LiveHeadProps {
  /** The big ink mark at the left: a deck letter, a track's initial. */
  mark?: string;
  title: string;
  /** The caption under the title. */
  sub?: string;
  /** The mono reading at the right: `112 BPM`, `8 bars`. */
  aside?: string;
  ink?: StemInk;
}

/** A pane's head: mix[flow]'s deck title row (`play-track`) — mark, title over caption, mono reading. */
export function liveHead({ mark, title, sub, aside, ink }: LiveHeadProps, ...tools: ChildArg[]): Node {
  return h(
    'header',
    { class: 'live-head', 'data-part': 'head', style: inkStyle(ink) },
    mark === undefined ? null : h('span', { class: 'live-mark', 'aria-hidden': 'true' }, mark),
    h('div', { class: 'live-titles' }, h('h3', { class: 'live-title' }, title), sub === undefined ? null : h('p', { class: 'live-sub' }, sub)),
    aside === undefined ? null : h('span', { class: 'live-aside' }, aside),
    ...tools,
  );
}

/** A small caption over a column or a row: mix[flow]'s grid axis label. */
export const liveAxis = (text: string, extra: Record<string, string | undefined> = {}): Node => h('span', { class: 'live-axis', ...extra }, text);

/** A mono reading: numbers, times, bars. */
export const liveReading = (text: string, extra: Record<string, string | undefined> = {}): Node => h('span', { class: 'live-reading', ...extra }, text);
