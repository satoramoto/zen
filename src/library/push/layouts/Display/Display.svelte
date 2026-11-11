<!--
  Display: the model's tree (`displayView`, Display.model.ts) drawn by the Svelte `Tree`, as
  `Display.tsx` draws it with the React one; see Display.tsx for the job, the scale and the parts.
  The scope's facets are read here, as there, for the dark ground.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { getThemeScope } from '../../../foundation/svelte/theme.svelte';
  import { displayHandlers, displayView, type DisplayModelProps } from './Display.model';
  import '../../../primitives/Text/Text.css';
  import './Display.css';

  let props: DisplayModelProps = $props();
  const scope = getThemeScope();
</script>

<Tree tree={displayView(props, scope?.facets)} handlers={displayHandlers(props)} />
