<!--
  Slider: the model's tree (`sliderView`, Slider.model.ts) drawn by the Svelte `Tree`, as
  `Slider.tsx` draws it with the React one; see Slider.tsx for the job and the parts. The gesture is
  the `paramGesture` store the track binds (`../Param/paramGesture.ts`); the typed readout is the
  `sliderEntry` store (`sliderEntry.ts`), reporting its text to this component's view state.
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../../view/viewState';
  import { sliderHandlers, sliderView, type SliderEntry, type SliderModelProps } from './Slider.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './Slider.css';

  let props: SliderModelProps = $props();
  const entry = viewState<SliderEntry>(null);
  const text = fromStore(entry);
</script>

<Tree tree={sliderView(props, text.current)} handlers={sliderHandlers(props, entry.set)} />
