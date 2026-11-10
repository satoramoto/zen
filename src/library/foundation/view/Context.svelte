<!--
  A context a tree provides to what it draws inside, by name, as `Context.tsx` does in React: the
  registered `Context` component. `control` sets the controls' look (control.svelte.ts), followed
  live; `surface` the Workspace's mode round each pane (surfaceMode.svelte.ts); `opaque` marks an Opaque scope (opaqueScope.svelte.ts: no Surface inside draws a shader). (React's `form` is
  `FormScope.svelte` here.) Draws no element.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setControlContext, type ControlContextValue } from '../../primitives/control.svelte';
  import { setOpaque } from '../../primitives/opaqueScope.svelte';
  import { setSurfaceMode } from '../../layouts/Workspace/surfaceMode.svelte';
  import type { SurfaceMode } from '../../layouts/Workspace/surfaceMode';

  interface Props {
    /** The context's name (`control`, `opaque`). */
    name: string;
    /** What it provides: plain data. */
    value: unknown;
    children?: Snippet;
  }

  let { name, value, children }: Props = $props();

  // svelte-ignore state_referenced_locally
  if (name === 'control') {
    setControlContext({
      get quiet() {
        return (value as ControlContextValue).quiet;
      },
    });
  } else if (name === 'opaque') {
    if (value) setOpaque();
  } else if (name === 'surface') {
    setSurfaceMode(() => value as SurfaceMode);
  } else {
    throw new Error(`view: no context named "${name}" (add it to src/library/foundation/view/Context.tsx and Context.svelte)`);
  }
</script>

{@render children?.()}
