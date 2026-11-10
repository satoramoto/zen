<!--
  LevelMeter: the model's tree (`meterView`, LevelMeter.model.ts) drawn by the Svelte `Tree`, as `LevelMeter.tsx`
  draws it with the React one; see LevelMeter.tsx for the job and the parts. The channel is a plain
  element with Surface's attributes (no shader: it takes no layer). Svelte takes `class` for React's
  `className`.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { meterView, type LevelMeterModelProps } from './LevelMeter.model';
  import '../../../primitives/Text/Text.css';
  import '../../../primitives/Surface/Surface.css';
  import './LevelMeter.css';

  interface Props extends Omit<LevelMeterModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
</script>

<Tree tree={meterView({ ...props, className })} />
