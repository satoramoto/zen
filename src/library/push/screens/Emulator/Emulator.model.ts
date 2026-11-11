// The Emulator's model: the device over a Set it keeps, with a stand-in host answering what the
// device asks, a legend of the gestures and an inspector of what was asked. No framework:
// `Emulator.tsx` and `Emulator.svelte` both hold the Set and the log as view state and pass
// `emulatorView` and `emulatorHandlers` to their `Tree`.
//
// It is the Push area's sample screen and the harness of every scenario story: a play acts on
// the surface, and reads the lamps, the display and the inspector.
import { textNode } from '../../../primitives/Text/Text.model';
import { component, h, wire, type Handlers, type Node } from '../../../foundation/view/Tree.model';
import type { ViewState } from '../../../foundation/view/viewState';
import { applyIntent } from '../../model/host';
import type { Region } from '../../model/layout';
import type { PushFrame, PushInput, PushIntent, PushSet, PushState, Screen } from '../../model/types';

export interface EmulatorModelProps {
  /** The Set the emulator starts with. Read once: after that the stand-in host keeps it. */
  set: PushSet;
  /** The state the device starts in. */
  initialState?: PushState;
  /** Whether the stand-in host answers intents. Off, every intent is refused: the Set never changes. Default true. */
  host?: boolean;
  /** One region of the unit alone. */
  region?: Region;
  /** Draw one part alone, with no device behind it: the display showing `screen`, or the rear panel. Default: the device. */
  part?: 'device' | 'display' | 'rear';
  /** With `part: 'display'`: what the display shows. */
  screen?: Screen;
  /** Show the gesture legend and the inspector beside the device. Default true. */
  panels?: boolean;
  /** The display keeps a dark ground whatever the mode. Default true. */
  darkDisplay?: boolean;
  /** The app's fast values. Default: none, so every meter reads as not measured. */
  frame?: () => PushFrame | undefined;
  onIntent?: (intent: PushIntent) => void;
  onInput?: (input: PushInput) => void;
  onState?: (state: PushState) => void;
}

/** What the emulator keeps: the Set as the stand-in host has left it, and what was asked. */
export interface EmulatorState {
  set: PushSet;
  log: PushIntent[];
  device?: PushState;
  /** The device has been taken off the page. */
  gone?: boolean;
}

/** How each thing a person can do on the unit is done with a mouse and keys. */
export const GESTURES: readonly (readonly [string, string])[] = [
  ['Press', 'Click, or Space or Enter on the focused control'],
  ['Hold several', 'Right-click a control, or press L on it, to latch it down; again to let go; Escape lets all go'],
  ['Hard press', 'Alt-click a pad'],
  ['Pressure', 'The wheel while a pad is held with the mouse; a pen or touch gives its own'],
  ['Slide', 'Where on the pad it is clicked, then drag up or down'],
  ['Bend', 'Drag sideways from a held pad, on to its neighbours'],
  ['Turn', 'Drag up on a knob, the wheel, or the arrow keys'],
  ['Touch a knob', 'Press and hold it without moving, or latch it'],
  ['Nudge the jog wheel', 'The arrows at its sides'],
  ['Play from the keys', 'Focus a pad, then the rows 1 to 8, Q to I, A to K and Z to comma'],
  ['Move between pads', 'The arrow keys'],
  ['The pedals', 'Not on the face: a page reports one as a pushinput event on the surface (docs/push.md)'],
];

const KEEP = 40;

