<!--
  Panel: the model's tree (`panelView`, Panel.model.ts) drawn by the Svelte `Tree`, as `Panel.tsx` draws it with the React one.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../foundation/view/Tree.svelte';
  import { panelView, type PanelModelProps } from './Panel.model';
  import '../../primitives/Text/Text.css';
  import '../../primitives/Surface/Surface.css';
  import './Panel.css';

  interface Props extends Omit<PanelModelProps, 'aside'> {
    aside?: string | Snippet;
    actions?: Snippet;
    children?: Snippet;
  }

  let { aside, actions, children, ...props }: Props = $props();
  const asideSlot = $derived(typeof aside === 'function');
</script>

<Tree
  tree={panelView({ ...props, aside: typeof aside === 'string' ? aside : undefined }, { children: children !== undefined, actions: actions !== undefined, aside: asideSlot })}
  slots={{ children, actions, aside: asideSlot ? (aside as Snippet) : undefined }}
/>
