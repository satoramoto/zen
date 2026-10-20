<!--
  MetronomePopover: the model's tree (`metronomePopoverView`, MetronomePopover.model.ts) drawn by the
  Svelte `Tree`, as `MetronomePopover.tsx` draws it with the React one; see MetronomePopover.tsx for
  the job. Esc and a press outside are the `dismiss` store (`popover.ts`).
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { metronomePopoverHandlers, metronomePopoverView, type MetronomePopoverModelProps } from './MetronomePopover.model';
  import '../../primitives/Text.css';
  import './MetronomePopover.css';

  let props: MetronomePopoverModelProps = $props();
</script>

<Tree tree={metronomePopoverView(props)} handlers={metronomePopoverHandlers(props)} />
