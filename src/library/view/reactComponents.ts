// The React side of the component registry: every component a tree can draw by name
// (`component('LampButton', …)`), as its React component. `svelteComponents.ts` is the Svelte side,
// with the same names; a model names a component and never imports a renderer. One line per
// component in each. The map is built on first use, so the import cycle (a registered component
// draws a `Tree`, which reads this) never sees a half-loaded module.
import type { ComponentType } from 'react';
import { Button } from '../components/core/Button/Button';
import { ActionButton } from '../components/core/ActionButton/ActionButton';
import { SearchField } from '../components/core/SearchField/SearchField';
import { LampButton } from '../components/core/LampButton/LampButton';
import { LineSlider } from '../components/core/LineSlider/LineSlider';
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
import { ShaderCanvas } from '../shader/ShaderCanvas';
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
    AssembledScreen,
    FormScope,
    Layer,
    Screen,
    Surface,
    Context,
    /** React only: Svelte surfaces draw no shader yet, so no Svelte tree draws it. */
    ShaderCanvas,
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
  };
  const found = registry[name];
  if (!found) throw new Error(`view: no component named "${name}" (register it in src/library/view/reactComponents.ts and svelteComponents.ts)`);
  return found;
}
