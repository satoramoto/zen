<!--
  RearPanel: the model's tree (`rearPanelView`, RearPanel.model.ts) drawn by the Svelte `Tree`, as
  `RearPanel.tsx` draws it with the React one; see RearPanel.tsx for the job and the parts.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { rearPanelHandlers, rearPanelView, type RearPanelModelProps } from './RearPanel.model';
  import '../../../primitives/Text/Text.css';
  import './RearPanel.css';

  let props: RearPanelModelProps = $props();
</script>

<Tree tree={rearPanelView(props)} handlers={rearPanelHandlers(props)} />
