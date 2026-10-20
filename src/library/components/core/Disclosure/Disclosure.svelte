<!--
  Disclosure: the model's tree (`disclosureView`, Disclosure.model.ts) drawn by the Svelte `Tree`,
  as `Disclosure.tsx` draws it with the React one; see Disclosure.tsx for the job and the parts. Its
  own value (unless `expanded` owns it) is view state here (`music/viewState.ts`).
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../music/viewState';
  import { disclosureHandlers, disclosureView, type DisclosureModelProps } from './Disclosure.model';
  import '../Toggle/size.css';
  import './Disclosure.css';

  let props: DisclosureModelProps = $props();
  const own = viewState(untrack(() => props.defaultExpanded ?? false));
  const value = fromStore(own);
</script>

<Tree tree={disclosureView(props, value.current)} handlers={disclosureHandlers(props, value.current, own.set)} />
