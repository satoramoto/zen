<!-- The app's gauge in Svelte: a binding, one Tree. -->
<script lang="ts">
  import { Tree } from '../../view-svelte';
  import { appGaugeView } from './appGauge';

  let { level }: { level: number } = $props();
</script>

<Tree tree={appGaugeView(level)} />
