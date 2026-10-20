<!--
  ChordReadout: the model's tree (`chordReadoutView`, ChordReadout.model.ts) drawn by the Svelte
  `Tree`, as `ChordReadout.tsx` draws it with the React one; see ChordReadout.tsx for the job and
  the tuning knobs. The hero's fit is the `chordFit` store the tree binds (`fit.ts`), reporting to
  this component's view state; the fingering's tooltip is the `tip` store.
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../viewState';
  import { chordReadoutHandlers, chordReadoutView, type ChordReadoutModelProps } from './ChordReadout.model';
  import type { Fit } from './fit';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './ChordReadout.css';

  let props: ChordReadoutModelProps = $props();
  const fit = viewState<Fit>('full');
  const step = fromStore(fit);
</script>

<Tree tree={chordReadoutView(props, step.current)} handlers={chordReadoutHandlers(props, fit.set)} />
