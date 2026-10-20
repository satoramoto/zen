<!--
  SoundCell: the model's tree (`soundCellView`, SoundCell.model.ts) drawn by the Svelte `Tree`, as
  `SoundCell.tsx` draws it with the React one; see SoundCell.tsx for the job and the tuning knobs.
  `marks` is a snippet, the tree's `marks` slot.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { soundCellHandlers, soundCellView, type SoundCellModelProps } from './SoundCell.model';
  import '../../../primitives/Text.css';
  import './SoundCell.css';

  interface Props extends SoundCellModelProps {
    /** The marks after the sound's name (the part's marks). */
    marks?: Snippet;
  }

  let { marks, ...props }: Props = $props();
</script>

<Tree tree={soundCellView(props, { marks: marks !== undefined })} slots={{ marks }} handlers={soundCellHandlers(props)} />
