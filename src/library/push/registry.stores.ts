// The Push area's stores by name, for the view tree's store registry (`foundation/view/stores.ts`).
import { keyed } from '../foundation/view/stores';
import { bindSurface } from './layouts/Surface/surfaceInput';

export function pushStores() {
  return {
    pushSurface: keyed(bindSurface, ['onInput']),
  };
}
