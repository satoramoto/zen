<!--
  OneTouchPicker: the model's roots (`oneTouchPickerView`, OneTouchPicker.model.ts) drawn by the
  Svelte `Tree`, as `OneTouchPicker.tsx` draws them with the React one; see OneTouchPicker.tsx for
  the job. In `cells` the caption and the numbers are top-level siblings, no wrapper.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { oneTouchPickerHandlers, oneTouchPickerView, type OneTouchPickerProps } from './OneTouchPicker.model';
  import '../../primitives/Text.css';
  import './OneTouchPicker.css';

  let props: OneTouchPickerProps = $props();
</script>

<Tree tree={oneTouchPickerView(props)} handlers={oneTouchPickerHandlers(props)} />
