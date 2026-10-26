<!--
  VoteControl: the model's tree (`voteControlView`, VoteControl.model.ts) drawn by the Svelte
  `Tree`, as `VoteControl.tsx` draws it with the React one; see VoteControl.tsx for the job and the
  parts. The control's own state (the pick being saved, the last error) is view state here
  (`view/viewState.ts`).
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../../view/viewState';
  import { voteControlHandlers, voteControlState, voteControlView, type VoteControlModelProps } from './VoteControl.model';
  import '../../../primitives/Text.css';
  import './VoteControl.css';

  let props: VoteControlModelProps = $props();
  const own = viewState(voteControlState());
  const state = fromStore(own);
</script>

<Tree tree={voteControlView(props, state.current)} handlers={voteControlHandlers(props, own)} />
