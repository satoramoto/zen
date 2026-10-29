<!--
  XYPad: the model's tree (`xyPadView`, XYPad.model.ts) drawn by the Svelte `Tree`, as `XYPad.tsx`
  draws it with the React one; see XYPad.tsx for the job and the tuning knobs. The drag and keys are
  the `xyInput` store the tree binds (`xyInput.ts`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { XY_PAD_FORMS } from './XYPad.forms';
  import { xyPadHandlers, xyPadView, type XYPadModelProps } from './XYPad.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './XYPad.css';

  let props: XYPadModelProps = $props();
  const form = getForm(XY_PAD_FORMS, () => props.form);
</script>

<Tree tree={xyPadView(props, form.current)} handlers={xyPadHandlers(props)} />
