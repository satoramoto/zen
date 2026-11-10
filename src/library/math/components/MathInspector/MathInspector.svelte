<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { mathInspectorView, type MathInspectorProps } from './MathInspector.model';
  import '../../../primitives/Text/Text.css';
  import '../../../primitives/Stack/Stack.css';
  import '../ExactValue/ExactValue.css';
  import './MathInspector.css';
  let props: MathInspectorProps = $props();
</script>
<Tree tree={mathInspectorView(props)} />
