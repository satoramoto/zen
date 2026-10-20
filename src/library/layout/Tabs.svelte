<!--
  Tabs: the model's tree (`tabsView`, Tabs.model.ts) drawn by the Svelte `Tree`, as `Tabs.tsx`
  draws it with the React one; see Tabs.tsx for the job and the behaviour. A label is a string or
  a snippet (drawn in the slot `label:<id>`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../view/Tree.svelte';
  import { tabsHandlers, tabsSlots, tabsView, type TabsModelProps } from './Tabs.model';
  import '../primitives/Text.css';
  import './Tabs.css';

  let props: TabsModelProps<string | Snippet> = $props();
</script>

<Tree tree={tabsView(props)} slots={tabsSlots(props.items)} handlers={tabsHandlers(props)} />
