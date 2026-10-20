// The Svelte side of the component registry: every component a tree can draw by name, as its Svelte
// component, with the same names as `reactComponents.ts`. One line per component in each. Built on
// first use, as the React side is.
import type { Component } from 'svelte';
import Button from '../components/core/Button/Button.svelte';
import ActionButton from '../components/core/ActionButton/ActionButton.svelte';
import SearchField from '../components/core/SearchField/SearchField.svelte';
import LampButton from '../components/core/LampButton/LampButton.svelte';
import LineSlider from '../components/core/LineSlider/LineSlider.svelte';
import Slider from '../components/core/Slider/Slider.svelte';
import Popover from '../components/core/Popover/Popover.svelte';
import Modal from '../components/core/Modal/Modal.svelte';
import Sheet from '../components/core/Modal/Sheet.svelte';
import Separator from '../components/core/Separator/Separator.svelte';
import SettingsRow from '../components/core/SettingsRow/SettingsRow.svelte';
import StatusDot from '../components/core/StatusDot/StatusDot.svelte';
import BarBeat from '../components/music/BarBeat/BarBeat.svelte';
import ChordReadout from '../components/music/ChordReadout/ChordReadout.svelte';
import Fader from '../components/music/Fader/Fader.svelte';
import Keys from '../components/music/Keys/Keys.svelte';
import Knob from '../components/music/Knob/Knob.svelte';
import Pad from '../components/music/Pad/Pad.svelte';
import PartMarks from '../components/music/PartMarks/PartMarks.svelte';
import SectionName from '../components/music/SectionName/SectionName.svelte';
import TempoReadout from '../components/music/TempoReadout/TempoReadout.svelte';
import Meter from '../components/music/Meter/Meter.svelte';
import BarReadout from '../components/music/BarReadout/BarReadout.svelte';
import SendReadout from '../components/music/SendReadout/SendReadout.svelte';
import SoundCell from '../components/music/SoundCell/SoundCell.svelte';
import RackCell from '../components/music/RackCell/RackCell.svelte';
import PageList from '../components/core/PageList/PageList.svelte';
import FolderList from '../components/core/FolderList/FolderList.svelte';
import Group from '../layout/Group.svelte';
import Region from '../layout/Region.svelte';
import Tabs from '../layout/Tabs.svelte';
import Stack from '../primitives/Stack.svelte';
import Text from '../primitives/Text.svelte';
import Layer from '../layout/Layer.svelte';
import Screen from '../layout/Screen.svelte';
import SlotCall from '../layout/SlotCall.svelte';
import Surface from '../primitives/Surface.svelte';
import AssembledScreen from '../layout/assembly/AssembledScreen.svelte';
import FormScope from '../layout/assembly/FormScope.svelte';
import AccentBlock from '../yahaha/AccentBlock/AccentBlock.svelte';
import AppBar from '../yahaha/AppBar/AppBar.svelte';
import MetronomePopover from '../yahaha/AppBar/MetronomePopover.svelte';
import Display from '../yahaha/Display/Display.svelte';
import DisplayArt from '../yahaha/DisplayArt/DisplayArt.svelte';
import FaderBank from '../yahaha/FaderBank/FaderBank.svelte';
import FaderBankRegion from '../yahaha/FaderBank/FaderBankRegion.svelte';
import HealthSlot from '../yahaha/HealthSlot/HealthSlot.svelte';
import KnobBank from '../yahaha/KnobBank/KnobBank.svelte';
import KnobBankRegion from '../yahaha/KnobBank/KnobBankRegion.svelte';
import OneTouchPicker from '../yahaha/OneTouchPicker/OneTouchPicker.svelte';
import PadBank from '../yahaha/PadBank/PadBank.svelte';
import PadBankRegion from '../yahaha/PadBank/PadBankRegion.svelte';
import SongForm from '../yahaha/SongForm/SongForm.svelte';
import Stage from '../yahaha/Stage/Stage.svelte';
import StatusLine from '../yahaha/StatusLine/StatusLine.svelte';
import WaitingChip from '../yahaha/WaitingChip/WaitingChip.svelte';

let registry: Record<string, Component<any>> | undefined;

/** The Svelte component registered as `name`; throws for an unknown name. */
export function svelteComponent(name: string): Component<any> {
  registry ??= {
    AssembledScreen,
    FormScope,
    Layer,
    Screen,
    SlotCall,
    Surface,
    Button,
    ActionButton,
    SearchField,
    Knob,
    LampButton,
    LineSlider,
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
    BarReadout,
    SendReadout,
    SoundCell,
    RackCell,
    PageList,
    FolderList,
  } as Record<string, Component<any>>;
  const found = registry[name];
  if (!found) throw new Error(`view: no component named "${name}" (register it in src/library/view/reactComponents.ts and svelteComponents.ts)`);
  return found;
}