/** The tree Emulator draws: the device, and beside it the legend and the inspector. */
export function emulatorView(props: EmulatorModelProps, own: EmulatorState): Node {
  const { panels = true } = props;
  const shown = own.log.slice(-12).reverse();
  return wire(
    h(
      'div',
      { class: 'push-emulator', 'data-panels': panels ? 'true' : undefined },
      h(
        'div',
        { class: 'push-emulator__device' },
        own.gone
          ? null
          : props.part === 'display'
          ? component('PushDisplay', { screen: props.screen, dark: props.darkDisplay, light: own.set.unit.displayLight }, { on: { onInput: 'input', frame: 'frame' } })
          : props.part === 'rear'
            ? component('PushRearPanel', { jacks: own.set.unit.jacks }, { on: { onInput: 'input' } })
            : component('PushDevice', { set: own.set, initialState: props.initialState, region: props.region, darkDisplay: props.darkDisplay }, { on: { onIntent: 'intent', onInput: 'input', onState: 'state', frame: 'frame' } }),
      ),
      panels
        ? h(
            'aside',
            { class: 'push-emulator__panels' },
            h(
              'section',
              { class: 'push-emulator__panel', 'aria-label': 'What the device asked' },
              textNode({ role: 'label', weight: 'strong', as: 'h2' }, {}, 'Asked of the app'),
              own.log.length === 0 ? textNode({ role: 'caption', tone: 'muted', as: 'p' }, { 'data-part': 'nothing' }, 'Nothing yet.') : null,
              h(
                'ol',
                { class: 'push-emulator__log', 'data-part': 'log' },
                ...shown.map((intent) => {
                  const { kind, action, ...detail } = intent;
                  const words = Object.keys(detail).length ? JSON.stringify(detail) : '';
                  return h('li', { 'data-intent': action, 'data-kind': kind }, textNode({ role: 'caption', weight: 'strong' }, {}, action), textNode({ role: 'caption', tone: 'muted' }, {}, ` ${kind}${words ? ` ${words}` : ''}`));
                }),
              ),
            ),
            h(
              'section',
              { class: 'push-emulator__panel', 'aria-label': 'The device' },
              textNode({ role: 'label', weight: 'strong', as: 'h2' }, {}, 'The device'),
              textNode({ role: 'caption', tone: 'muted', as: 'p' }, { 'data-part': 'modes' }, `Display: ${own.device?.display ?? 'device'}. Pads: ${own.device?.pads ?? 'note'}.${own.device?.user ? ' User Mode.' : ''}`),
            ),
            h(
              'section',
              { class: 'push-emulator__panel', 'aria-label': 'Gestures' },
              textNode({ role: 'label', weight: 'strong', as: 'h2' }, {}, 'With a mouse and keys'),
              h('dl', { class: 'push-emulator__legend' }, ...GESTURES.flatMap(([what, how]) => [textNode({ role: 'caption', weight: 'strong', as: 'dt' }, {}, what), textNode({ role: 'caption', tone: 'muted', as: 'dd' }, {}, how)])),
            ),
          )
        : null,
    ),
    { bind: [['pushEmulatorHandle', { getSet: 'getSet', change: 'change', intents: 'intents', remove: 'remove' }]] },
  );
}

/** The callbacks the tree names. The stand-in host answers each intent by giving the device a new Set. */
export function emulatorHandlers(props: EmulatorModelProps, own: ViewState<EmulatorState>): Handlers {
  const keep = (next: Partial<EmulatorState>) => own.set({ ...own.get(), ...next });
  return {
    intent: (intent: PushIntent) => {
      const now = own.get();
      keep({ log: [...now.log, intent].slice(-KEEP), set: props.host === false ? now.set : applyIntent(now.set, intent) });
      props.onIntent?.(intent);
    },
    input: props.onInput,
    // A script on the page may set `pushFrame` on the window to feed the meters.
    frame: () => props.frame?.() ?? (globalThis as { pushFrame?: PushFrame }).pushFrame,
    state: (state: PushState) => {
      keep({ device: state });
      props.onState?.(state);
    },
    getSet: () => own.get().set,
    change: (change: (set: PushSet) => void) => {
      const next = JSON.parse(JSON.stringify(own.get().set)) as PushSet;
      change(next);
      keep({ set: next });
    },
    intents: () => own.get().log,
    remove: () => keep({ gone: true }),
  };
}
