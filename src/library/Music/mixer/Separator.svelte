<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { separatorView, type SeparatorProps } from './Separator.model';
  let props: SeparatorProps = $props();
</script>

<Tree tree={separatorView(props)} />
