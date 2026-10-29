<!--
  ArpSequencer: the model's tree (`arpSequencerView`, ArpSequencer.model.ts) drawn by the Svelte
  `Tree`, as `ArpSequencer.tsx` draws it with the React one; see ArpSequencer.tsx for the job and
  the knobs. The form is `getForm` (React's `useForm`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { ARP_SEQUENCER_FORMS } from './ArpSequencer.forms';
  import { arpSequencerHandlers, arpSequencerView, type ArpSequencerModelProps } from './ArpSequencer.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './ArpSequencer.css';

  let props: ArpSequencerModelProps = $props();
  const form = getForm(ARP_SEQUENCER_FORMS);
</script>

<Tree tree={arpSequencerView(props, form.current)} handlers={arpSequencerHandlers(props)} />
