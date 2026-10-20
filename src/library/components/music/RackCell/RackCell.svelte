<!--
  RackCell: the model's tree (`rackCellView`, RackCell.model.ts) drawn by the Svelte `Tree`, as
  `RackCell.tsx` draws it with the React one; see RackCell.tsx for the job and the tuning knobs.
  `mark` is a snippet, the tree's `mark` slot.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { rackCellHandlers, rackCellView, type RackCellModelProps } from './RackCell.model';
  import '../../../primitives/Text.css';
  import './RackCell.css';

  interface Props extends RackCellModelProps {
    /** The marks after the name (the modified dot). */
    mark?: Snippet;
  }

  let { mark, ...props }: Props = $props();
</script>

<Tree tree={rackCellView(props, { mark: mark !== undefined })} slots={{ mark }} handlers={rackCellHandlers(props)} />
