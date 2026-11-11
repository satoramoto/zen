// The Push area's parts by name, for the view tree's Svelte registry (`foundation/view/svelteComponents.ts`).
import PushSurface from './layouts/Surface/Surface.svelte';
import PushRearPanel from './layouts/RearPanel/RearPanel.svelte';
import PushDevice from './layouts/Device/Device.svelte';
import PushDisplay from './layouts/Display/Display.svelte';
import PushTrace from './components/Trace/Trace.svelte';

export function pushSvelteComponents() {
  return { PushSurface, PushRearPanel, PushDisplay, PushTrace, PushDevice };
}
