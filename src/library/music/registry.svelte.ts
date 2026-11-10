import MusicButton from './components/Button/Button.svelte';
import MusicScope from './components/Scope/Scope.svelte';
import MusicButtonFace from './components/ButtonFace/ButtonFace.svelte';
import MusicToggle from './components/Toggle/Toggle.svelte';
import MusicSegmented from './components/Segmented/Segmented.svelte';
import MusicSelect from './components/Select/Select.svelte';
import MusicPopup from './components/Popup/Popup.svelte';
import MusicLabel from './components/Label/Label.svelte';
import MusicDivider from './components/Label/LabelDivider.svelte';
import MusicKnob from './components/Knob/Knob.svelte';
import MusicSlider from './components/Slider/Slider.svelte';
import MusicNumberField from './components/NumberField/NumberField.svelte';
import MusicWidget from './components/Widget/Widget.svelte';
import MusicMeter from './components/Meter/Meter.svelte';
import MusicWaveform from './components/Waveform/Waveform.svelte';
import MusicTransport from './components/Transport/Transport.svelte';
import MusicContextControls from './components/ContextControls/ContextControls.svelte';
import MusicPhonesIcon from './components/ContextControls/ContextControlsPhonesIcon.svelte';
import MusicPowerIcon from './components/ContextControls/ContextControlsPowerIcon.svelte';
import MusicMomentary from './components/Momentary/Momentary.svelte';
import MusicSeparator from './components/Separator/Separator.svelte';
import MusicMixerSection from './components/Separator/SeparatorSection.svelte';
import MusicKnobStack from './components/KnobStack/KnobStack.svelte';
import MusicStemConnections from './components/StemConnections/StemConnections.svelte';
import MusicFrameMeter from './components/Frames/frames.FrameMeter.svelte';
import MusicFramePlayhead from './components/Frames/frames.FramePlayhead.svelte';
import MusicFrameWaveform from './components/Frames/frames.FrameWaveform.svelte';
import MusicWaveControls from './components/WaveControls/WaveControls.svelte';
import MusicDeckStrip from './components/DeckStrip/DeckStrip.svelte';
import MusicMasterStrip from './components/MasterStrip/MasterStrip.svelte';
import MusicMixerView from './layouts/MixerView/MixerView.svelte';
import MusicRigHealth from './live/components/RigHealth/RigHealth.svelte';
import MusicChordCompass from './live/components/ChordCompass/ChordCompass.svelte';
import MusicLandingDial from './live/components/LandingDial/LandingDial.svelte';
import MusicSetlistRiver from './live/components/SetlistRiver/SetlistRiver.svelte';
import MusicPushTwin from './live/components/PushTwin/PushTwin.svelte';
import MusicOrbitClock from './live/components/OrbitClock/OrbitClock.svelte';
import MusicSignalSpine from './live/components/SignalSpine/SignalSpine.svelte';
import MusicProgressionStrip from './live/components/ProgressionStrip/ProgressionStrip.svelte';
import MusicCutPads from './live/components/CutPads/CutPads.svelte';
import MusicControlPanel from './live/layouts/ControlPanel/ControlPanel.svelte';
import MusicSectionBar from './live/components/SectionBar/SectionBar.svelte';
import MusicStemDeck from './live/components/StemDeck/StemDeck.svelte';
import MusicSongCard from './live/components/SongCard/SongCard.svelte';
import MusicDicePad from './live/components/DicePad/DicePad.svelte';
import MusicThrowPads from './live/components/ThrowPads/ThrowPads.svelte';
import MusicLaunchGrid from './live/components/LaunchGrid/LaunchGrid.svelte';
import MusicTrackStrips from './live/components/TrackStrips/TrackStrips.svelte';

export function musicSvelteComponents() {
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
