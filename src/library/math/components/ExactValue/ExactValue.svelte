<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { exactValueView, type ExactValueProps } from './ExactValue.model';
  import '../../../primitives/Text/Text.css';
  import './ExactValue.css';
  let props: ExactValueProps = $props();
</script>
<Tree tree={exactValueView(props)} />
