// DicePad's model: the Follow wireframe's happy accidents — MUTATE, SHAKE, ROTATE, RATIO ↑, KEEP,
// REVERT, the scale lock and the one CHAOS macro — aimed at the selected track, and the tree both
// renderers draw from them. No framework: `DicePad.tsx` and `DicePad.svelte` both pass
// `dicePadView` and `dicePadHandlers` to their `Tree`. The pad rolls nothing: a press asks
// `onDice(move)`, the lock `onScaleLock`, the macro `onChaos`. What a move does to a generator,
// its seed and its undo are the host's; a move the host can't make is left out of `moves`.
import { component, each, h, when, type Handlers, type Node } from '../../../view/Tree.model';
import type { Param } from '../../param/param';
import { liveHead, livePane, liveReading } from '../live.model';
import type { DicePadForm } from './DicePad.forms';

/** The moves, in the wireframe's order. SHAKE moves every generator; the rest the target's. */
export const DICE_MOVES = ['mutate', 'shake', 'rotate', 'ratio', 'keep', 'revert'] as const;
export type DiceMove = (typeof DICE_MOVES)[number];

/** Each move's word and the wireframe's caption for it. */
export const DICE_WORDS: Record<DiceMove, { word: string; hint: string }> = {
  mutate: { word: 'MUTATE', hint: 'nudge one gen' },
  shake: { word: 'SHAKE', hint: 'all gens, small' },
  rotate: { word: 'ROTATE', hint: 'shift patterns 1 step' },
  ratio: { word: 'RATIO ↑', hint: '3:4 → 5:4 → 7:8' },
  keep: { word: 'KEEP ✓', hint: 'snapshot → scene slot' },
  revert: { word: 'REVERT ↩', hint: 'walk the seed back' },
};

/** The moves the ONE board's dice row carries. */
export const DICE_ROW: readonly DiceMove[] = ['mutate', 'keep', 'revert', 'shake'];

/** What the scale lock forces a generator to. */
export const SCALE_LOCKS = ['chord', 'scale', 'off'] as const;
export type ScaleLock = (typeof SCALE_LOCKS)[number];

export interface DicePadProps {
  /** The selected track the moves aim at: `'Keys'`. Left out, only SHAKE (every generator) can ask. */
  target?: string;
  /** The moves the host can make. Default: all six. One left out is drawn disabled. */
  moves?: readonly DiceMove[];
  /** A move was pressed. Without it the pad is read-only. */
  onDice?: (move: DiceMove) => void;
  scaleLock?: ScaleLock;
  /** The lock was switched. Without it the lock is read-only (and in `row`, not drawn). */
  onScaleLock?: (lock: ScaleLock) => void;
  /** The CHAOS macro, 0 (deterministic) to 1 (drunk). */
  chaos?: number;
  /** The macro was turned. Without it the macro is a reading. */
  onChaos?: (chaos: number) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: DicePadForm;
  className?: string;
}

const CHAOS: Param = { kind: 'float', min: 0, max: 1, defaultValue: 0, unit: 'percent', name: 'Chaos' };
const LOCK_WORDS: Record<ScaleLock, string> = { chord: 'Chord', scale: 'Scale', off: 'Off' };

/** Whether a move can ask now: offered, a callback to ask, and a target unless it's SHAKE. */
export const canRoll = ({ target, moves = DICE_MOVES, onDice }: DicePadProps, move: DiceMove): boolean =>
  onDice !== undefined && moves.includes(move) && (move === 'shake' || target !== undefined);

function die(move: DiceMove, props: DicePadProps, full: boolean): Node {
  const { word, hint } = DICE_WORDS[move];
  const live = canRoll(props, move);
  const target = move === 'shake' ? 'every generator' : props.target;
  return h(
    'div',
    { class: 'live-dice-die', 'data-part': 'die', 'data-move': move },
    component('MusicButton', { label: `${word.replace(/ [↑✓↩]$/, '')}${target ? `, ${target}` : ''}`, title: hint, disabled: !live, className: 'live-dice-button' }, { on: { onPress: `dice:${move}` }, slots: { children: [word] } }),
    when(full, () => h('span', { class: 'live-dice-hint', 'aria-hidden': 'true' }, hint)),
  );
}

/**
 * The tree DicePad draws. `full`: the head (the target), the six moves in a grid of two columns,
 * each its word over the wireframe's caption, then the scale lock and the CHAOS macro. `row`: the
 * ONE board's dice row, MUTATE · KEEP · REVERT · SHAKE and the macro in one line. `form` is the
 * binding's (`useForm` / `getForm`).
 */
export function dicePadView(props: DicePadProps, form: DicePadForm): Node {
  const { target, scaleLock = 'chord', onScaleLock, chaos = 0, onChaos, onDice, className } = props;
  const full = form === 'full';
  const value = Number.isFinite(chaos) ? Math.min(1, Math.max(0, chaos)) : 0;
  const macro = onChaos
    ? component('MusicSlider', { name: 'Chaos', label: 'Chaos', param: CHAOS, value, orientation: 'horizontal', length: full ? 160 : 96, showValue: false }, { on: { onChange: 'chaos' } })
    : h('span', { class: 'live-axis' }, 'Chaos');
  return livePane(
    'dice',
    { class: className, 'data-form': form, 'data-inert': onDice === undefined ? 'true' : undefined, role: 'group', 'aria-label': `Dice${target ? ` → ${target}` : ''}` },
    when(full, () => liveHead({ title: 'Dice', sub: target ? `→ ${target}` : 'no track selected', aside: onDice === undefined ? 'read-only' : undefined })),
    when(!full, () => liveReading(target ? `→ ${target}` : 'no track', { 'data-part': 'target' })),
    h('div', { class: 'live-dice-moves', 'data-part': 'moves' }, ...each(full ? DICE_MOVES : DICE_ROW, (m) => m, (m) => die(m, props, full))),
    when(full && onScaleLock !== undefined, () =>
      h(
        'div',
        { class: 'live-dice-lock', 'data-part': 'lock' },
        component('MusicSegmented', { name: 'Scale lock', items: SCALE_LOCKS.map((l) => LOCK_WORDS[l]), index: SCALE_LOCKS.indexOf(scaleLock) }, { on: { onChange: 'lock' } }),
      ),
    ),
    when(full && onScaleLock === undefined, () => liveReading(`lock: ${LOCK_WORDS[scaleLock].toLowerCase()}`, { 'data-part': 'lock' })),
    h('div', { class: 'live-dice-chaos', 'data-part': 'chaos' }, macro, liveReading(value.toFixed(2), { 'data-part': 'chaos-reading' })),
  );
}

/** The callbacks the tree names: one per move (`dice:<move>`, only while it can ask), the lock and the macro. */
export function dicePadHandlers(props: DicePadProps): Handlers {
  const handlers: Handlers = {};
  for (const move of DICE_MOVES) handlers[`dice:${move}`] = () => {
    if (canRoll(props, move)) props.onDice?.(move);
  };
  handlers.lock = (index: number) => {
    const lock = SCALE_LOCKS[index];
    if (lock) props.onScaleLock?.(lock);
  };
  handlers.chaos = (next: number) => props.onChaos?.(Math.min(1, Math.max(0, next)));
  return handlers;
}
