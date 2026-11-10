<!--
  SendReadout: the model's tree (`sendReadoutView`, SendReadout.model.ts) drawn by the Svelte `Tree`,
  as `SendReadout.tsx` draws it with the React one; see SendReadout.tsx for the job. `onPress` is a prop.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { sendReadoutHandlers, sendReadoutView, type SendReadoutModelProps } from './SendReadout.model';
  import '../../../primitives/Text/Text.css';
  import './SendReadout.css';

  let props: SendReadoutModelProps = $props();
</script>

<Tree tree={sendReadoutView(props)} handlers={sendReadoutHandlers(props)} />
