<!-- Test fixture (Contain.test.tsx): a component that throws while drawing when `broken`. -->
<script lang="ts">
  let { broken = false }: { broken?: boolean } = $props();
  // svelte-ignore state_referenced_locally
  if (broken) throw new Error('boom');
</script>

<p data-part="ok">ok</p>
