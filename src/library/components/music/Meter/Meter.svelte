<!--
  Meter: the model's tree (`meterView`, Meter.model.ts) drawn by the Svelte `Tree`, as `Meter.tsx`
  draws it with the React one; see Meter.tsx for the job and the parts. The channel is a plain
  element with Surface's attributes (no shader: it takes no layer). Svelte takes `class` for React's
  `className`.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { meterView, type MeterModelProps } from './Meter.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './Meter.css';

  interface Props extends Omit<MeterModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
</script>

<Tree tree={meterView({ ...props, className })} />
