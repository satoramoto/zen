<!--
  Group: the model's tree (`groupView`, Group.model.ts) drawn by the Svelte `Tree`, as `Group.tsx`
  draws it with the React one; see Group.tsx for the job. `label` and `aside` are text or snippets.
  `toolbar` sets the control context (control.svelte.ts) to the toolbar's for what's inside.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../view/Tree.svelte';
  import { CONTROL_TOOLBAR, getControlContext, setControlContext } from '../primitives/control.svelte';
  import { groupView, type GroupModelProps } from './Group.model';
  import { isSlotContent } from './Region.model';
  import '../primitives/Stack.css';
  import '../primitives/Text.css';
  import './Group.css';

  interface Props extends Omit<GroupModelProps, 'className'> {
    /** A visible label; `false` hides it (the name stays for assistive tech). */
    label?: string | Snippet | false;
    /** Header content on the right: a page switch, a count. */
    aside?: string | Snippet;
    class?: string;
    style?: string;
    children?: Snippet;
  }

  let { label, aside, toolbar = false, class: className, style, children, ...props }: Props = $props();

  // A toolbar asks for the quiet look; otherwise the surrounding cluster's look holds.
  const outer = getControlContext();
  setControlContext({
    get quiet() {
      return toolbar ? CONTROL_TOOLBAR.quiet : outer.quiet;
    },
  });
</script>

<Tree
  tree={groupView(
    {
      ...props,
      toolbar,
      className,
      style,
      label: typeof label === 'string' || label === false ? label : undefined,
      aside: typeof aside === 'string' ? aside : undefined,
    },
    { label: isSlotContent(label), aside: isSlotContent(aside) },
  )}
  slots={{ label: typeof label === 'function' ? label : undefined, aside: typeof aside === 'function' ? aside : undefined, children }}
/>
