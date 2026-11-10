import { Tree } from '../../../foundation/view/Tree';
import { mixerModel } from './MixerView.model';
import type { MixerViewProps } from '../../components/mixer.model';
import '../../base.css';
import '../../components/mixer.css';

export type { MixerViewProps } from '../../components/mixer.model';

/** Controlled four-deck face; playback and persistence remain entirely host-owned. */
export function MixerView(props: MixerViewProps) {
  const model = mixerModel(props);
  return <Tree tree={model.tree} handlers={model.handlers} />;
}

export default MixerView;
