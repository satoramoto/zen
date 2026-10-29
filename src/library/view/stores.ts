// The store registry: every stateful behaviour a tree can `bind`, by name. A store is framework-free
// (`bindX(node, params)` returning `update`/`destroy`); its entry here adapts it to the tree, where
// params are plain data and a callback param holds a handler's key (`keyed`). Both renderers look a
// `bind` entry up here, so there are no per-component hooks or actions.
import type { Handler } from './Tree.model';
import { musicStores } from '../Music/registry.stores';
import { bindLongPress, type LongPressParams } from '../components/core/Button/longPress';
import { bindHold, type HoldParams } from '../components/core/Button/hold';
import { bindKnob, type KnobParams } from '../components/music/Knob/knobInput';
import { bindTip, type TipParams } from './tip';
import { bindDismiss, bindFocusReturn, type DismissParams, type FocusReturnParams } from '../yahaha/AppBar/popover';
import { bindLineSlider, type LineSliderParams } from '../components/core/LineSlider/slide';
import { bindSegmented, type SegmentedParams } from '../components/core/Segmented/segmentedInput';
import { bindSelect, bindSelectMenu, type SelectMenuParams, type SelectParams } from '../components/core/Select/selectInput';
import { bindStepAdjust, type StepAdjustParams } from '../components/core/StepValue/adjust';
import { bindReadoutAdjust, type ReadoutAdjustParams } from '../components/core/Readout/adjust';
import { bindNumberField, bindNumberFieldEditor, type NumberFieldEditorParams, type NumberFieldParams } from '../components/core/NumberField/numberFieldInput';
import { bindCheckControlled, bindCheckDefault, type CheckControlledParams, type CheckDefaultParams } from '../components/core/Checkbox/checkDefault';
import { bindPopover, type PopoverParams } from '../components/core/Popover/placement';
import { bindPortal, type PortalParams } from '../components/core/Popover/portal';
import { bindParamGesture, type ParamGestureParams } from '../components/core/Param/paramGesture';
import { bindSliderEntry, type SliderEntryParams } from '../components/core/Slider/sliderEntry';
import { bindDialogEscape, bindFocusTrap, type DialogEscapeParams, type FocusTrapParams } from '../components/core/Modal/dialog';
import { bindRoom, type RoomParams } from '../layout/assembly/room';
import { bindReport, type ReportParams } from './report';
import { bindRef, type RefParams } from './ref';
import { bindDisplayFit, bindDisplayWide, type DisplayFitParams, type DisplayWideParams } from '../yahaha/Display/fit';
import { bindPad, type PadParams } from '../components/music/Pad/padPress';
import { bindFader, type FaderParams } from '../components/music/Fader/faderInput';
import { bindXyInput, type XyInputParams } from '../components/music/XYPad/xyInput';
import { bindKeysInput, type KeysBindParams } from '../components/music/Keys/keysInput';
import { bindFillWidth, type FillWidthParams } from '../components/music/Keys/fillWidth';
import { bindFit, type ChordFitParams } from '../components/music/ChordReadout/fit';
import { bindBarInput, type BarBindParams } from '../components/music/BarReadout/barInput';
import { bindTempoNumber, bindTempoStep, type TempoNumberParams, type TempoStepParams } from '../components/music/TempoReadout/tempoGestures';
import { bindShader, type ShaderParams } from '../shader/bindShader';
import { bindSearchClear, type SearchClearParams } from '../components/core/SearchField/clear';
import { bindPageList, type PageListParams } from '../components/core/PageList/pageListKeys';
import { bindFolderList, type FolderListParams } from '../components/core/FolderList/folderListKeys';
import { bindGateFocus, type GateFocusParams } from '../components/core/Gate/gateFocus';

/** A bound store: `update` with new params, `destroy` when the element goes. */
export interface StoreBinding<P> {
  update?(params: P): void;
  destroy?(): void;
}

