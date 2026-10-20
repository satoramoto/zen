<!--
  SettingsRow: the model's tree (`settingsRowView`, SettingsRow.model.ts) drawn by the Svelte
  `Tree`, as `SettingsRow.tsx` draws it with the React one; see SettingsRow.tsx for the job and the
  tuning knobs. The control is the `children` snippet; ids come from `id`, else `$props.id()`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { settingsRowView, type SettingsRowModelProps } from './SettingsRow.model';
  import '../../../primitives/Text.css';
  import './SettingsRow.css';

  interface Props extends SettingsRowModelProps {
    /** The control: a lamp, a run of tabs, a slider, a readout. Its own accessible name stays its own. */
    children?: Snippet;
  }

  let { children, ...props }: Props = $props();
  const uid = $props.id();
</script>

<Tree tree={settingsRowView(props, uid)} slots={{ children }} />
