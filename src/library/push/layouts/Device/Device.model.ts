// The Device's model: the surface driven by the device model. No framework: `Device.tsx` and
// `Device.svelte` both hold one `PushDevice` (model/device.ts) as their view state and pass
// `deviceView` and `deviceHandlers` to their `Tree`.
//
// It is given a Set and tells of intents. It draws a `Surface` with what `project` gives for its
// state and that Set, and gives every input to `step`. It holds no part of the Set: the display
// changes when the app gives a Set that has the change.
import { component, h, wire, type Handlers, type Node } from '../../../foundation/view/Tree.model';
import type { PushDevice } from '../../model/device';
import type { Region } from '../../model/layout';
import { project } from '../../model/project';
import type { PushFrame, PushInput, PushIntent, PushSet, PushState } from '../../model/types';
import type { Beat } from '../Surface/lampClock';

export interface DeviceModelProps {
  /** The app's Set. */
  set: PushSet;
  /** The state the device starts in. Default: as switched on (Device View, Note Mode). Read once. */
  initialState?: PushState;
  /** One region of the unit alone. Default: the whole unit. */
  region?: Region;
  /** The display keeps a dark ground whatever the mode. Default true. */
  darkDisplay?: boolean;
  /** The app's fast values (levels, the song position), read once a frame without the device being redrawn. */
  frame?: () => PushFrame | undefined;
  /** Called with each thing the device asks of the app, in order. */
  onIntent?: (intent: PushIntent) => void;
  /** Called with the device's state after each change, for an app that keeps it. */
  onState?: (state: PushState) => void;
  /** Called with every input a person makes, before the model has it. */
  onInput?: (input: PushInput) => void;
  className?: string;
}

/** The beat lamps follow: the Set's tempo, with a beat at the time zero of the song position. */
export function beatOf(set: PushSet, now: number): Beat | undefined {
  const { tempo, playing, beat } = set.transport;
  if (!playing || !(tempo > 0)) return undefined;
  const period = 60000 / tempo;
  return { tempo, at: now - (beat % 1) * period };
}

/** The tree Device draws: the surface, with the projection of `state` over the Set. */
export function deviceView(props: DeviceModelProps, state: PushState, now = 0): Node {
  const { set } = props;
  const { lamps, strip, screen } = project(state, set);
  // A wrapper that takes no box of its own: it is there for the store that stops the device's timer.
  return wire(
    h(
      'div',
      { class: 'push-device', 'data-display': state.display, 'data-pads': state.pads, 'data-user': state.user ? 'true' : undefined, style: 'display: contents' },
      component(
      'PushSurface',
      {
        lamps,
        strip,
        screen,
        region: props.region,
        ledBrightness: set.unit.ledBrightness,
        displayLight: set.unit.displayLight,
        darkDisplay: props.darkDisplay,
        expression: set.unit.expression,
        sensitivity: set.unit.sensitivity,
        beat: beatOf(set, now),
        className: props.className,
      },
      { on: { onInput: 'input', frame: 'frame' } },
      ),
    ),
    { bind: [['pushLifetime', { onGone: 'gone' }]] },
  );
}

/**
 * The callbacks the tree names. Building them tells the device what the app holds now (its Set
 * and listeners), which is read at the next input or tick.
 */
export function deviceHandlers(props: DeviceModelProps, device: PushDevice): Handlers {
  device.use(props.set, { onIntent: props.onIntent, onState: props.onState });
  return {
    input: (input: PushInput) => {
      props.onInput?.(input);
      device.input(input);
    },
    gone: () => device.destroy(),
    frame: props.frame,
  };
}
