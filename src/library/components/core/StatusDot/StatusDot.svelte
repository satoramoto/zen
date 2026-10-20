<!--
  StatusDot: the Svelte renderer of `statusDotView` (StatusDot.model.ts), the same element, classes,
  attributes and inline style as `StatusDot.tsx`; see StatusDot.tsx for the job and the tuning knobs.
-->
<script lang="ts">
  import { statusDotView, type StatusDotModelProps } from './StatusDot.model';
  import './StatusDot.css';

  let props: StatusDotModelProps = $props();
  const view = $derived(statusDotView(props));
</script>

<span class={view.className} {...view.attrs} style={view.styleText}></span>
