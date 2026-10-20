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
  import Tree from '../../view/Tree.svelte';
  import { stageHandlers, stageView, type StageModelProps } from './Stage.model';
  import { createStageState } from './stageState';
  import './Stage.css';

  let props: StageModelProps<string | Snippet> = $props();

  const state = createStageState();
  const current = fromStore(state);
  const p = scopePrinciples();
  const handlers = $derived(stageHandlers(props, state));
</script>

<Tree tree={stageView(props, current.current, p.current.plate.inset)} {handlers} />
