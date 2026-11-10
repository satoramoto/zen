import { keyed } from '../foundation/view/stores';
import { bindToggleMomentary } from './components/Toggle/Toggle.input';
import { bindSegmented } from './components/Segmented/Segmented.input';
import { bindSelect, bindSelectMenu } from './components/Select/Select.input';
import { bindPopup } from './components/Popup/Popup.input';
import { bindMomentary } from './components/Momentary/Momentary.input';
import { bindContextControls, bindContextPanel } from './components/ContextControls/ContextControls.input';
import { bindParamGesture } from './model/gesture/paramGesture';
import { bindNumberFieldEditor } from './components/NumberField/NumberField.input';
import { bindWake } from './model/wake';
import { bindWaveform } from './components/Waveform/Waveform.canvas';
import { bindFrameMeter, bindFramePlayhead, bindFrameWaveLane, bindFramePosition } from './components/Frames/frames.bind';
import { bindWaveControls } from './components/WaveControls/WaveControls.input';
import { bindStemConnections } from './components/StemConnections/StemConnections.store';
import { bindDeckHost } from './components/DeckStrip/DeckStrip.host';
import { bindSeekBar } from './components/SeekBar/SeekBar.input';
import { bindTransportPosition } from './components/Transport/Transport.input';
import { bindFrameVar } from './live/frame.bind';
import { bindCellDrag } from './live/layouts/ControlPanel/cellDrag';
import { bindTouch } from './live/touch.bind';

/** One set of lifecycle adapters for both renderers, with callback params resolved by handler key. */
export function musicStores() {
  return {
    musicSeekBar: keyed(bindSeekBar, ['onSeek']),
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
    liveFrameVar: keyed(bindFrameVar, ['sample']),
    liveCellDrag: keyed(bindCellDrag, ['onPreview', 'onCommit']),
    liveTouch: keyed(bindTouch, ['onTouch']),
  };
}
