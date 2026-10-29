// The React side of the component registry: every component a tree can draw by name
// (`component('LampButton', …)`), as its React component. `svelteComponents.ts` is the Svelte side,
// with the same names; a model names a component and never imports a renderer. One line per
// component in each. The map is built on first use, so the import cycle (a registered component
// draws a `Tree`, which reads this) never sees a half-loaded module.
import type { ComponentType } from 'react';
import { musicReactComponents } from '../Music/registry.react';
import { Button } from '../components/core/Button/Button';
import { ActionButton } from '../components/core/ActionButton/ActionButton';
import { SearchField } from '../components/core/SearchField/SearchField';
import { LampButton } from '../components/core/LampButton/LampButton';
import { LineSlider } from '../components/core/LineSlider/LineSlider';
import { Segmented } from '../components/core/Segmented/Segmented';
import { Select } from '../components/core/Select/Select';
import { Switch, Toggle } from '../components/core/Toggle/Toggle';
import { Disclosure } from '../components/core/Disclosure/Disclosure';
import { StepValue } from '../components/core/StepValue/StepValue';
import { Readout } from '../components/core/Readout/Readout';
import { NumberField } from '../components/core/NumberField/NumberField';
import { Checkbox } from '../components/core/Checkbox/Checkbox';
import { Radio } from '../components/core/Radio/Radio';
import { Slider } from '../components/core/Slider/Slider';
import { Popover } from '../components/core/Popover/Popover';
import { Modal, Sheet } from '../components/core/Modal/Modal';
import { Separator } from '../components/core/Separator/Separator';
import { SettingsRow } from '../components/core/SettingsRow/SettingsRow';
import { StatusDot } from '../components/core/StatusDot/StatusDot';
import { BarBeat } from '../components/music/BarBeat/BarBeat';
import { ChordReadout } from '../components/music/ChordReadout/ChordReadout';
import { Fader } from '../components/music/Fader/Fader';
import { Keys } from '../components/music/Keys/Keys';
import { Knob } from '../components/music/Knob/Knob';
import { Pad } from '../components/music/Pad/Pad';
import { PartMarks } from '../components/music/PartMarks/PartMarks';
import { SectionName } from '../components/music/SectionName/SectionName';
import { TempoReadout } from '../components/music/TempoReadout/TempoReadout';
import { Meter } from '../components/music/Meter/Meter';
import { LoopPie } from '../components/music/LoopPie/LoopPie';
import { LoopGrid } from '../components/music/LoopGrid/LoopGrid';
import { SendBars } from '../components/music/SendBars/SendBars';
import { MixBand } from '../components/music/MixBand/MixBand';
import { ChordStrip } from '../components/music/ChordStrip/ChordStrip';
import { ArpSequencer } from '../components/music/ArpSequencer/ArpSequencer';
import { XYPad } from '../components/music/XYPad/XYPad';
import { MacroPads } from '../components/music/MacroPads/MacroPads';
import { StemLanes } from '../components/music/StemLanes/StemLanes';
import { TransitionRow } from '../components/music/TransitionRow/TransitionRow';
import { Transport } from '../components/music/Transport/Transport';
import { DeviceFace } from '../components/music/DeviceFace/DeviceFace';
import { PianoRoll } from '../components/music/PianoRoll/PianoRoll';
import { BarReadout } from '../components/music/BarReadout/BarReadout';
import { SendReadout } from '../components/music/SendReadout/SendReadout';
import { SoundCell } from '../components/music/SoundCell/SoundCell';
import { RackCell } from '../components/music/RackCell/RackCell';
import { PageList } from '../components/core/PageList/PageList';
import { FolderList } from '../components/core/FolderList/FolderList';
import { Group } from '../layout/Group';
import { Region } from '../layout/Region';
import { Tabs } from '../layout/Tabs';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { Layer } from '../layout/Layer';
import { Screen } from '../layout/Screen';
import { Surface } from '../primitives/Surface';
import { Context } from './Context';
import { AssembledScreen } from '../layout/assembly/AssembledScreen';
import { FormProvider as FormScope } from '../layout/assembly/forms';
import { AccentBlock } from '../yahaha/AccentBlock/AccentBlock';
import { AppBar } from '../yahaha/AppBar/AppBar';
import { MetronomePopover } from '../yahaha/AppBar/MetronomePopover';
import { Display } from '../yahaha/Display/Display';
import { DisplayArt } from '../yahaha/DisplayArt/DisplayArt';
import { FaderBank, FaderBankRegion } from '../yahaha/FaderBank/FaderBank';
import { HealthSlot } from '../yahaha/HealthSlot/HealthSlot';
import { KnobBank, KnobBankRegion } from '../yahaha/KnobBank/KnobBank';
import { OneTouchPicker } from '../yahaha/OneTouchPicker/OneTouchPicker';
import { PadBank, PadBankRegion } from '../yahaha/PadBank/PadBank';
import { SongForm } from '../yahaha/SongForm/SongForm';
import { Stage } from '../yahaha/Stage/Stage';
import { StatusLine } from '../yahaha/StatusLine/StatusLine';
import { WaitingChip } from '../yahaha/WaitingChip/WaitingChip';

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
  if (!found) throw new Error(`view: no component named "${name}" (register it in src/library/view/reactComponents.ts and svelteComponents.ts)`);
  return found;
}
