<!--
  ChordStrip: the model's tree (`chordStripView`, ChordStrip.model.ts) drawn by the Svelte `Tree`,
  as `ChordStrip.tsx` draws it with the React one; see ChordStrip.tsx for the job and the knobs.
  The form is `getForm` (React's `useForm`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { CHORD_STRIP_FORMS } from './ChordStrip.forms';
  import { chordStripHandlers, chordStripView, type ChordStripModelProps } from './ChordStrip.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './ChordStrip.css';

  let props: ChordStripModelProps = $props();
  const form = getForm(CHORD_STRIP_FORMS);
</script>

<Tree tree={chordStripView(props, form.current)} handlers={chordStripHandlers(props)} />
