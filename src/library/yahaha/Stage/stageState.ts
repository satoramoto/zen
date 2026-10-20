// The Stage's local view state: the latest placement its screen reported (the keys' width follows
// it) and the run of taps on the hero's Tap. A small readable (`subscribe`/`get`; `subscribe` calls
// the listener at once), so React reads it with `useSyncExternalStore(state.subscribe, state.get)`
// and Svelte with `fromStore(state).current`. Each binding creates one per mounted Stage; only the
// `placement` and `tap` handlers (`stageHandlers`, Stage.model.ts) write it.
import type { Placement } from '../../layout/assembly/types';
import { createTapTempo, type TapTempo } from './tapTempo';

/** What the Stage's tree reads: the last placement, once the screen has placed itself. */
export interface StageViewState {
  placement?: Placement;
}

export interface StageState {
  /** Calls `listener` now and on every change; returns the unsubscribe. */
  subscribe(listener: (state: StageViewState) => void): () => void;
  /** The current value (the same object until it changes). */
  get(): StageViewState;
  /** Keeps `placement` when it differs from the last one (by value); true when it did. */
  place(placement: Placement): boolean;
  /** The taps on the hero's Tap, timed by `stageTap`. */
  tapper: TapTempo;
}

/** A new Stage state: nothing placed yet, no taps. */
export function createStageState(): StageState {
  let state: StageViewState = {};
  let last = '';
  const listeners = new Set<(state: StageViewState) => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    get: () => state,
    place(placement) {
      // By value: a screen given a fresh room object each render reports an equal placement again.
      const text = JSON.stringify(placement);
      if (text === last) return false;
      last = text;
      state = { placement };
      for (const listener of [...listeners]) listener(state);
      return true;
    },
    tapper: createTapTempo(),
  };
}
