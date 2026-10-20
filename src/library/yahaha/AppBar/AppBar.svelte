<!--
  AppBar: the model's tree (`appBarView`, AppBar.model.ts) drawn by the Svelte `Tree`, as
  `AppBar.tsx` draws it with the React one; see AppBar.tsx for the job, the changes and the tuning
  knobs. Focus goes back to the ▾ when the popover closes through the `focusReturn` store
  (`popover.ts`). `end` and a tab's label may be snippets.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { appBarHandlers, appBarView, type AppBarModelProps } from './AppBar.model';
  import '../../primitives/Text.css';
  import '../../primitives/Stack.css';
  import './AppBar.css';

  interface Props extends AppBarModelProps<string | Snippet> {
    /** Extra controls after the page nav, before the switches, behind a hairline of their own. */
    end?: Snippet;
  }

  let { end, ...props }: Props = $props();
</script>

<Tree tree={appBarView(props, { end: end !== undefined })} slots={{ end }} handlers={appBarHandlers(props)} />
