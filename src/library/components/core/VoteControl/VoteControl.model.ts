// VoteControl's model: its props, the tree it draws (the choices as a radio group, each showing its
// label and meaning, the error line, and the tally of who chose what) and the handlers that tree
// names. No framework: `VoteControl.tsx` (React) and `VoteControl.svelte` (Svelte) both pass
// `voteControlView` and `voteControlHandlers` to their `Tree`, with the control's own state (the
// pick being saved, the last error) as their view state (`view/viewState.ts`).
import { textNode } from '../../../primitives/Text.model';
import { each, h, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { ViewState } from '../../../view/viewState';

/** One option: its value, its short label, and what picking it means (always shown). */
export interface VoteChoice {
  value: string;
  label: string;
  meaning: string;
}

/** One name in the tally: its choice (`null`: none yet), and `gone` when it has left the group. */
export interface Voter {
  name: string;
  value: string | null;
  gone?: boolean;
}

export interface VoteControlModelProps {
  /** The options, in order. The app passes the words. */
  choices: readonly VoteChoice[];
  /** The viewer's current choice; `null` before the first. */
  value: string | null;
  /** Saves a new choice. A thrown error or rejected promise shows its message (else `That did not
   *  save.`) and the control goes back to `value`; while a returned promise is pending the choices
   *  are disabled. */
  onChange: (value: string) => Promise<void> | void;
  /** Every name with its choice, in the order shown. */
  voters: readonly Voter[];
  /** The group's accessible name. Default `Vote`. */
  label?: string;
  /** A change is pending elsewhere: the choices are disabled. */
  busy?: boolean;
  /** Controlled error text, shown over the control's own. */
  error?: string;
  /** What the tally says for a name with no choice. Default `no vote yet`. */
  noVoteLabel?: string;
  /** What the tally says for a name no longer in the group. Default `no longer here`. */
  goneLabel?: string;
  className?: string;
}

/** The control's own state, kept by the binding as view state. */
export interface VoteControlState {
  /** Ids for the choices' parts, unique per mounted control. */
  id: string;
  /** The choice being saved, shown while `onChange`'s promise is pending. */
  pending?: string;
  /** The last failed save's message, cleared by the next pick. */
  error?: string;
}

/** The error shown when `onChange` fails without a message of its own. */
export const VOTE_DEFAULT_ERROR = 'That did not save.';

let controls = 0;

/** A fresh state for a newly mounted control. */
export function voteControlState(): VoteControlState {
  controls += 1;
  return { id: `lib-vote-${controls}` };
}

/** What a failed `onChange` says: an error's message, a thrown string, or the default. */
export function voteErrorText(reason: unknown): string {
  if (reason instanceof Error && reason.message.trim() !== '') return reason.message;
  if (typeof reason === 'string' && reason.trim() !== '') return reason;
  return VOTE_DEFAULT_ERROR;
}

/** The choice shown as picked: the one being saved, else `value`. */
function shownValue(value: string | null, state: VoteControlState): string | null {
  return state.pending ?? value;
}

/**
 * The tree VoteControl draws: the root (`aria-busy` while saving); the choices, a `radiogroup`
 * holding a `radio` button per choice with its label (strong) over its meaning (secondary), only
 * the picked one (else the first) on the Tab sequence; the error line (`aria-live="polite"`,
 * always present so a new error is announced); and the tally, a list of each name and what it chose.
 */
export function voteControlView(
  {
    choices,
    value,
    voters,
    label = 'Vote',
    busy = false,
    error,
    noVoteLabel = 'no vote yet',
    goneLabel = 'no longer here',
    className,
  }: VoteControlModelProps,
  state: VoteControlState,
): Node {
  const { id } = state;
  const shown = shownValue(value, state);
  const waiting = busy || state.pending !== undefined;
  const errorText = error ?? state.error;
  const errorId = `${id}-error`;
  const focusAt = Math.max(
    0,
    choices.findIndex((choice) => choice.value === shown),
  );
  const labelOf = (choice: string | null) => choices.find((c) => c.value === choice)?.label;
  return h(
    'div',
    {
      class: `lib-vote${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'aria-busy': waiting ? 'true' : undefined,
    },
    wire(
      h(
        'div',
        {
          class: 'lib-vote__choices',
          'data-part': 'choices',
          role: 'radiogroup',
          'aria-label': label,
          'aria-disabled': waiting ? 'true' : undefined,
          'aria-describedby': errorId,
        },
        each(
          choices,
          (choice) => choice.value,
          (choice, at) =>
            wire(
              h(
                'button',
                {
                  class: 'lib-vote__choice',
                  'data-part': 'choice',
                  type: 'button',
                  role: 'radio',
                  'aria-checked': String(choice.value === shown),
                  'aria-disabled': waiting ? 'true' : undefined,
                  'aria-labelledby': `${id}-label-${at}`,
                  'aria-describedby': `${id}-meaning-${at}`,
                  tabindex: at === focusAt ? '0' : '-1',
                  'data-value': choice.value,
                },
                textNode(
                  { as: 'span', role: 'body', weight: 'strong', className: 'lib-vote__label' },
                  { id: `${id}-label-${at}`, 'data-part': 'label' },
                  choice.label,
                ),
                textNode(
                  { as: 'span', role: 'body', size: 'caption', tone: 'secondary', className: 'lib-vote__meaning' },
                  { id: `${id}-meaning-${at}`, 'data-part': 'meaning' },
                  choice.meaning,
                ),
              ),
              { on: { click: 'pick' } },
            ),
        ),
      ),
      { on: { keydown: 'keys' } },
    ),
    textNode(
      { as: 'p', role: 'body', size: 'caption', tone: 'danger', className: 'lib-vote__error' },
      { id: errorId, 'aria-live': 'polite', 'data-part': 'error' },
      errorText ?? '',
    ),
    h(
      'ul',
      { class: 'lib-vote__tally', 'data-part': 'tally' },
      each(
        voters,
        (voter, at) => `${voter.name}-${at}`,
        (voter) => {
          // A name that left keeps its choice on show, with the gone mark after it.
          const choice = labelOf(voter.value) ?? noVoteLabel;
          const said = voter.gone ? `${choice} (${goneLabel})` : choice;
          const kind = voter.gone ? 'gone' : voter.value !== null && labelOf(voter.value) !== undefined ? 'voted' : 'none';
          return h(
            'li',
            { class: 'lib-vote__voter', 'data-part': 'voter', 'data-state': kind },
            textNode({ as: 'span', role: 'body', weight: 'strong', className: 'lib-vote__name' }, { 'data-part': 'name' }, voter.name),
            textNode(
              { as: 'span', role: 'body', tone: kind === 'voted' ? 'primary' : 'muted', className: 'lib-vote__said' },
              { 'data-part': 'said' },
              said,
            ),
          );
        },
      ),
    ),
  );
}

/** The keys that move focus along the choices, and where each goes from `at` of `count`. */
function moveFocus(key: string, at: number, count: number): number | undefined {
  if (key === 'ArrowRight' || key === 'ArrowDown') return (at + 1) % count;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (at - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return undefined;
}

/**
 * The handlers VoteControl's tree names: `keys` (on the radiogroup) moves focus along the choices
 * with the arrows (wrapping) and Home / End, without picking; `pick` (a click, or Space / Enter on
 * the focused choice) ignores the current choice and any pick while busy, else shows the new choice
 * at once and calls `onChange`, keeping a failure's message as the error and going back to `value`.
 * `state` is the binding's view state, read afresh after the await.
 */
export function voteControlHandlers(props: VoteControlModelProps, state: ViewState<VoteControlState>): Handlers {
  return {
    keys: (event: KeyboardEvent) => {
      const group = event.currentTarget as HTMLElement;
      const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
      const at = radios.findIndex((radio) => radio === event.target || radio.contains(event.target as globalThis.Node));
      if (at < 0) return;
      const to = moveFocus(event.key, at, radios.length);
      if (to === undefined) return;
      event.preventDefault();
      event.stopPropagation();
      radios[to].focus();
    },
    pick: async (event: Event) => {
      const next = (event.currentTarget as HTMLElement).getAttribute('data-value');
      const now = state.get();
      if (next === null || props.busy || now.pending !== undefined) return;
      if (next === shownValue(props.value, now)) return;
      state.set({ ...now, pending: next, error: undefined });
      try {
        await props.onChange(next);
        state.set({ ...state.get(), pending: undefined });
      } catch (reason) {
        state.set({ ...state.get(), pending: undefined, error: voteErrorText(reason) });
      }
    },
  };
}
