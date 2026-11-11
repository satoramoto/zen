// The Push area's parts by name, for the view tree's React registry (`foundation/view/reactComponents.ts`).
import { Surface as PushSurface } from './layouts/Surface/Surface';
import { RearPanel as PushRearPanel } from './layouts/RearPanel/RearPanel';
import { Display as PushDisplay } from './layouts/Display/Display';
import { Trace as PushTrace } from './components/Trace/Trace';

/** Lazy, for the same Tree and component import cycle as the main registry. */
export function pushReactComponents() {
  return { PushSurface, PushRearPanel, PushDisplay, PushTrace };
}
