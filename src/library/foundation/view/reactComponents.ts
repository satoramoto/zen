// The React side of the component registry: every component a tree can draw by name
// (`component('LampButton', …)`), as its React component. `svelteComponents.ts` is the Svelte side,
// with the same names; a model names a component and never imports a renderer. One line per
// component in each. The map is built on first use, so the import cycle (a registered component
// draws a `Tree`, which reads this) never sees a half-loaded module.
import type { ComponentType } from 'react';
import { musicReactComponents } from '../../music/registry.react';
import { Button } from '../../components/Button/Button';
import { ActionButton } from '../../components/ActionButton/ActionButton';
import { SearchField } from '../../components/SearchField/SearchField';
import { LampButton } from '../../components/LampButton/LampButton';
import { LineSlider } from '../../components/LineSlider/LineSlider';
import { Segmented } from '../../components/Segmented/Segmented';
import { Select } from '../../components/Select/Select';
import { Switch, Toggle } from '../../components/Toggle/Toggle';
import { Disclosure } from '../../components/Disclosure/Disclosure';
import { StepValue } from '../../components/StepValue/StepValue';
import { Readout } from '../../components/Readout/Readout';
import { NumberField } from '../../components/NumberField/NumberField';
import { Checkbox } from '../../components/Checkbox/Checkbox';
import { Radio } from '../../components/Radio/Radio';
import { Slider } from '../../components/Slider/Slider';
import { Popover } from '../../components/Popover/Popover';
import { Modal, Sheet } from '../../components/Modal/Modal';
import { Separator } from '../../components/Separator/Separator';
import { CodeImage } from '../../components/CodeImage/CodeImage';
import { SettingsRow } from '../../components/SettingsRow/SettingsRow';
import { StatusDot } from '../../components/StatusDot/StatusDot';
import { BarBeat } from '../../music/components/BarBeat/BarBeat';
import { ChordReadout } from '../../music/components/ChordReadout/ChordReadout';
import { Fader } from '../../music/components/Fader/Fader';
import { Keys } from '../../music/components/Keys/Keys';
import { KnobReadout } from '../../music/components/KnobReadout/KnobReadout';
import { Pad } from '../../music/components/Pad/Pad';
import { PartMarks } from '../../music/components/PartMarks/PartMarks';
import { SectionName } from '../../music/components/SectionName/SectionName';
import { TempoReadout } from '../../music/components/TempoReadout/TempoReadout';
import { LoopPie } from '../../music/components/LoopPie/LoopPie';
import { LoopGrid } from '../../music/components/LoopGrid/LoopGrid';
import { SendBars } from '../../music/components/SendBars/SendBars';
import { MixBand } from '../../music/components/MixBand/MixBand';
import { ChordStrip } from '../../music/components/ChordStrip/ChordStrip';
import { ArpSequencer } from '../../music/components/ArpSequencer/ArpSequencer';
import { XYPad } from '../../music/components/XYPad/XYPad';
import { MacroPads } from '../../music/components/MacroPads/MacroPads';
import { StemLanes } from '../../music/components/StemLanes/StemLanes';
import { TransitionRow } from '../../music/components/TransitionRow/TransitionRow';
import { DeviceFace } from '../../music/components/DeviceFace/DeviceFace';
import { PianoRoll } from '../../music/components/PianoRoll/PianoRoll';
import { BarReadout } from '../../music/components/BarReadout/BarReadout';
import { SendReadout } from '../../music/components/SendReadout/SendReadout';
import { SoundCell } from '../../music/components/SoundCell/SoundCell';
import { RackCell } from '../../music/components/RackCell/RackCell';
import { PageList } from '../../components/PageList/PageList';
import { FolderList } from '../../components/FolderList/FolderList';
import { Group } from '../../layouts/Group/Group';
import { Region } from '../../layouts/Region/Region';
import { Tabs } from '../../layouts/Tabs/Tabs';
import { Stack } from '../../primitives/Stack/Stack';
import { Text } from '../../primitives/Text/Text';
import { Layer } from '../../layouts/Layer/Layer';
import { Screen } from '../../layouts/Screen/Screen';
import { Surface } from '../../primitives/Surface/Surface';
import { Context } from './Context';
import { Contain } from './Contain';
import { AssembledScreen } from '../../layouts/Assembly/AssembledScreen';
import { FormProvider as FormScope } from '../../layouts/Assembly/forms';
import { AccentBlock } from '../../yahaha/components/AccentBlock/AccentBlock';
import { AppBar } from '../../yahaha/components/AppBar/AppBar';
import { MetronomePopover } from '../../yahaha/components/AppBar/MetronomePopover';
import { Display } from '../../yahaha/components/Display/Display';
import { DisplayArt } from '../../yahaha/components/DisplayArt/DisplayArt';
import { FaderBank, FaderBankRegion } from '../../yahaha/components/FaderBank/FaderBank';
import { HealthSlot } from '../../yahaha/components/HealthSlot/HealthSlot';
import { KnobBank, KnobBankRegion } from '../../yahaha/components/KnobBank/KnobBank';
import { OneTouchPicker } from '../../yahaha/components/OneTouchPicker/OneTouchPicker';
import { PadBank, PadBankRegion } from '../../yahaha/components/PadBank/PadBank';
import { SongForm } from '../../yahaha/components/SongForm/SongForm';
import { Stage } from '../../yahaha/screens/Stage/Stage';
import { StatusLine } from '../../yahaha/components/StatusLine/StatusLine';
import { WaitingChip } from '../../yahaha/components/WaitingChip/WaitingChip';

