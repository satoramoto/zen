<!--
  Display: the model's tree (`displayView`, Display.model.ts) drawn by the Svelte `Tree`, as
  `Display.tsx` draws it with the React one; see Display.tsx for the job and the tuning knobs. The
  form comes from `getForm`/`getChosenForm` (the assembled screen) and, for `density="auto"`, the
  measured width (`wideState`, written by the `displayWide` store through `onWide`).
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import { getChosenForm, getForm } from '../../layout/assembly/forms.svelte';
  import Tree from '../../view/Tree.svelte';
  import { DISPLAY_FORMS } from './Display.forms';
  import { displayHandlers, displayView, type DisplayModelProps } from './Display.model';
  import { wideState } from './wide';
  import '../../primitives/Stack.css';
  import '../../primitives/Text.css';
  import './Display.css';

  let props: DisplayModelProps = $props();

  // The form: the `form` prop, then the assembled screen's choice, then `density` (auto: the width).
  const fromScreen = getForm(DISPLAY_FORMS, () => props.form);
  const chosen = getChosenForm();
  const wide = wideState();
  const isWide = fromStore(wide);
</script>

<Tree tree={displayView(props, { fromScreen: fromScreen.current, chosen: chosen.current }, isWide.current)} handlers={displayHandlers(props, wide)} />
