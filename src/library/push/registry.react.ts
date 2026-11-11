// The Push area's parts and stores, registered with the view tree's React registry and the store
// registry when this module loads. The area's entry imports it, and so does a Storybook that draws
// the area's stories.
import { registerComponents } from '../foundation/view/reactComponents';
import { registerStores } from '../foundation/view/stores';
import { Surface as PushSurface } from './layouts/Surface/Surface';
import { RearPanel as PushRearPanel } from './layouts/RearPanel/RearPanel';
import { Device as PushDevice } from './layouts/Device/Device';
import { Display as PushDisplay } from './layouts/Display/Display';
import { Trace as PushTrace } from './components/Trace/Trace';
import { pushStores } from './registry.stores';

registerComponents({ PushSurface, PushRearPanel, PushDisplay, PushTrace, PushDevice });
registerStores(pushStores());
