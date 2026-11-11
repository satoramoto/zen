<!--
  CodeImage: the model's tree (`codeImageView`, CodeImage.model.ts) drawn by the Svelte `Tree`, as
  `CodeImage.tsx` draws it with the React one; see CodeImage.tsx for the job.
-->
<script lang="ts">
  import Tree from '../../foundation/view/Tree.svelte';
  import { codeImageView, type CodeImageModelProps } from './CodeImage.model';
  import './CodeImage.css';

  let props: CodeImageModelProps = $props();
</script>

<Tree tree={codeImageView(props)} />
