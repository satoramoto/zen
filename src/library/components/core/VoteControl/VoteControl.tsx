import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { voteControlHandlers, voteControlState, voteControlView, type VoteControlModelProps } from './VoteControl.model';
import '../../../primitives/Text.css';
import './VoteControl.css';

// The props, the tree and the save are framework-free, in the model; this file and
// `VoteControl.svelte` only hand its tree to their `Tree`, with the control's own state as view state.
export type { VoteChoice, Voter } from './VoteControl.model';
export type VoteControlProps = VoteControlModelProps;

/**
 * A vote among a few choices, each with its meaning in view, and who chose what.
 *
 * **Job.** Let someone in a group pick one of a few options whose consequences matter, knowing
 * what each means without hovering, and see where everyone else stands.
 *
 * **Behaviour.** A `radiogroup` of buttons (`role="radio"`), each showing its label over its
 * meaning; they sit side by side while there is room and stack when there isn't. Click, or Space /
 * Enter on the focused one, picks it; the arrows (wrapping) and Home / End move focus without
 * picking. The pick shows at once and `onChange` saves it; while its promise is pending, or while
 * `busy`, the choices are disabled (`aria-disabled`, keeping focus). A thrown error or rejected
 * promise shows its message on the error line (`aria-live="polite"`), else `That did not save.`,
 * and the control goes back to `value`; the next pick clears it. `error` shows the app's own text
 * over it. A choice can be changed, never cleared. Under the choices, the tally: each name, then
 * its choice's label, `no vote yet` (`noVoteLabel`) or, for a name that left, `no longer here`
 * (`goneLabel`).
 *
 * **Parts** (`data-part`): `root` (`aria-busy`), `choices` (the radiogroup), `choice`
 * (`aria-checked`, `data-value`), `label`, `meaning`, `error`, `tally`, `voter` (`data-state`:
 * `voted`, `none` or `gone`), `name`, `said`.
 *
 * **Tuning knobs**: none.
 */
export function VoteControl(props: VoteControlProps) {
  const [own] = useState(() => viewState(voteControlState()));
  const state = useSyncExternalStore(own.subscribe, own.get);
  return <Tree tree={voteControlView(props, state)} handlers={voteControlHandlers(props, own)} />;
}

export default VoteControl;
