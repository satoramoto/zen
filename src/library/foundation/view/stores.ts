// The store registry: every stateful behaviour a tree can `bind`, by name. A store is framework-free
// (`bindX(node, params)` returning `update`/`destroy`); its entry here adapts it to the tree, where
// params are plain data and a callback param holds a handler's key (`keyed`). Both renderers look a
// `bind` entry up here, so there are no per-component hooks or actions.
import { musicStores } from '../../music/registry.stores';
import { bindKnob, type KnobParams } from '../../music/components/KnobReadout/knobInput';
import { bindDismiss, bindFocusReturn, type DismissParams, type FocusReturnParams } from '../../yahaha/components/AppBar/popover';
import { bindRoom, type RoomParams } from '../../layouts/Assembly/room';
import { bindDockDrag, bindSplitHandle, type DockDragParams, type SplitHandleParams } from '../../layouts/Workspace/gestures';
import { bindReport, type ReportParams } from './report';
import { bindDisplayFit, bindDisplayWide, type DisplayFitParams, type DisplayWideParams } from '../../yahaha/components/Display/fit';
import { bindPad, type PadParams } from '../../music/components/Pad/padPress';
import { bindFader, type FaderParams } from '../../music/components/Fader/faderInput';
import { bindXyInput, type XyInputParams } from '../../music/components/XYPad/xyInput';
import { bindKeysInput, type KeysBindParams } from '../../music/components/Keys/keysInput';
import { bindFillWidth, type FillWidthParams } from '../../music/components/Keys/fillWidth';
import { bindFit, type ChordFitParams } from '../../music/components/ChordReadout/fit';
import { bindBarInput, type BarBindParams } from '../../music/components/BarReadout/barInput';
import { bindTempoNumber, bindTempoStep, type TempoNumberParams, type TempoStepParams } from '../../music/components/TempoReadout/tempoGestures';
import { keyed, type Store, type Stores } from './keyed';
import { coreStores } from './coreStores';

export { keyed, type Keyed, type Store, type Stores, type StoreBinding } from './keyed';

/** Every store a tree can bind, by name. A new store is one line here. */
export const stores = {
  ...coreStores,
  ...musicStores(),
  /** Knob's drag, keys, wheel, press and tooltip (`knobInput.ts`). */
  knob: keyed<KnobParams, 'tipAction' | 'onpress' | 'onstep'>(bindKnob, ['tipAction', 'onpress', 'onstep']),
  /** MetronomePopover's Esc and press-outside close (`yahaha/AppBar/popover.ts`). */
  dismiss: keyed<DismissParams, 'onClose'>(bindDismiss, ['onClose']),
  /** AppBar's focus back to the metronome's opener when its popover closes (`yahaha/AppBar/popover.ts`). */
  focusReturn: keyed<FocusReturnParams, never>(bindFocusReturn, []),
  /** An assembled screen's measured room (`layouts/Assembly/room.ts`). */
  room: keyed<RoomParams, 'onRoom'>(bindRoom, ['onRoom']),
  /** The Workspace's split handles and region drags (`layouts/Workspace/gestures.ts`). */
  splitHandle: keyed<SplitHandleParams, 'onPreview' | 'onCommit'>(bindSplitHandle, ['onPreview', 'onCommit']),
  dockDrag: keyed<DockDragParams, 'onDrag' | 'onDock'>(bindDockDrag, ['onDrag', 'onDock']),
  /** An assembled screen's placement, reported once per change (`report.ts`). */
  report: keyed<ReportParams, 'onReport'>(bindReport, ['onReport']),
  /** Display's readouts fitting their row, again when the key changes (`yahaha/Display/fit.ts`). */
  displayFit: keyed<DisplayFitParams, never>(bindDisplayFit, []),
  /** Display's auto form: whether the hero is wide enough for `full` (`yahaha/Display/fit.ts`). */
  displayWide: keyed<DisplayWideParams, 'onWide'>(bindDisplayWide, ['onWide']),
  /** Pad's press and tooltip (`padPress.ts`). */
  padPress: keyed<PadParams, 'onPress' | 'tipAction'>(bindPad, ['onPress', 'tipAction']),
  /** Fader's drag, keys and wheel (`faderInput.ts`). */
  faderInput: keyed<FaderParams, 'onlevel'>(bindFader, ['onlevel']),
  /** XYPad's pointer drag and arrow keys (`xyInput.ts`). */
  xyInput: keyed<XyInputParams, 'onMove'>(bindXyInput, ['onMove']),
  /** Keys' split handle, pick surface and Esc (`keysInput.ts`). */
  keysInput: keyed<KeysBindParams, 'onSplit' | 'onPick'>(bindKeysInput, ['onSplit', 'onPick']),
  /** Keys' measured width (`fillWidth.ts`). */
  fillWidth: keyed<FillWidthParams, 'onWidth'>(bindFillWidth, ['onWidth']),
  /** ChordReadout's fit (`fit.ts`). */
  chordFit: keyed<ChordFitParams, 'onFit'>(bindFit, ['onFit']),
  /** BarReadout's drag, keys, hold and reset (`barInput.ts`). */
  barInput: keyed<BarBindParams, 'onChange' | 'onState'>(bindBarInput, ['onChange', 'onState']),
  /** TempoReadout's number gestures (`tempoGestures.ts`). */
  tempoNumber: keyed<TempoNumberParams, 'onTempo' | 'onReset'>(bindTempoNumber, ['onTempo', 'onReset']),
  /** TempoReadout's + / − hold reporting (`tempoGestures.ts`). */
  tempoStep: keyed<TempoStepParams, 'report'>(bindTempoStep, ['report']),
} satisfies Stores;

export type StoreName = keyof typeof stores;

/** zen's own store names: an app's may not take one. */
const own = new Set(Object.keys(stores));

/**
 * Adds an app's own stores to the registry every tree reads, in both renderers, by the names its
 * trees `bind`. A name zen already has is refused; registering an app's name again replaces it.
 */
export function registerStores(more: Stores): void {
  for (const [name, store] of Object.entries(more)) {
    if (own.has(name)) throw new Error(`view: "${name}" is zen's own store; give the app's store a name of its own`);
    (stores as Stores)[name] = store;
  }
}
