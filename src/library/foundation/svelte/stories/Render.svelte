<!--
  Story and parity helper (not shipped): renders `component` with `props`, a string `children` as
  its text, so a fixture's instance draws in Svelte exactly as `createElement(component, props)` in React.
-->
<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    component: Component<any>;
    props?: Record<string, unknown>;
  }

  let { component: Drawn, props = {} }: Props = $props();
  const text = $derived(typeof props.children === 'string' ? props.children : undefined);
  const rest = $derived(Object.fromEntries(Object.entries(props).filter(([name]) => name !== 'children')));
</script>

{#if text !== undefined}<Drawn {...rest}>{text}</Drawn>{:else}<Drawn {...rest} />{/if}
