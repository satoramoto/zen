// A part of a tree that may fail without taking the rest down: `component('Contain', { resetKey },
// { on: { onError: … }, slots: { children: [...], failed: [...] } })`. While `children` draws it is
// all there is; once drawing it throws, `failed` is drawn in its place and `onError` is told, until
// `resetKey` changes (the tree's own Retry bumps it) and `children` is tried again. React's error
// boundaries are classes, which a binding can't hold; this registered component is that class, once,
// for every tree. `Contain.svelte` does the same with `<svelte:boundary>`. Draws no element.
import { Component, type ReactNode } from 'react';

export interface ContainProps {
  /** A change of this tries `children` again after a failure. */
  resetKey?: string | number;
  /** What failed, in the error's words. */
  onError?: (message: string) => void;
  children?: ReactNode;
  /** Drawn in place of `children` once they fail. */
  failed?: ReactNode;
}

interface ContainState {
  failed: boolean;
  /** The `resetKey` the failure happened under. */
  under?: string | number;
}

/** What an error says, for `onError`. */
export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export class Contain extends Component<ContainProps, ContainState> {
  state: ContainState = { failed: false };

  static getDerivedStateFromError(): Partial<ContainState> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: ContainProps, state: ContainState): Partial<ContainState> | null {
    // A new key after a failure: try again. Otherwise remember the key a failure would happen under.
    if (state.failed && state.under !== props.resetKey) return { failed: false, under: props.resetKey };
    return state.under === props.resetKey ? null : { under: props.resetKey };
  }

  componentDidCatch(error: unknown): void {
    this.props.onError?.(errorMessage(error));
  }

  render(): ReactNode {
    return this.state.failed ? this.props.failed : this.props.children;
  }
}
