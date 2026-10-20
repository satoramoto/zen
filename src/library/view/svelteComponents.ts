// The Svelte side of the component registry: every component a tree can draw by name, as its Svelte
// component, with the same names as `reactComponents.ts`. One line per component in each. Built on
// first use, as the React side is.
import type { Component } from 'svelte';
import Button from '../components/core/Button/Button.svelte';
import LampButton from '../components/core/LampButton/LampButton.svelte';
import LineSlider from '../components/core/LineSlider/LineSlider.svelte';
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
import Group from '../layout/Group.svelte';
import Region from '../layout/Region.svelte';
import Tabs from '../layout/Tabs.svelte';
import Stack from '../primitives/Stack.svelte';
import Text from '../primitives/Text.svelte';
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
    Button,
    Knob,
    LampButton,
    LineSlider,
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
  } as Record<string, Component<any>>;
  const found = registry[name];
  if (!found) throw new Error(`view: no component named "${name}" (register it in src/library/view/reactComponents.ts and svelteComponents.ts)`);
  return found;
}
