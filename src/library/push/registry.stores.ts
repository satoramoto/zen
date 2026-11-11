// The Push area's stores by name, for the view tree's store registry (`foundation/view/stores.ts`).
import { keyed } from '../foundation/view/stores';
import { bindSurface } from './layouts/Surface/surfaceInput';
import { bindLifetime } from './layouts/Device/lifetime';
import { bindFrameMeter } from './layouts/Display/frameMeter';
import { bindHandle } from './screens/Emulator/handle';

export function pushStores() {
  return {
    pushSurface: keyed(bindSurface, ['onInput']),
    pushLifetime: keyed(bindLifetime, ['onGone']),
    pushFrameMeter: keyed(bindFrameMeter, ['frame']),
    pushEmulatorHandle: keyed(bindHandle, ['getSet', 'change', 'intents', 'remove']),
  };
}
