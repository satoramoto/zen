<!--
  SettingsRow: the Svelte renderer of `settingsRowView` (SettingsRow.model.ts), the same markup,
  classes, attributes and inline style as `SettingsRow.tsx`; see SettingsRow.tsx for the job and
  the tuning knobs. The control is the `children` snippet; ids come from `id`, else `$props.id()`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Text from '../../../primitives/Text.svelte';
  import { settingsRowView, type SettingsRowModelProps } from './SettingsRow.model';
  import './SettingsRow.css';

  interface Props extends SettingsRowModelProps {
    /** The control: a lamp, a run of tabs, a slider, a readout. Its own accessible name stays its own. */
    children?: Snippet;
  }

  let { children, ...props }: Props = $props();
  const uid = $props.id();
  const view = $derived(settingsRowView(props, uid));
</script>

<Text as="div" {...view.text} class={view.root.className} {...view.root.attrs} style={view.styleText}
  ><span class={view.label.className} {...view.label.attrs}>{view.label.text}</span><span class={view.control.className} {...view.control.attrs}
    >{@render children?.()}</span
  >{#if view.hint}<span class={view.hint.className} {...view.hint.attrs}>{view.hint.text}</span>{/if}</Text
>
