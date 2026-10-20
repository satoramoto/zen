<!--
  Stage: the model's tree (Stage.model.ts) drawn by the Svelte `Tree`, as `Stage.tsx` draws it with
  the React one; see Stage.tsx for the job. The plate's inset comes from the nearest ThemeScope
  (`scopePrinciples`), and the Stage's own state (the last placement, the taps) is one
  `createStageState` per mounted screen (`stageState.ts`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import { scopePrinciples } from '../../layout/assembly/principles.svelte';
  import type { Placed } from '../../layout/assembly/types';
  import Screen from '../../layout/Screen.svelte';
  import Tree from '../../view/Tree.svelte';
  import { stageFrame, stageHandlers, stageRegions, stageScreen, type StageModelProps } from './Stage.model';
  import { createStageState } from './stageState';
  import './Stage.css';

  let props: StageModelProps<string | Snippet> = $props();

  const state = createStageState();
  const current = fromStore(state);
  const p = scopePrinciples();
  const handlers = $derived(stageHandlers(props, state));
  const regions = $derived(stageRegions(props, current.current, p.current.plate.inset));
  const screen = $derived(stageScreen(props));
</script>

<!-- The seam: the layout's `Screen` takes a `regions` record, so the screen is drawn here by hand;
     once it draws its regions as slots by id, this is `<Tree tree={stageView(props, current.current, inset)} {handlers} />`. -->
{#snippet region(_form: string, placed: Placed)}<Tree tree={regions[placed.id as keyof typeof regions]} {handlers} />{/snippet}
{#snippet drawn()}<Screen name="Stage" class="yh-stage__screen" spec={screen.spec} room={screen.room} onPlacement={handlers.placement} regions={Object.fromEntries(Object.keys(regions).map((id) => [id, region]))} />{/snippet}
<Tree tree={stageFrame(props)} slots={{ screen: drawn }} />