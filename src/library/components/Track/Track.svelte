<!--
  Track: the model's tree (`trackView`, Track.model.ts) drawn by the Svelte `Tree`, as `Track.tsx` draws it with the React one.
-->
<script lang="ts">
  import Tree from '../../foundation/view/Tree.svelte';
  import { trackView, type TrackModelProps } from './Track.model';
  import '../../primitives/Text/Text.css';
  import './Track.css';

  let props: TrackModelProps = $props();
</script>

<Tree tree={trackView(props)} />
