import { Tree } from '../../view/Tree';
import { mixerModel } from './MixerView.model';
import type { MixerViewProps } from './model';
import '../base.css';
import './mixer.css';

export type { MixerViewProps } from './model';

/** Controlled four-deck face; playback and persistence remain entirely host-owned. */
export function MixerView(props: MixerViewProps) {
  const model = mixerModel(props);
  return <Tree tree={model.tree} handlers={model.handlers} />;
}

export default MixerView;
