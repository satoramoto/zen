<!--
  MixBand: the model's tree (`mixBandView`, MixBand.model.ts) drawn by the Svelte `Tree`, as
  `MixBand.tsx` draws it with the React one; see MixBand.tsx for the job, the forms and the knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { MIX_BAND_FORMS } from './MixBand.forms';
  import { mixBandHandlers, mixBandView, type MixBandModelProps } from './MixBand.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import '../../music/Fader/Fader.css';
  import '../../music/Meter/Meter.css';
  import '../../core/LampButton/LampButton.css';
  import '../SendBars/SendBars.css';
  import './MixBand.css';

  interface Props extends Omit<MixBandModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(MIX_BAND_FORMS);
</script>

<Tree tree={mixBandView({ ...props, className }, form.current)} handlers={mixBandHandlers(props)} />
