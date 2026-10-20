<!--
  Checkbox: the model's tree (`checkboxView`, Checkbox.model.ts) drawn by the Svelte `Tree`, as
  `Checkbox.tsx` draws it with the React one; see Checkbox.tsx for the job and the parts. The label
  is the `children` snippet; an uncontrolled input's starting state is the `checkDefault` store.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { checkboxHandlers, checkboxView, type CheckModelProps } from './Checkbox.model';
  import '../../../primitives/Text.css';
  import '../Toggle/size.css';
  import './Checkbox.css';

  interface Props extends CheckModelProps {
    /** The label beside the box; without one, give `aria-label`. */
    children?: Snippet;
  }

  let { children, ...props }: Props = $props();
</script>

<Tree tree={checkboxView(props, { label: children !== undefined })} slots={{ children }} handlers={checkboxHandlers(props)} />
