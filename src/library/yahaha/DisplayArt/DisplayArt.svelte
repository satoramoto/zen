<!--
  DisplayArt: the Svelte renderer of `displayArtView` (DisplayArt.model.ts), the same markup,
  classes and attributes as `DisplayArt.tsx`; see DisplayArt.tsx for the job and the tuning knobs.
-->
<script lang="ts">
  import { displayArtView, type DisplayArtModelProps } from './DisplayArt.model';
  import './DisplayArt.css';

  let props: DisplayArtModelProps = $props();
  const view = $derived(displayArtView(props));
</script>

<div class="yh-displayart" {...view.attrs}
  ><div class="yh-displayart__sun" data-part="sun"><div class="yh-displayart__disc" data-part="disc"></div></div
  ><div class="yh-displayart__hill" data-part="hill" data-hill="far"></div
  ><div class="yh-displayart__hill" data-part="hill" data-hill="near"></div
  >{#if view.fade}<div class="yh-displayart__fade" data-part="fade"></div>{/if}</div
>
