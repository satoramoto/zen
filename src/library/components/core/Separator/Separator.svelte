<!--
  Separator: the model's tree (`separatorView`, Separator.model.ts) drawn by the Svelte `Tree`, as
  `Separator.tsx` draws it with the React one; see Separator.tsx for the job.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { separatorView, type SeparatorModelProps } from './Separator.model';
  import './Separator.css';

  let props: SeparatorModelProps = $props();
</script>

<Tree tree={separatorView(props)} />
