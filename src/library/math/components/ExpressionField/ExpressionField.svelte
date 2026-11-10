<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { expressionFieldView, expressionFieldHandlers, type ExpressionFieldProps } from './ExpressionField.model';
  import '../../../primitives/Text/Text.css';
  import '../../../primitives/Surface/Surface.css';
  import './ExpressionField.css';
  let props: ExpressionFieldProps = $props();
</script>
<Tree tree={expressionFieldView(props)} handlers={expressionFieldHandlers(props)} />
