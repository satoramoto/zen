<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { mathInspectorView, type MathInspectorProps } from './MathInspector.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Stack.css';
  import '../ExactValue/ExactValue.css';
  import './MathInspector.css';
  let props: MathInspectorProps = $props();
</script>
<Tree tree={mathInspectorView(props)} />
