import { keyed } from '../view/stores';
import { bindToggleMomentary } from './controls/Toggle.input';
import { bindSegmented } from './controls/Segmented.input';
import { bindSelect, bindSelectMenu } from './controls/Select.input';
import { bindPopup } from './controls/Popup.input';
import { bindMomentary } from './mixer/Momentary.input';
import { bindContextControls, bindContextPanel } from './mixer/ContextControls.input';
import { bindParamGesture } from './gesture/paramGesture';
import { bindNumberFieldEditor } from './controls/NumberField.input';
import { bindWake } from './controls/wake';
import { bindWaveform } from './music/Waveform.canvas';
import { bindFrameMeter, bindFramePlayhead, bindFrameWaveLane, bindFramePosition } from './mixer/frames.bind';
import { bindWaveControls } from './mixer/WaveControls.input';
import { bindStemConnections } from './mixer/StemConnections.store';
import { bindDeckHost } from './mixer/DeckStrip.host';
import { bindTransportPosition } from './music/Transport.input';

/** One set of lifecycle adapters for both renderers, with callback params resolved by handler key. */
export function musicStores() {
  return {
    musicToggleMomentary: keyed(bindToggleMomentary, ['onHold']),
    musicSegmented: keyed(bindSegmented, ['onChange']),
    musicSelect: keyed(bindSelect, ['onState', 'onChange']),
    musicSelectMenu: keyed(bindSelectMenu, ['onState', 'onChange']),
    musicPopup: keyed(bindPopup, ['anchor', 'within', 'onDismiss']),
    musicMomentary: keyed(bindMomentary, ['onHold', 'onTakeover']),
    musicContextControls: keyed(bindContextControls, ['onPress', 'onOpen']),
    musicContextPanel: keyed(bindContextPanel, ['onOpen']),
    musicParamGesture: keyed(bindParamGesture, ['onChange', 'onRelease', 'onDepth', 'onEdit']),
    musicNumberFieldEditor: keyed(bindNumberFieldEditor, ['onDraft', 'onCommit', 'onCancel']),
    musicWake: keyed(bindWake, []),
    musicWaveform: keyed(bindWaveform, []),
    musicFrameMeter: keyed(bindFrameMeter, ['sample']),
    musicFramePlayhead: keyed(bindFramePlayhead, ['readFrame']),
    musicFrameWaveLane: keyed(bindFrameWaveLane, ['readFrame']),
    musicFramePosition: keyed(bindFramePosition, ['readFrame']),
    musicWaveControls: keyed(bindWaveControls, ['readFrame', 'moveDeck', 'setFocus']),
    musicStemConnections: keyed(bindStemConnections, []),
    musicDeckHost: keyed(bindDeckHost, ['onCapture']),
    musicTransportPosition: keyed(bindTransportPosition, ['onUnit']),
  };
}