/** A registered store: applied to `node` with `params`; `handler(key)` is the latest callback for a key. */
export type Store<P extends object = any> = (node: HTMLElement, params: P, handler: (key: string) => Handler | undefined) => StoreBinding<P> | void;

/** A registry of stores by name. */
export type Stores = Record<string, Store>;

/** `P` with its callback fields `F` given as handler keys. */
export type Keyed<P, F extends keyof P> = Omit<P, F> & { [K in F]?: string };

/**
 * A plain `bindX(node, params)` store as a tree store: the callback fields `fields` hold handler
 * keys in the tree, and the store reads them as the latest handlers, at the moment it calls them.
 */
export function keyed<P extends object, F extends keyof P & string>(
  bind: (node: HTMLElement, params: P) => StoreBinding<P>,
  fields: readonly F[],
): Store<Keyed<P, F>> {
  return (node, initial, handler) => {
    let params: Keyed<P, F> = initial;
    const callbacks = new Set<string>(fields);
    const live = new Proxy({} as P, {
      get(_, name) {
        const value = (params as Record<string | symbol, unknown>)[name];
        return typeof name === 'string' && callbacks.has(name) ? (typeof value === 'string' ? handler(value) : undefined) : value;
      },
    });
    const binding = bind(node, live);
    return {
      update(next) {
        params = next;
        binding.update?.(live);
      },
      destroy: () => binding.destroy?.(),
    };
  };
}

