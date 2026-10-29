<script lang="ts">
  import MasterStrip from './MasterStrip.svelte';
  import type { MasterStripProps } from './MasterStrip.model';
  import { createMasterStripHost } from './MasterStripHost.story';

  let props: MasterStripProps = $props();
  const mixer = $derived(createMasterStripHost(props.state, props.commands));
</script>

<MasterStrip {...props} state={$mixer} commands={mixer.commands} />
