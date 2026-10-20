<!--
  Separator: the Svelte renderer of `separatorView` (Separator.model.ts), the same element, classes
  and attributes as `Separator.tsx`; see Separator.tsx for the job.
-->
<script lang="ts">
  import { separatorView, type SeparatorModelProps } from './Separator.model';
  import './Separator.css';

  let props: SeparatorModelProps = $props();
  const view = $derived(separatorView(props));
</script>

<span class={view.className} {...view.attrs}></span>
