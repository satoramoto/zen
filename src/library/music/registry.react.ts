import { Button as MusicButton } from './components/Button/Button';
import { Scope as MusicScope } from './components/Scope/Scope';
import { ButtonFace as MusicButtonFace } from './components/ButtonFace/ButtonFace';
import { Toggle as MusicToggle } from './components/Toggle/Toggle';
import { Segmented as MusicSegmented } from './components/Segmented/Segmented';
import { Select as MusicSelect } from './components/Select/Select';
import { Popup as MusicPopup } from './components/Popup/Popup';
import { Label as MusicLabel, Divider as MusicDivider } from './components/Label/Label';
import { Knob as MusicKnob } from './components/Knob/Knob';
import { Slider as MusicSlider } from './components/Slider/Slider';
import { NumberField as MusicNumberField } from './components/NumberField/NumberField';
import { Widget as MusicWidget } from './components/Widget/Widget';
import { Meter as MusicMeter } from './components/Meter/Meter';
import { Waveform as MusicWaveform } from './components/Waveform/Waveform';
import { Transport as MusicTransport } from './components/Transport/Transport';
import { ContextControls as MusicContextControls, PhonesIcon as MusicPhonesIcon, PowerIcon as MusicPowerIcon } from './components/ContextControls/ContextControls';
import { Momentary as MusicMomentary } from './components/Momentary/Momentary';
import { Separator as MusicSeparator, MixerSection as MusicMixerSection } from './components/Separator/Separator';
import { KnobStack as MusicKnobStack } from './components/KnobStack/KnobStack';
import { StemConnections as MusicStemConnections } from './components/StemConnections/StemConnections';
import { FrameMeter as MusicFrameMeter, FramePlayhead as MusicFramePlayhead, FrameWaveform as MusicFrameWaveform } from './components/Frames/frames';
import { WaveControls as MusicWaveControls } from './components/WaveControls/WaveControls';
import { DeckStrip as MusicDeckStrip } from './components/DeckStrip/DeckStrip';
import { MasterStrip as MusicMasterStrip } from './components/MasterStrip/MasterStrip';
import { MixerView as MusicMixerView } from './layouts/MixerView/MixerView';
import { RigHealth as MusicRigHealth } from './live/components/RigHealth/RigHealth';
import { ChordCompass as MusicChordCompass } from './live/components/ChordCompass/ChordCompass';
import { LandingDial as MusicLandingDial } from './live/components/LandingDial/LandingDial';
import { SetlistRiver as MusicSetlistRiver } from './live/components/SetlistRiver/SetlistRiver';
import { PushTwin as MusicPushTwin } from './live/components/PushTwin/PushTwin';
import { OrbitClock as MusicOrbitClock } from './live/components/OrbitClock/OrbitClock';
import { SignalSpine as MusicSignalSpine } from './live/components/SignalSpine/SignalSpine';
import { ProgressionStrip as MusicProgressionStrip } from './live/components/ProgressionStrip/ProgressionStrip';
import { CutPads as MusicCutPads } from './live/components/CutPads/CutPads';
import { ControlPanel as MusicControlPanel } from './live/layouts/ControlPanel/ControlPanel';
import { SectionBar as MusicSectionBar } from './live/components/SectionBar/SectionBar';
import { StemDeck as MusicStemDeck } from './live/components/StemDeck/StemDeck';
import { SongCard as MusicSongCard } from './live/components/SongCard/SongCard';
import { DicePad as MusicDicePad } from './live/components/DicePad/DicePad';
import { ThrowPads as MusicThrowPads } from './live/components/ThrowPads/ThrowPads';
import { LaunchGrid as MusicLaunchGrid } from './live/components/LaunchGrid/LaunchGrid';
import { TrackStrips as MusicTrackStrips } from './live/components/TrackStrips/TrackStrips';

/** Lazy for the same Tree ↔ component import cycle as Zen's main registry. */
export function musicReactComponents() {
  return {
    MusicScope,
    MusicButton, MusicButtonFace, MusicToggle, MusicSegmented, MusicSelect, MusicPopup, MusicLabel, MusicDivider,
    MusicKnob, MusicSlider, MusicNumberField, MusicWidget, MusicMeter, MusicWaveform, MusicTransport,
    MusicContextControls, MusicPhonesIcon, MusicPowerIcon, MusicMomentary, MusicSeparator, MusicMixerSection,
    MusicKnobStack, MusicStemConnections, MusicFrameMeter, MusicFramePlayhead, MusicFrameWaveform, MusicWaveControls,
    MusicDeckStrip, MusicMasterStrip, MusicMixerView,
    MusicRigHealth, MusicTrackStrips, MusicLaunchGrid, MusicThrowPads, MusicCutPads, MusicControlPanel, MusicSectionBar, MusicStemDeck, MusicSongCard, MusicDicePad, MusicProgressionStrip, MusicSignalSpine, MusicOrbitClock, MusicPushTwin, MusicSetlistRiver, MusicLandingDial, MusicChordCompass,
  };
}