/** Every store a tree can bind, by name. A new store is one line here. */
export const stores = {
  ...musicStores(),
  /** Button's long press (`longPress.ts`). */
  longPress: keyed<LongPressParams, 'onLongPress' | 'onLongRelease'>(bindLongPress, ['onLongPress', 'onLongRelease']),
  /** Button's repeat-while-held (`hold.ts`). */
  hold: keyed<HoldParams, 'onHold'>(bindHold, ['onHold']),
  /** The app's tooltip action (`tip.ts`). */
  tip: keyed<TipParams, 'tipAction'>(bindTip, ['tipAction']),
  /** Knob's drag, keys, wheel, press and tooltip (`knobInput.ts`). */
  knob: keyed<KnobParams, 'tipAction' | 'onpress' | 'onstep'>(bindKnob, ['tipAction', 'onpress', 'onstep']),
  /** MetronomePopover's Esc and press-outside close (`yahaha/AppBar/popover.ts`). */
  dismiss: keyed<DismissParams, 'onClose'>(bindDismiss, ['onClose']),
  /** AppBar's focus back to the metronome's opener when its popover closes (`yahaha/AppBar/popover.ts`). */
  focusReturn: keyed<FocusReturnParams, never>(bindFocusReturn, []),
  /** LineSlider's keys and drag (`slide.ts`). */
  lineSlider: keyed<LineSliderParams, 'onchange' | 'onheld'>(bindLineSlider, ['onchange', 'onheld']),
  /** Segmented's arrows, clicks and focus following the choice (`segmentedInput.ts`). */
  segmented: keyed<SegmentedParams, 'onChange'>(bindSegmented, ['onChange']),
  /** Select's trigger: keys, type-ahead, open and close (`selectInput.ts`). */
  select: keyed<SelectParams, 'onState' | 'onChange'>(bindSelect, ['onState', 'onChange']),
  /** Select's open menu: placement, rows and dismissal (`selectInput.ts`). */
  selectMenu: keyed<SelectMenuParams, 'onState' | 'onChange'>(bindSelectMenu, ['onState', 'onChange']),
  /** StepValue's drag, wheel, keys and double-click (`StepValue/adjust.ts`). */
  stepAdjust: keyed<StepAdjustParams, 'onchange'>(bindStepAdjust, ['onchange']),
  /** Readout's drag, wheel, keys and double-click (`Readout/adjust.ts`). */
  readoutAdjust: keyed<ReadoutAdjustParams, 'onChange'>(bindReadoutAdjust, ['onChange']),
  /** NumberField's drag, keys and double-click (`numberFieldInput.ts`). */
  numberField: keyed<NumberFieldParams, 'onChange' | 'onRelease' | 'onEdit'>(bindNumberField, ['onChange', 'onRelease', 'onEdit']),
  /** NumberField's editor while typing (`numberFieldInput.ts`). */
  numberFieldEditor: keyed<NumberFieldEditorParams, 'onDraft' | 'onCommit' | 'onCancel'>(bindNumberFieldEditor, ['onDraft', 'onCommit', 'onCancel']),
  /** An uncontrolled Checkbox's or Radio's starting state, set once (`checkDefault.ts`). */
  checkDefault: keyed<CheckDefaultParams, never>(bindCheckDefault, []),
  /** A controlled Checkbox's or Radio's state put back after a change its parent rejects (`checkDefault.ts`). */
  checkControlled: keyed<CheckControlledParams, never>(bindCheckControlled, []),
  /** Popover's placement and dismissal (`components/core/Popover/placement.ts`). */
  popover: keyed<PopoverParams, 'anchor' | 'within' | 'onDismiss'>(bindPopover, ['anchor', 'within', 'onDismiss']),
  /** An element moved elsewhere in the document while bound: Popover's `portal` (`components/core/Popover/portal.ts`). */
  portal: keyed<PortalParams, 'into'>(bindPortal, ['into']),
  /** A Param control's drag, double-click and keys (Slider's track; `Param/paramGesture.ts`). */
  paramGesture: keyed<ParamGestureParams, 'onChange' | 'onRelease' | 'onDepth' | 'keyStep'>(bindParamGesture, ['onChange', 'onRelease', 'onDepth', 'keyStep']),
  /** Slider's typed readout: open, type, Enter / Escape / leave, focus (`Slider/sliderEntry.ts`). */
  sliderEntry: keyed<SliderEntryParams, 'onEntry' | 'onCommit'>(bindSliderEntry, ['onEntry', 'onCommit']),
  /** Modal's focus in, trapped, and back to the opener (`components/core/Modal/dialog.ts`). */
  focusTrap: keyed<FocusTrapParams, never>(bindFocusTrap, []),
  /** Modal's Esc close, topmost dialog only (`components/core/Modal/dialog.ts`). */
  dialogEscape: keyed<DialogEscapeParams, 'onClose'>(bindDialogEscape, ['onClose']),
  /** An assembled screen's measured room (`layout/assembly/room.ts`). */
  room: keyed<RoomParams, 'onRoom'>(bindRoom, ['onRoom']),
  /** An assembled screen's placement, reported once per change (`report.ts`). */
  report: keyed<ReportParams, 'onReport'>(bindReport, ['onReport']),
  /** Screen's `gridRef`: the element on mount, null on unmount (`ref.ts`). */
  ref: keyed<RefParams, 'onRef'>(bindRef, ['onRef']),
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
  /** A Surface's shader canvas: the page's shared WebGL2 context draws into it (`shader/bindShader.ts`). */
  shader: keyed<ShaderParams, 'onError'>(bindShader, ['onError']),
  /** SearchField's clear button: keeps focus in the field, clears, refocuses the input (`SearchField/clear.ts`). */
  searchClear: keyed<SearchClearParams, 'onClear'>(bindSearchClear, ['onClear']),
  /** PageList's clicks and ↑ ↓ Home End (`pageListKeys.ts`). */
  pageList: keyed<PageListParams, 'onChoose'>(bindPageList, ['onChoose']),
  /** FolderList's clicks, ↑ ↓ Home End and roving tab stop (`folderListKeys.ts`). */
  folderList: keyed<FolderListParams, 'onChoose' | 'onActive'>(bindFolderList, ['onChoose', 'onActive']),
  /** Gate's field: focused at mount and when a submit ends (`Gate/gateFocus.ts`). */
  gateFocus: keyed<GateFocusParams, never>(bindGateFocus, []),
} satisfies Stores;

export type StoreName = keyof typeof stores;
