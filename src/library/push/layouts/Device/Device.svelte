<!--
  Device: the model's tree (`deviceView`, Device.model.ts) drawn by the Svelte `Tree`, as
  `Device.tsx` draws it with the React one; see Device.tsx for the job. The device's own state is
  view state here (`model/device.ts`).
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../foundation/view/Tree.svelte';
  import { createDevice } from '../../model/device';
  import { deviceHandlers, deviceView, type DeviceModelProps } from './Device.model';

  let props: DeviceModelProps = $props();
  const device = createDevice(untrack(() => ({ set: props.set, state: props.initialState })));
  const snapshot = fromStore(device);
</script>

<Tree tree={deviceView(props, snapshot.current.state, performance.now())} handlers={deviceHandlers(props, device)} />
