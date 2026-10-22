import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { gateHandlers, gateState, gateView, type GateModelProps } from './Gate.model';
import '../../../primitives/Text.css';
import '../../../primitives/Stack.css';
import '../../../primitives/Surface.css';
import './Gate.css';

// The props, the tree and the submit are framework-free, in the model; this file and `Gate.svelte`
// only hand its tree to their `Tree`, with the gate's own state as their view state.
export type { GateModelProps } from './Gate.model';

export interface GateProps extends GateModelProps {
  /** Above the field, as the page's heading. Default none. */
  title?: ReactNode;
  /** Under the title: what the gate is and where the key comes from. Default none. */
  message?: ReactNode;
  /** Anything the app adds under the submit key (a contact line, a link). */
  children?: ReactNode;
}

/**
 * A full-screen gate: asks for one shared key before an app shows anything.
 *
 * **Job.** Keep a private app's content behind a key everyone in on it shares. The app checks the
 * key; the gate takes it, says when it's being checked, and says why it failed.
 *
 * **Behaviour.** One password field (a reveal key flips it to text and back, `Show` / `Hide`),
 * focused when the gate mounts. Enter in the field or the submit key calls `onSubmit` with the
 * trimmed key; an empty or whitespace-only key never submits. While a returned promise is pending
 * the field and both keys are disabled (`aria-busy` on the form); when it settles the field takes
 * focus again. A thrown error or a rejected promise shows its message under the field, else
 * `That key did not work.`; the next edit clears it. `error` shows the app's own text over it.
 * The error line is `aria-live="polite"` and describes the field (`aria-invalid` while shown).
 *
 * **Parts** (`data-part`): `root` (a `ground` Surface filling the screen, `data-busy`), `card`
 * (a `raised` Surface), `form`, `title`, `message`, `label`, `field` (the input chrome), `input`,
 * `error`, `extra` (the `children`).
 *
 * **Tuning knobs**: none.
 */
export function Gate({ title, message, children, ...props }: GateProps) {
  const [own] = useState(() => viewState(gateState()));
  const state = useSyncExternalStore(own.subscribe, own.get);
  const slots = { title: title != null, message: message != null, children: children != null };
  return <Tree tree={gateView(props, state, slots)} slots={{ title, message, children }} handlers={gateHandlers(props, own)} />;
}

export default Gate;
