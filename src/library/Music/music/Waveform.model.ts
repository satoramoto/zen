import { h, wire, type Node } from '../../view/Tree.model';
import type { Peak, Steps } from './levels';
import type { SpectralEnergy } from '../theme/spectral';
import type { SpectralOutlineStyle } from './spectralOutline';

/** Source-compatible props. Readings are measured data; there is no playback/analysis dependency. */
export interface WaveformProps {
  peaks: readonly Peak[] | Steps | readonly Steps[];
  from?: number;
  to?: number;
  ink: string;
  colors?: readonly string[];
  spectrum?: readonly SpectralEnergy[];
  presentation?: SpectralOutlineStyle;
  height?: number;
  density?: number;
  visibleShare?: number;
  smooth?: number;
  headroom?: number;
  samples?: readonly Float32Array[];
  className?: string;
  label?: string;
}

export function waveformView({ className, label, height = 96, ...paint }: WaveformProps): Node {
  return wire(h('canvas', {
    class: `wdg wdg-wave${className ? ` ${className}` : ''}`,
    style: `height: ${height}px`,
    role: label ? 'img' : undefined,
    'aria-label': label,
  }), { bind: [['musicWaveform', { ...paint, height }]] });
}
