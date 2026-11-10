// The Svelte side of the component registry: every component a tree can draw by name, as its Svelte
// component, with the same names as `reactComponents.ts`. One line per component in each. Built on
// first use, as the React side is.
import type { Component } from 'svelte';
import { musicSvelteComponents } from '../../music/registry.svelte';
import Button from '../../components/Button/Button.svelte';
import ActionButton from '../../components/ActionButton/ActionButton.svelte';
import SearchField from '../../components/SearchField/SearchField.svelte';
import LampButton from '../../components/LampButton/LampButton.svelte';
import LineSlider from '../../components/LineSlider/LineSlider.svelte';
import Segmented from '../../components/Segmented/Segmented.svelte';
import Select from '../../components/Select/Select.svelte';
import Toggle from '../../components/Toggle/Toggle.svelte';
import Switch from '../../components/Toggle/Switch.svelte';
import Disclosure from '../../components/Disclosure/Disclosure.svelte';
import StepValue from '../../components/StepValue/StepValue.svelte';
import Readout from '../../components/Readout/Readout.svelte';
import NumberField from '../../components/NumberField/NumberField.svelte';
import Checkbox from '../../components/Checkbox/Checkbox.svelte';
import Radio from '../../components/Radio/Radio.svelte';
import Slider from '../../components/Slider/Slider.svelte';
import Popover from '../../components/Popover/Popover.svelte';
import Modal from '../../components/Modal/Modal.svelte';
import Sheet from '../../components/Modal/Sheet.svelte';
import Separator from '../../components/Separator/Separator.svelte';
import SettingsRow from '../../components/SettingsRow/SettingsRow.svelte';
import StatusDot from '../../components/StatusDot/StatusDot.svelte';
import BarBeat from '../../music/components/BarBeat/BarBeat.svelte';
import ChordReadout from '../../music/components/ChordReadout/ChordReadout.svelte';
import Fader from '../../music/components/Fader/Fader.svelte';
import Keys from '../../music/components/Keys/Keys.svelte';
import KnobReadout from '../../music/components/KnobReadout/KnobReadout.svelte';
import Pad from '../../music/components/Pad/Pad.svelte';
import PartMarks from '../../music/components/PartMarks/PartMarks.svelte';
import SectionName from '../../music/components/SectionName/SectionName.svelte';
import TempoReadout from '../../music/components/TempoReadout/TempoReadout.svelte';
import LevelMeter from '../../music/components/LevelMeter/LevelMeter.svelte';
import LoopPie from '../../music/components/LoopPie/LoopPie.svelte';
import LoopGrid from '../../music/components/LoopGrid/LoopGrid.svelte';
import SendBars from '../../music/components/SendBars/SendBars.svelte';
import MixBand from '../../music/components/MixBand/MixBand.svelte';
import ChordStrip from '../../music/components/ChordStrip/ChordStrip.svelte';
import ArpSequencer from '../../music/components/ArpSequencer/ArpSequencer.svelte';
import XYPad from '../../music/components/XYPad/XYPad.svelte';
import MacroPads from '../../music/components/MacroPads/MacroPads.svelte';
import StemLanes from '../../music/components/StemLanes/StemLanes.svelte';
import TransitionRow from '../../music/components/TransitionRow/TransitionRow.svelte';
import TransportBar from '../../music/components/TransportBar/TransportBar.svelte';
import DeviceFace from '../../music/components/DeviceFace/DeviceFace.svelte';
import PianoRoll from '../../music/components/PianoRoll/PianoRoll.svelte';
import BarReadout from '../../music/components/BarReadout/BarReadout.svelte';
import SendReadout from '../../music/components/SendReadout/SendReadout.svelte';
import SoundCell from '../../music/components/SoundCell/SoundCell.svelte';
import RackCell from '../../music/components/RackCell/RackCell.svelte';
import PageList from '../../components/PageList/PageList.svelte';
import FolderList from '../../components/FolderList/FolderList.svelte';
import Group from '../../layouts/Group/Group.svelte';
import Region from '../../layouts/Region/Region.svelte';
import Tabs from '../../layouts/Tabs/Tabs.svelte';
import Stack from '../../primitives/Stack/Stack.svelte';
import Text from '../../primitives/Text/Text.svelte';
import Layer from '../../layouts/Layer/Layer.svelte';
import Screen from '../../layouts/Screen/Screen.svelte';
import Surface from '../../primitives/Surface/Surface.svelte';
import Context from './Context.svelte';
import Contain from './Contain.svelte';
import AssembledScreen from '../../layouts/Assembly/AssembledScreen.svelte';
import FormScope from '../../layouts/Assembly/FormScope.svelte';
import AccentBlock from '../../yahaha/components/AccentBlock/AccentBlock.svelte';
import AppBar from '../../yahaha/components/AppBar/AppBar.svelte';
import MetronomePopover from '../../yahaha/components/AppBar/MetronomePopover.svelte';
import Display from '../../yahaha/components/Display/Display.svelte';
import DisplayArt from '../../yahaha/components/DisplayArt/DisplayArt.svelte';
import FaderBank from '../../yahaha/components/FaderBank/FaderBank.svelte';
import FaderBankRegion from '../../yahaha/components/FaderBank/FaderBankRegion.svelte';
import HealthSlot from '../../yahaha/components/HealthSlot/HealthSlot.svelte';
import KnobBank from '../../yahaha/components/KnobBank/KnobBank.svelte';
import KnobBankRegion from '../../yahaha/components/KnobBank/KnobBankRegion.svelte';
import OneTouchPicker from '../../yahaha/components/OneTouchPicker/OneTouchPicker.svelte';
import PadBank from '../../yahaha/components/PadBank/PadBank.svelte';
import PadBankRegion from '../../yahaha/components/PadBank/PadBankRegion.svelte';
import SongForm from '../../yahaha/components/SongForm/SongForm.svelte';
import Stage from '../../yahaha/screens/Stage/Stage.svelte';
import StatusLine from '../../yahaha/components/StatusLine/StatusLine.svelte';
import WaitingChip from '../../yahaha/components/WaitingChip/WaitingChip.svelte';

let registry: Record<string, Component<any>> | undefined;

/** The Svelte component registered as `name`; throws for an unknown name. */
export function svelteComponent(name: string): Component<any> {
  registry ??= {
    ...musicSvelteComponents(),
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
    LevelMeter,
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
    TransportBar,
    DeviceFace,
    PianoRoll,
    BarReadout,
    SendReadout,
    SoundCell,
    RackCell,
    PageList,
    FolderList,
  } as Record<string, Component<any>>;
  const found = registry[name];
  if (!found) throw new Error(`view: no component named "${name}" (register it in src/library/foundation/view/reactComponents.ts and svelteComponents.ts)`);
  return found;
}
