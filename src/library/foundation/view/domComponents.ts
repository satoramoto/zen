// The DOM side of the component registry: every part the DOM renderer draws by name, as its
// `domPart` (`<Name>.dom.ts`). `reactComponents.ts` and `svelteComponents.ts` are the other two
// sides, with the same names. The DOM side holds the core alone (the controls in `components/`,
// the primitives and layers they draw, and the chart's TimeChart); a name outside it fails, saying so. Built on first
// use, as the other two are, since a registered part draws a tree that reads this.
import { batch, type DomPart } from './Tree.dom';
import { coreStores } from './coreStores';
import type { DomPartDefinition } from './dom';
import { ActionButtonDom } from '../../components/ActionButton/ActionButton.dom';
import { ButtonDom } from '../../components/Button/Button.dom';
import { CheckboxDom } from '../../components/Checkbox/Checkbox.dom';
import { CodeImageDom } from '../../components/CodeImage/CodeImage.dom';
import { DisclosureDom } from '../../components/Disclosure/Disclosure.dom';
import { FolderListDom } from '../../components/FolderList/FolderList.dom';
import { GateDom } from '../../components/Gate/Gate.dom';
import { LampButtonDom } from '../../components/LampButton/LampButton.dom';
import { LineSliderDom } from '../../components/LineSlider/LineSlider.dom';
import { ModalDom, SheetDom } from '../../components/Modal/Modal.dom';
import { NamePickerDom } from '../../components/NamePicker/NamePicker.dom';
import { NumberFieldDom } from '../../components/NumberField/NumberField.dom';
import { PageListDom } from '../../components/PageList/PageList.dom';
import { PopoverDom } from '../../components/Popover/Popover.dom';
import { RadioDom } from '../../components/Radio/Radio.dom';
import { ReadoutDom } from '../../components/Readout/Readout.dom';
import { SearchFieldDom } from '../../components/SearchField/SearchField.dom';
import { SegmentedDom } from '../../components/Segmented/Segmented.dom';
import { SelectDom } from '../../components/Select/Select.dom';
import { SeparatorDom } from '../../components/Separator/Separator.dom';
import { SettingsRowDom } from '../../components/SettingsRow/SettingsRow.dom';
import { SliderDom } from '../../components/Slider/Slider.dom';
import { StatusDotDom } from '../../components/StatusDot/StatusDot.dom';
import { StepValueDom } from '../../components/StepValue/StepValue.dom';
import { SwitchDom, ToggleDom } from '../../components/Toggle/Toggle.dom';
import { VoteControlDom } from '../../components/VoteControl/VoteControl.dom';
import { GroupDom } from '../../layouts/Group/Group.dom';
import { LayerDom } from '../../layouts/Layer/Layer.dom';
import { TabsDom } from '../../layouts/Tabs/Tabs.dom';
import { HoleDom } from '../../primitives/Hole/Hole.dom';
import { IconDom } from '../../primitives/Icon/Icon.dom';
import { OpaqueDom } from '../../primitives/Opaque/Opaque.dom';
import { StackDom } from '../../primitives/Stack/Stack.dom';
import { SurfaceDom } from '../../primitives/Surface/Surface.dom';
import { TextDom } from '../../primitives/Text/Text.dom';
import { TimeChartDom } from '../../chart/components/TimeChart/TimeChart.dom';

let registry: Record<string, DomPartDefinition> | undefined;

/** Every part the DOM renderer draws, by name. */
export function domParts(): Readonly<Record<string, DomPartDefinition>> {
  return (registry ??= {
    ActionButton: ActionButtonDom,
    Button: ButtonDom,
    Checkbox: CheckboxDom,
    CodeImage: CodeImageDom,
    Disclosure: DisclosureDom,
    FolderList: FolderListDom,
    Gate: GateDom,
    LampButton: LampButtonDom,
    LineSlider: LineSliderDom,
    Modal: ModalDom,
    Sheet: SheetDom,
    NamePicker: NamePickerDom,
    NumberField: NumberFieldDom,
    PageList: PageListDom,
    Popover: PopoverDom,
    Radio: RadioDom,
    Readout: ReadoutDom,
    SearchField: SearchFieldDom,
    Segmented: SegmentedDom,
    Select: SelectDom,
    Separator: SeparatorDom,
    SettingsRow: SettingsRowDom,
    Slider: SliderDom,
    StatusDot: StatusDotDom,
    StepValue: StepValueDom,
    Toggle: ToggleDom,
    Switch: SwitchDom,
    VoteControl: VoteControlDom,
    Group: GroupDom,
    Layer: LayerDom,
    Tabs: TabsDom,
    Hole: HoleDom,
    Icon: IconDom,
    Opaque: OpaqueDom,
    Stack: StackDom,
    Surface: SurfaceDom,
    Text: TextDom,
    TimeChart: TimeChartDom,
  });
}

/** The DOM part registered as `name`; throws for a name outside the core. */
export function domComponent(name: string): DomPartDefinition {
  const found = domParts()[name];
  if (!found) throw new Error(`view: no DOM part named "${name}" (the DOM renderer draws the core parts listed in src/library/foundation/view/domComponents.ts)`);
  return found;
}

export type { DomPart };

/** What `mountPart` takes besides the part and its props: the env's parts by default. */
export interface MountPartOptions {
  stores?: import('./keyed').Stores;
  contexts?: import('./contexts').Contexts;
  scope?: import('./Tree.dom').DomScope | null;
}

/** Draws the part named `name` with `props` at the end of `parent`: what a host (the Hotwire
 *  controller, a test) calls. `update` gives it new props, `destroy` takes it away. */
export function mountPart(parent: globalThis.Node, name: string, props: Record<string, unknown>, options: MountPartOptions = {}) {
  const env = (): import('./Tree.dom').DomEnv => ({ stores: options.stores ?? coreStores, components: domComponent, contexts: options.contexts ?? {}, scope: options.scope ?? null, svg: false });
  const instance = batch(() => domComponent(name).mount(parent, null, props, env()));
  return {
    update: (next: Record<string, unknown>, nextOptions: MountPartOptions = options) => {
      options = nextOptions;
      batch(() => instance.update(next, env()));
    },
    nodes: () => instance.nodes(),
    destroy: () => instance.destroy(),
  };
}
