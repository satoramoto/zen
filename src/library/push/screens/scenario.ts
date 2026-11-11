// What a Push scenario story is made of, and how one becomes a story the Renderer toolbar can draw
// with either renderer. Each capability's `<Name>.plays.ts` holds a `Play` per scenario; its
// generated `<Name>.stories.tsx` gives each to `scenario()` with the scenario's words.
import { createElement } from 'react';
import { fn } from 'storybook/test';
import { Emulator } from './Emulator/Emulator';
import EmulatorSvelte from './Emulator/Emulator.svelte';
import type { EmulatorModelProps } from './Emulator/Emulator.model';
import { sampleSet } from '../model/sample';
import type { PushSet } from '../model/types';

/** What a play is handed: the story's canvas and its args (with the spies `scenarioStory` adds). */
export interface PlayContext {
  canvasElement: HTMLElement;
  args: EmulatorModelProps;
}

export interface Play {
  /** The emulator's props for this scenario, over the sample Set. `set` may alter the sample Set in place. */
  args?: Partial<Omit<EmulatorModelProps, 'set'>>;
  set?: (set: PushSet) => void;
  /** The When. */
  act: (context: PlayContext) => Promise<void> | void;
  /** The Then. */
  check: (context: PlayContext) => Promise<void> | void;
}

export type Plays<Name extends string = string> = Record<Name, Play>;

/** The story a play runs in: the Emulator over the sample Set as the play alters it, no panels, with spies on what it reports. */
export function scenarioStory(play: Play) {
  const set = sampleSet();
  play.set?.(set);
  const args = { set, panels: false, ...play.args, onIntent: fn(), onInput: fn(), onState: fn() };
  const { onIntent: _i, onInput: _n, onState: _s, ...data } = args;
  return {
    args,
    render: (props: EmulatorModelProps) => createElement(Emulator, props),
    parameters: { svelte: { component: EmulatorSvelte, fixture: { args: data } } },
  };
}
