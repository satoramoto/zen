<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { knobHandlers, knobView, type KnobProps } from './Knob.model';
  import './parameters.css';
  let props: KnobProps = $props();
</script>
<Tree tree={knobView(props)} handlers={knobHandlers(props)} />
