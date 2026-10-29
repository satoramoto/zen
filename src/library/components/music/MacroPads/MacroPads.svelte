<!--
  MacroPads: the model's tree (`macroPadsView`, MacroPads.model.ts) drawn by the Svelte `Tree`, as
  `MacroPads.tsx` draws it with the React one; see MacroPads.tsx for the job and the tuning knobs.
  Each pad is XYPad's tree, drawn inline; its drag is the `xyInput` store.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { MACRO_PADS_FORMS } from './MacroPads.forms';
  import { macroPadsHandlers, macroPadsView, type MacroPadsModelProps } from './MacroPads.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import '../XYPad/XYPad.css';
  import './MacroPads.css';

  let props: MacroPadsModelProps = $props();
  const form = getForm(MACRO_PADS_FORMS, () => props.form);
</script>

<Tree tree={macroPadsView(props, form.current)} handlers={macroPadsHandlers(props)} />
