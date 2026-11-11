// The Push area's parts and stores, registered with the view tree's Svelte registry and the store
// registry when this module loads. The area's Svelte entry imports it, and so does a Storybook that
// draws the area's stories.
import { registerComponents } from '../foundation/view/svelteComponents';
import { registerStores } from '../foundation/view/stores';
import PushSurface from './layouts/Surface/Surface.svelte';
import PushRearPanel from './layouts/RearPanel/RearPanel.svelte';
import PushDevice from './layouts/Device/Device.svelte';
import PushDisplay from './layouts/Display/Display.svelte';
import PushTrace from './components/Trace/Trace.svelte';
import { pushStores } from './registry.stores';

registerComponents({ PushSurface, PushRearPanel, PushDisplay, PushTrace, PushDevice });
registerStores(pushStores());
