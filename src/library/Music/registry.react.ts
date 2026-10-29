import { Button as MusicButton } from './controls/Button';
import { Scope as MusicScope } from './Scope';
import { ButtonFace as MusicButtonFace } from './controls/ButtonFace';
import { Toggle as MusicToggle } from './controls/Toggle';
import { Segmented as MusicSegmented } from './controls/Segmented';
import { Select as MusicSelect } from './controls/Select';
import { Popup as MusicPopup } from './controls/Popup';
import { Label as MusicLabel, Divider as MusicDivider } from './controls/Label';
import { Knob as MusicKnob } from './controls/Knob';
import { Slider as MusicSlider } from './controls/Slider';
import { NumberField as MusicNumberField } from './controls/NumberField';
import { Widget as MusicWidget } from './controls/Widget';
import { Meter as MusicMeter } from './music/Meter';
import { Waveform as MusicWaveform } from './music/Waveform';
import { Transport as MusicTransport } from './music/Transport';
import { ContextControls as MusicContextControls, PhonesIcon as MusicPhonesIcon, PowerIcon as MusicPowerIcon } from './mixer/ContextControls';
import { Momentary as MusicMomentary } from './mixer/Momentary';
import { Separator as MusicSeparator, MixerSection as MusicMixerSection } from './mixer/Separator';
import { KnobStack as MusicKnobStack } from './mixer/KnobStack';
import { StemConnections as MusicStemConnections } from './mixer/StemConnections';
import { FrameMeter as MusicFrameMeter, FramePlayhead as MusicFramePlayhead, FrameWaveform as MusicFrameWaveform } from './mixer/frames';
import { WaveControls as MusicWaveControls } from './mixer/WaveControls';
import { DeckStrip as MusicDeckStrip } from './mixer/DeckStrip';
import { MasterStrip as MusicMasterStrip } from './mixer/MasterStrip';
import { MixerView as MusicMixerView } from './mixer/MixerView';

/** Lazy for the same Tree ↔ component import cycle as Zen's main registry. */
export function musicReactComponents() {
  return {
    MusicScope,
    MusicButton, MusicButtonFace, MusicToggle, MusicSegmented, MusicSelect, MusicPopup, MusicLabel, MusicDivider,
    MusicKnob, MusicSlider, MusicNumberField, MusicWidget, MusicMeter, MusicWaveform, MusicTransport,
    MusicContextControls, MusicPhonesIcon, MusicPowerIcon, MusicMomentary, MusicSeparator, MusicMixerSection,
    MusicKnobStack, MusicStemConnections, MusicFrameMeter, MusicFramePlayhead, MusicFrameWaveform, MusicWaveControls,
    MusicDeckStrip, MusicMasterStrip, MusicMixerView,
  };
}
