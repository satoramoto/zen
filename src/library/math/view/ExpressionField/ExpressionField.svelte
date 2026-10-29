<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { expressionFieldView, expressionFieldHandlers, type ExpressionFieldProps } from './ExpressionField.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './ExpressionField.css';
  let props: ExpressionFieldProps = $props();
</script>
<Tree tree={expressionFieldView(props)} handlers={expressionFieldHandlers(props)} />
