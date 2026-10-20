<!--
  Fader: the model's tree (`faderView`, Fader.model.ts) drawn by the Svelte `Tree`, as `Fader.tsx`
  draws it with the React one; see Fader.tsx for the job and the tuning knobs. The drag, keys and
  wheel are the `faderInput` store the tree binds (`faderInput.ts`), the tooltip the `tip` store.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { faderHandlers, faderView, type FaderModelProps } from './Fader.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './Fader.css';

  let props: FaderModelProps = $props();
</script>

<Tree tree={faderView(props)} handlers={faderHandlers(props)} />
