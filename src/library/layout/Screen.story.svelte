<!--
  Screen's Svelte story (not shipped): the same specimen as Screen.stories.tsx, from Screen.fixtures.ts.
-->
<script lang="ts">
  import Text from '../primitives/Text.svelte';
  import Region from './Region.svelte';
  import Screen from './Screen.svelte';
  import { FOOTER_NOTE, HEADER_NOTE, screenProps, type ScreenArgs } from './Screen.fixtures';

  let args: ScreenArgs = $props();
  const props = $derived(screenProps(args));
</script>

{#snippet note(text: string)}<Text as="p" role="caption" tone="muted">{text}</Text>{/snippet}
{#snippet header()}<Region name="App bar">{@render note(HEADER_NOTE)}</Region>{/snippet}
{#snippet footer()}<Region name="Keys">{@render note(FOOTER_NOTE)}</Region>{/snippet}

<div style:height="calc(100vh - 2 * var(--space-6))">
  <Screen
    name={props.name}
    areas={props.areas}
    columns={props.columns}
    rows={props.rows}
    header={props.header ? header : undefined}
    footer={props.footer ? footer : undefined}
    ><Region name="Hero" label="Hero" area="hero">{@render note('area="hero"')}</Region><Region name="Mixer" label="Mixer" area="mixer"
      >{@render note('area="mixer"')}</Region
    ><Region name="Pads" label="Pads" area="pads">{@render note('area="pads"')}</Region></Screen
  >
</div>