let registry: Record<string, ComponentType<any>> | undefined;
/** The parts an app registered (`registerComponents`), by name. */
const added = new Map<string, ComponentType<any>>();

/** The React component registered as `name`; throws for an unknown name. */
export function reactComponent(name: string): ComponentType<any> {
  registry ??= {
    ...musicReactComponents(),
    AssembledScreen,
    FormScope,
    Layer,
    Screen,
    Surface,
    Context,
    Contain,
    Button,
    ActionButton,
    SearchField,
    KnobReadout,
    LampButton,
    LineSlider,
    Segmented,
    Select,
    Toggle,
    Switch,
    Disclosure,
    StepValue,
    Readout,
    NumberField,
    Checkbox,
    Radio,
    Slider,
    Popover,
    Modal,
    Sheet,
    Separator,
    CodeImage,
    SettingsRow,
    Stack,
    StatusDot,
    Tabs,
    Text,
    HealthSlot,
    MetronomePopover,
    ChordReadout,
    TempoReadout,
    AccentBlock,
    AppBar,
    BarBeat,
    Display,
    DisplayArt,
    Fader,
    FaderBank,
    FaderBankRegion,
    Group,
    Keys,
    KnobBank,
    KnobBankRegion,
    OneTouchPicker,
    Pad,
    PadBank,
    PadBankRegion,
    PartMarks,
    Region,
    SectionName,
    SongForm,
    Stage,
    StatusLine,
    WaitingChip,
    LoopPie,
    LoopGrid,
    SendBars,
    MixBand,
    ChordStrip,
    ArpSequencer,
    XYPad,
    MacroPads,
    StemLanes,
    TransitionRow,
    DeviceFace,
    PianoRoll,
    BarReadout,
    SendReadout,
    SoundCell,
    RackCell,
    PageList,
    FolderList,
  };
  const found = registry[name] ?? added.get(name);
  if (!found) throw new Error(`view: no component named "${name}" (zen's are listed in src/library/foundation/view/reactComponents.ts and svelteComponents.ts; an app adds its own with registerComponents)`);
  return found;
}

/**
 * Adds an app's own parts to the React registry, by the names its trees give them
 * (`component('AppGauge', …)`). A name zen already has is refused, so an app never replaces a zen
 * part; registering an app's name again replaces it (a hot reload).
 */
export function registerComponents(parts: Record<string, ComponentType<any>>): void {
  reactComponent('Button');
  for (const [name, part] of Object.entries(parts)) {
    if (registry![name]) throw new Error(`view: "${name}" is zen's own part; give the app's part a name of its own`);
    added.set(name, part);
  }
}
