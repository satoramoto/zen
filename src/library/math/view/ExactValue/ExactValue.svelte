<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { exactValueView, type ExactValueProps } from './ExactValue.model';
  import '../../../primitives/Text.css';
  import './ExactValue.css';
  let props: ExactValueProps = $props();
</script>
<Tree tree={exactValueView(props)} />
