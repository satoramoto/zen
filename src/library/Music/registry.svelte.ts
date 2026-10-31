import MusicButton from './controls/Button.svelte';
import MusicScope from './Scope.svelte';
import MusicButtonFace from './controls/ButtonFace.svelte';
import MusicToggle from './controls/Toggle.svelte';
import MusicSegmented from './controls/Segmented.svelte';
import MusicSelect from './controls/Select.svelte';
import MusicPopup from './controls/Popup.svelte';
import MusicLabel from './controls/Label.svelte';
import MusicDivider from './controls/LabelDivider.svelte';
import MusicKnob from './controls/Knob.svelte';
import MusicSlider from './controls/Slider.svelte';
import MusicNumberField from './controls/NumberField.svelte';
import MusicWidget from './controls/Widget.svelte';
import MusicMeter from './music/Meter.svelte';
import MusicWaveform from './music/Waveform.svelte';
import MusicTransport from './music/Transport.svelte';
import MusicContextControls from './mixer/ContextControls.svelte';
import MusicPhonesIcon from './mixer/ContextControlsPhonesIcon.svelte';
import MusicPowerIcon from './mixer/ContextControlsPowerIcon.svelte';
import MusicMomentary from './mixer/Momentary.svelte';
import MusicSeparator from './mixer/Separator.svelte';
import MusicMixerSection from './mixer/SeparatorSection.svelte';
import MusicKnobStack from './mixer/KnobStack.svelte';
import MusicStemConnections from './mixer/StemConnections.svelte';
import MusicFrameMeter from './mixer/frames.FrameMeter.svelte';
import MusicFramePlayhead from './mixer/frames.FramePlayhead.svelte';
import MusicFrameWaveform from './mixer/frames.FrameWaveform.svelte';
import MusicWaveControls from './mixer/WaveControls.svelte';
import MusicDeckStrip from './mixer/DeckStrip.svelte';
import MusicMasterStrip from './mixer/MasterStrip.svelte';
import MusicMixerView from './mixer/MixerView.svelte';
import MusicRigHealth from './live/RigHealth/RigHealth.svelte';
import MusicChordCompass from './live/ChordCompass/ChordCompass.svelte';
import MusicLandingDial from './live/LandingDial/LandingDial.svelte';
import MusicSetlistRiver from './live/SetlistRiver/SetlistRiver.svelte';
import MusicPushTwin from './live/PushTwin/PushTwin.svelte';
import MusicOrbitClock from './live/OrbitClock/OrbitClock.svelte';
import MusicSignalSpine from './live/SignalSpine/SignalSpine.svelte';
import MusicProgressionStrip from './live/ProgressionStrip/ProgressionStrip.svelte';
import MusicCutPads from './live/CutPads/CutPads.svelte';
import MusicSectionBar from './live/SectionBar/SectionBar.svelte';
import MusicStemDeck from './live/StemDeck/StemDeck.svelte';
import MusicThrowPads from './live/ThrowPads/ThrowPads.svelte';
import MusicLaunchGrid from './live/LaunchGrid/LaunchGrid.svelte';
import MusicTrackStrips from './live/TrackStrips/TrackStrips.svelte';

export function musicSvelteComponents() {
  return {
    MusicScope,
    MusicButton, MusicButtonFace, MusicToggle, MusicSegmented, MusicSelect, MusicPopup, MusicLabel, MusicDivider,
    MusicKnob, MusicSlider, MusicNumberField, MusicWidget, MusicMeter, MusicWaveform, MusicTransport,
    MusicContextControls, MusicPhonesIcon, MusicPowerIcon, MusicMomentary, MusicSeparator, MusicMixerSection,
    MusicKnobStack, MusicStemConnections, MusicFrameMeter, MusicFramePlayhead, MusicFrameWaveform, MusicWaveControls,
    MusicDeckStrip, MusicMasterStrip, MusicMixerView,
    MusicRigHealth, MusicTrackStrips, MusicLaunchGrid, MusicThrowPads, MusicCutPads, MusicSectionBar, MusicStemDeck, MusicProgressionStrip, MusicSignalSpine, MusicOrbitClock, MusicPushTwin, MusicSetlistRiver, MusicLandingDial, MusicChordCompass,
  };
}
