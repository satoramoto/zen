// ChordStrip's model: its props and the tree both renderers draw from them (the blocks, their
// now / next / selected states, the notes under the active chord and the action row). No framework:
// `ChordStrip.tsx` (React) and `ChordStrip.svelte` (Svelte) both pass `chordStripView` and
// `chordStripHandlers` to their `Tree`, with the form the assembled screen chose.
import { focusRing, pressRing } from '../../../primitives/Ring';
import { surfaceNode } from '../../../primitives/Surface.model';
import { textNode, textView, type TextModelProps } from '../../../primitives/Text.model';
import { each, h, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { LiveChord } from '../live.model';
import type { ChordStripForm } from './ChordStrip.forms';

/** Every ChordStrip prop (it takes no framework children). */
export interface ChordStripModelProps {
  /** The progression, left to right. Empty: one quiet "No chords" well. */
  chords: readonly LiveChord[];
  /** Where the progression is now: this chord is *now*, the one after it *next*. */
  index: number;
  /** The chord the mutation actions apply to (the app's selection), if any: a mark and a strong edge. */
  selected?: string;
  /** Read-only: every block and action is disabled, nothing calls back. */
  disabled?: boolean;
  /** A block was pressed: follow that chord. */
  onFollow?: (id: string) => void;
  /** The action row's MUTATE: change the selected chord. */
  onMutate?: () => void;
  /** The action row's KEEP: accept the change. */
  onKeep?: () => void;
  /** The action row's REVERT: undo the change. */
  onRevert?: () => void;
}

/** What a block is doing: the one at `index` is now, the one after it next, the rest idle. */
export type ChordStripState = 'now' | 'next' | 'idle';

/** A block's state from its place in the progression. */
export function chordStripState(at: number, index: number): ChordStripState {
  return at === index ? 'now' : at === index + 1 ? 'next' : 'idle';
}

/** A Text's attributes (its class and `data-*`) plus the part's own. */
function text(props: TextModelProps, extra: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs, ...extra };
}

/** The three actions, in the order a player needs them: change, accept, undo. */
const ACTIONS = [
  { key: 'mutate', label: 'Mutate', short: 'Mut', hint: 'Mutate the chord' },
  { key: 'keep', label: 'Keep', short: 'Keep', hint: 'Keep the mutated chord' },
  { key: 'revert', label: 'Revert', short: 'Rev', hint: 'Revert to the chord before' },
] as const;

/** One chord block: a key Surface button, its name, the notes while it is now, a mark while selected. */
function blockView(chord: LiveChord, at: number, index: number, selected: string | undefined, form: ChordStripForm, disabled: boolean): Node {
  const state = chordStripState(at, index);
  const now = state === 'now';
  const next = state === 'next';
  const isSelected = selected === chord.id;
  const notes = chord.notes ?? [];
  const spoken =
    `${chord.name}${now ? ', now' : next ? ', next' : ''}${isSelected ? ', selected' : ''}` + (notes.length ? `: ${notes.join(' ')}` : '');
  const block = surfaceNode(
    {
      as: 'button',
      material: 'key',
      radius: 'control',
      // Now is lit in the accent; next takes a strong edge. Both are the contract's own words for it.
      lit: now ? 'accent' : undefined,
      border: next || isSelected ? 'strong' : undefined,
      className: `yh-chord-strip__block ${focusRing} ${pressRing}`,
    },
    {
      type: 'button',
      'data-part': 'block',
      'data-state': state,
      'data-tone': state,
      'data-selected': isSelected ? 'true' : undefined,
      // The press Ring (Ring.css) draws the accent edge while this block is now.
      'data-pressed': now ? '' : undefined,
      'aria-current': now ? 'true' : undefined,
      'aria-label': spoken,
      disabled: disabled ? '' : undefined,
    },
    textNode({ role: 'body', weight: now ? 'strong' : 'body', leading: 'tight', truncate: true, className: 'yh-chord-strip__name' }, { 'data-part': 'name' }, chord.name),
    when(form === 'full' && now && notes.length > 0, () =>
      textNode({ role: 'caption', leading: 'tight', truncate: true, className: 'yh-chord-strip__notes' }, { 'data-part': 'notes' }, notes.join(' ')),
    ),
    when(isSelected, () => h('span', { class: 'yh-chord-strip__mark', 'data-part': 'mark', 'aria-hidden': 'true' })),
  );
  return wire(block, disabled ? {} : { on: { click: `follow${at}` } });
}

/** One action: a small key Surface button, its word in the caption role (short in the compact form). */
function actionView(action: (typeof ACTIONS)[number], form: ChordStripForm, disabled: boolean): Node {
  return wire(
    surfaceNode(
      { as: 'button', material: 'key', radius: 'control', className: `yh-chord-strip__action ${focusRing} ${pressRing}` },
      {
        type: 'button',
        'data-part': 'action',
        'data-action': action.key,
        'aria-label': action.hint,
        title: action.hint,
        disabled: disabled ? '' : undefined,
      },
      textNode({ role: 'caption', weight: 'strong', case: 'upper', leading: 'tight' }, { 'data-part': 'action-label' }, form === 'full' ? action.label : action.short),
    ),
    disabled ? {} : { on: { click: action.key } },
  );
}

/**
 * The tree ChordStrip draws in the chosen `form`: the root, the blocks (a button each, the active
 * one's notes under it, a mark on the selected one) and, when the app passes any mutation handler,
 * the action row. With no chords, one quiet well says so.
 */
export function chordStripView(
  { chords, index, selected, disabled = false, onMutate, onKeep, onRevert }: ChordStripModelProps,
  form: ChordStripForm,
): Node {
  const passed = { mutate: onMutate, keep: onKeep, revert: onRevert } as const;
  const actions = ACTIONS.filter((action) => passed[action.key] !== undefined);
  return h(
    'div',
    {
      class: 'yh-chord-strip',
      'data-part': 'root',
      'data-form': form,
      'data-disabled': disabled ? 'true' : undefined,
    },
    chords.length === 0
      ? surfaceNode(
          { material: 'well', radius: 'control', className: 'yh-chord-strip__empty' },
          { 'data-part': 'empty' },
          textNode({ role: 'caption', leading: 'tight', className: 'yh-chord-strip__empty-text' }, { 'data-part': 'empty-text' }, 'No chords'),
        )
      : h(
          'div',
          { class: 'yh-chord-strip__blocks', 'data-part': 'blocks', role: 'group', 'aria-label': 'Chord progression' },
          each(
            chords,
            (chord) => chord.id,
            (chord, at) => blockView(chord, at, index, selected, form, disabled),
          ),
        ),
    when(actions.length > 0, () =>
      h(
        'div',
        { class: 'yh-chord-strip__actions', 'data-part': 'actions' },
        each(
          actions,
          (action) => action.key,
          (action) => actionView(action, form, disabled),
        ),
      ),
    ),
  );
}

/** The callbacks `chordStripView`'s tree names: one follow per block, and the three actions. */
export function chordStripHandlers({ chords, disabled, onFollow, onMutate, onKeep, onRevert }: ChordStripModelProps): Handlers {
  if (disabled) return {};
  const handlers: Handlers = { mutate: onMutate, keep: onKeep, revert: onRevert };
  chords.forEach((chord, at) => {
    handlers[`follow${at}`] = () => onFollow?.(chord.id);
  });
  return handlers;
}
