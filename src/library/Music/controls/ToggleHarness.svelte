<script lang="ts">
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../view/Tree.svelte';
  import { viewState } from '../../view/viewState';
  import { pressableHostHandlers, pressableHostInitial, pressableHostView, type PressableHarnessProps } from './ToggleHarness.model';
  import Toggle from './Toggle.svelte';
  import Segmented from './Segmented.svelte';
  import Select from './Select.svelte';
  import Momentary from '../mixer/Momentary.svelte';
  import { pressableHostStores } from './ToggleHarness.input';
  import './pressables.css';
  let props: PressableHarnessProps = $props();
  const state = viewState(pressableHostInitial(untrack(() => props)));
  const view = fromStore(state);
  const components = { MusicToggle: Toggle, MusicSegmented: Segmented, MusicSelect: Select, MusicMomentary: Momentary };
</script>

<Tree tree={pressableHostView(props, view.current)} handlers={pressableHostHandlers(props, state.get, state.set)} stores={pressableHostStores} components={name => components[name as keyof typeof components]} />
