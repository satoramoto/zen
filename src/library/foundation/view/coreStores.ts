// The stores the core parts bind (the controls in `components/`, the primitives, the layers and the
// chart's TimeChart),
// apart from music's and Yahaha's, so a renderer of the core alone (the DOM renderer's Hotwire
// build) carries no others. `stores.ts` spreads them into the full registry.
import { keyed, type Stores } from './keyed';
import { bindLongPress, type LongPressParams } from '../../components/Button/longPress';
import { bindHold, type HoldParams } from '../../components/Button/hold';
import { bindTip, type TipParams } from './tip';
import { bindLineSlider, type LineSliderParams } from '../../components/LineSlider/slide';
import { bindSegmented, type SegmentedParams } from '../../components/Segmented/segmentedInput';
import { bindSelect, bindSelectMenu, type SelectMenuParams, type SelectParams } from '../../components/Select/selectInput';
import { bindStepAdjust, type StepAdjustParams } from '../../components/StepValue/adjust';
import { bindReadoutAdjust, type ReadoutAdjustParams } from '../../components/Readout/adjust';
import { bindNumberField, bindNumberFieldEditor, type NumberFieldEditorParams, type NumberFieldParams } from '../../components/NumberField/numberFieldInput';
import { bindCheckControlled, bindCheckDefault, type CheckControlledParams, type CheckDefaultParams } from '../../components/Checkbox/checkDefault';
import { bindPopover, type PopoverParams } from '../../components/Popover/placement';
import { bindPortal, type PortalParams } from '../../components/Popover/portal';
import { bindParamGesture, type ParamGestureParams } from '../../components/Param/paramGesture';
import { bindSliderEntry, type SliderEntryParams } from '../../components/Slider/sliderEntry';
import { bindDialogEscape, bindFocusTrap, type DialogEscapeParams, type FocusTrapParams } from '../../components/Modal/dialog';
import { bindRef, type RefParams } from './ref';
import { bindShader, type ShaderParams } from '../../shader/bindShader';
import { bindSearchClear, type SearchClearParams } from '../../components/SearchField/clear';
import { bindPageList, type PageListParams } from '../../components/PageList/pageListKeys';
import { bindFolderList, type FolderListParams } from '../../components/FolderList/folderListKeys';
import { bindGateFocus, type GateFocusParams } from '../../components/Gate/gateFocus';
import { bindTimeChart, type TimeChartParams } from '../../chart/components/TimeChart/timeChart';

/** The core parts' stores, by name. */
export const coreStores = {
  /** Button's long press (`longPress.ts`). */
  longPress: keyed<LongPressParams, 'onLongPress' | 'onLongRelease'>(bindLongPress, ['onLongPress', 'onLongRelease']),
  /** Button's repeat-while-held (`hold.ts`). */
  hold: keyed<HoldParams, 'onHold'>(bindHold, ['onHold']),
  /** The app's tooltip action (`tip.ts`). */
  tip: keyed<TipParams, 'tipAction'>(bindTip, ['tipAction']),
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
  /** Popover's placement and dismissal (`components/Popover/placement.ts`). */
  popover: keyed<PopoverParams, 'anchor' | 'within' | 'onDismiss'>(bindPopover, ['anchor', 'within', 'onDismiss']),
  /** An element moved elsewhere in the document while bound: Popover's `portal` (`components/Popover/portal.ts`). */
  portal: keyed<PortalParams, 'into'>(bindPortal, ['into']),
  /** A Param control's drag, double-click and keys (Slider's track; `Param/paramGesture.ts`). */
  paramGesture: keyed<ParamGestureParams, 'onChange' | 'onRelease' | 'onDepth' | 'keyStep'>(bindParamGesture, ['onChange', 'onRelease', 'onDepth', 'keyStep']),
  /** Slider's typed readout: open, type, Enter / Escape / leave, focus (`Slider/sliderEntry.ts`). */
  sliderEntry: keyed<SliderEntryParams, 'onEntry' | 'onCommit'>(bindSliderEntry, ['onEntry', 'onCommit']),
  /** Modal's focus in, trapped, and back to the opener (`components/Modal/dialog.ts`). */
  focusTrap: keyed<FocusTrapParams, never>(bindFocusTrap, []),
  /** Modal's Esc close, topmost dialog only (`components/Modal/dialog.ts`). */
  dialogEscape: keyed<DialogEscapeParams, 'onClose'>(bindDialogEscape, ['onClose']),
  /** Screen's `gridRef`: the element on mount, null on unmount (`ref.ts`). */
  ref: keyed<RefParams, 'onRef'>(bindRef, ['onRef']),
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
  /** TimeChart's plot: Lightweight Charts, loaded on first mount (`chart/components/TimeChart/timeChart.ts`). */
  timeChart: keyed<TimeChartParams, 'onHover'>(bindTimeChart, ['onHover']),
} satisfies Stores;
