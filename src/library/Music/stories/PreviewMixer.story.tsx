import type { MixerViewProps } from '../mixer/model';
import { MixerView } from '../mixer/MixerView';
import { usePreviewMixer } from './usePreviewMixer';

/** React-only stateful story harness. The production face still has both renderer bindings. */
export function PreviewMixer({ externalTransport, theme }: Pick<MixerViewProps, 'externalTransport' | 'theme'>) {
  const mixer = usePreviewMixer();
  return <MixerView {...mixer} theme={theme} externalTransport={externalTransport} />;
}
