<!--
  Tabs' Svelte story (not shipped): Tabs holding its own choice, as Tabs.stories.tsx's demo does,
  so a click or a key moves it (and `onChange` still logs).
-->
<script lang="ts">
  import Tabs from './Tabs.svelte';
  import type { TabsModelProps } from './Tabs.model';

  let { value, onChange, ...rest }: TabsModelProps = $props();
  let chosen = $derived(value);
</script>

<Tabs
  {...rest}
  value={chosen}
  onChange={(id: string) => {
    chosen = id;
    onChange?.(id);
  }}
/>
