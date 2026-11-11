// A device that runs itself: it holds the state, gives each input to `step`, hands the intents to
// whoever listens, and gives itself a `tick` when a hold matures or a notice ends. Framework-free
// (a subscribe and a get, as a view state is), so React, Svelte, a script or a worker can hold
// one. The Set stays the app's: `setSet` is how the app gives a new one.
import { project } from './project';
import { initialState } from './state';
import { nextTick, step, tick } from './step';
import type { Projection, PushInput, PushIntent, PushSet, PushState } from './types';

export interface DeviceSnapshot extends Projection {
  state: PushState;
  set: PushSet;
}

export interface DeviceOptions {
  set: PushSet;
  state?: PushState;
  /** Called with each intent the device asks, in order. */
  onIntent?: (intent: PushIntent) => void;
  /** Called with the new state after every input that changed it. */
  onState?: (state: PushState) => void;
  /** The clock inputs' times are on. Default: `performance.now`. */
  now?: () => number;
}

export interface PushDevice {
  /** The state, the Set and their projection, now. The same object until something changes. */
  get(): DeviceSnapshot;
  /** Calls `run` now and on every change (Svelte's store contract; React's ignores the argument). */
  subscribe(run: (snapshot: DeviceSnapshot) => void): () => void;
  /** One thing a person did. */
  input(input: PushInput): void;
  /** The app gives a new Set. */
  setSet(set: PushSet): void;
  /** Replace the state (a saved one, or another device's). */
  setState(state: PushState): void;
  /**
   * What the app holds now: its Set and its listeners, read at the next input or tick. Unlike
   * `setSet` it tells no subscriber, so a view that draws from its own props may call it while
   * it renders.
   */
  use(set: PushSet, listeners: Pick<DeviceOptions, 'onIntent' | 'onState'>): void;
  /** Stops its timer. */
  destroy(): void;
}

export function createDevice(options: DeviceOptions): PushDevice {
  let { onIntent, onState } = options;
  const now = options.now ?? (() => (typeof performance === 'undefined' ? Date.now() : performance.now()));
  let set = options.set;
  let state = options.state ?? initialState();
  let snapshot: DeviceSnapshot = { state, set, ...project(state, set) };
  const runs = new Set<(snapshot: DeviceSnapshot) => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dead = false;

  function publish() {
    snapshot = { state, set, ...project(state, set) };
    for (const run of [...runs]) run(snapshot);
  }

  function schedule() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    const due = nextTick(state);
    if (due === undefined || dead) return;
    timer = setTimeout(() => {
      timer = undefined;
      // The timer may fire a moment early: the tick carries the time that was due.
      apply(tick(Math.max(due, now())));
    }, Math.max(0, due - now()));
  }

  function apply(input: PushInput) {
    const result = step(state, set, input);
    const changed = result.state !== state;
    state = result.state;
    if (changed) {
      publish();
      onState?.(state);
    }
    for (const intent of result.intents) onIntent?.(intent);
    schedule();
  }

  return {
    get: () => snapshot,
    subscribe(run) {
      runs.add(run);
      run(snapshot);
      return () => {
        runs.delete(run);
      };
    },
    input: apply,
    setSet(next) {
      if (next === set) return;
      set = next;
      publish();
    },
    setState(next) {
      if (next === state) return;
      state = next;
      publish();
      schedule();
    },
    use(next, listeners) {
      set = next;
      onIntent = listeners.onIntent;
      onState = listeners.onState;
    },
    destroy() {
      dead = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      runs.clear();
    },
  };
}
