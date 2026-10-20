<!--
  SectionName: the model's tree (`sectionNameView`, SectionName.model.ts) drawn by the Svelte
  `Tree`, as `SectionName.tsx` draws it with the React one; see SectionName.tsx for the job and the
  tuning knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { sectionNameView, type SectionNameModelProps } from './SectionName.model';
  import '../../../primitives/Text.css';
  import './SectionName.css';

  let props: SectionNameModelProps = $props();
</script>

<Tree tree={sectionNameView(props)} />
