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
import { SettingsRow } from '../../components/SettingsRow/SettingsRow';
import { StatusDot } from '../../components/StatusDot/StatusDot';
import { BarBeat } from '../../instrument/components/BarBeat/BarBeat';
import { ChordReadout } from '../../instrument/components/ChordReadout/ChordReadout';
import { Fader } from '../../instrument/components/Fader/Fader';
import { Keys } from '../../instrument/components/Keys/Keys';
import { Knob } from '../../instrument/components/Knob/Knob';
import { Pad } from '../../instrument/components/Pad/Pad';
import { PartMarks } from '../../instrument/components/PartMarks/PartMarks';
import { SectionName } from '../../instrument/components/SectionName/SectionName';
import { TempoReadout } from '../../instrument/components/TempoReadout/TempoReadout';
import { Meter } from '../../instrument/components/Meter/Meter';
import { LoopPie } from '../../instrument/components/LoopPie/LoopPie';
import { LoopGrid } from '../../instrument/components/LoopGrid/LoopGrid';
import { SendBars } from '../../instrument/components/SendBars/SendBars';
import { MixBand } from '../../instrument/components/MixBand/MixBand';
import { ChordStrip } from '../../instrument/components/ChordStrip/ChordStrip';
import { ArpSequencer } from '../../instrument/components/ArpSequencer/ArpSequencer';
import { XYPad } from '../../instrument/components/XYPad/XYPad';
import { MacroPads } from '../../instrument/components/MacroPads/MacroPads';
import { StemLanes } from '../../instrument/components/StemLanes/StemLanes';
import { TransitionRow } from '../../instrument/components/TransitionRow/TransitionRow';
import { Transport } from '../../instrument/components/Transport/Transport';
import { DeviceFace } from '../../instrument/components/DeviceFace/DeviceFace';
import { PianoRoll } from '../../instrument/components/PianoRoll/PianoRoll';
import { BarReadout } from '../../instrument/components/BarReadout/BarReadout';
import { SendReadout } from '../../instrument/components/SendReadout/SendReadout';
import { SoundCell } from '../../instrument/components/SoundCell/SoundCell';
import { RackCell } from '../../instrument/components/RackCell/RackCell';
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
    Knob,
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
    Meter,
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
    Transport,
    DeviceFace,
    PianoRoll,
    BarReadout,
    SendReadout,
    SoundCell,
    RackCell,
    PageList,
    FolderList,
  };
  const found = registry[name];
  if (!found) throw new Error(`view: no component named "${name}" (register it in src/library/foundation/view/reactComponents.ts and svelteComponents.ts)`);
  return found;
}
