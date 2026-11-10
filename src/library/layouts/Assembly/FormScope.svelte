<!--
  FormScope: React's `FormProvider` in Svelte. Hands `form` (and each part's form) to every
  component inside through `setFormContext` (forms.svelte.ts); draws no element.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setFormContext } from './forms.svelte';

  interface Props {
    form: string;
    parts?: Readonly<Record<string, string>>;
    children?: Snippet;
  }

  let { form, parts, children }: Props = $props();

  setFormContext(() => ({ form, parts }));
</script>

{@render children?.()}
