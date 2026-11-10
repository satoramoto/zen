<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { deckStripModel, type DeckStripProps } from './DeckStrip.model';
  let props: DeckStripProps = $props();
  let view = $derived(deckStripModel(props));
</script>

<Tree {...view} />
