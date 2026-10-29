import { Tree } from '../../view/Tree';
import { waveformView, type WaveformProps } from './Waveform.model';
import '../base.css';
import './Waveform.css';

export type { WaveformProps } from './Waveform.model';

/** Measured envelope/spectral waveform, painted by the shared musicWaveform canvas store. */
export function Waveform(props: WaveformProps) {
  return <Tree tree={waveformView(props)} />;
}
