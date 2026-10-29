<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { knobStackView, type KnobStackProps } from './KnobStack.model';
  let { count = 4, stems = false, full = false, ...knobs }: KnobStackProps & { [slot: `knob${number}`]: Snippet } = $props();
</script>

<Tree tree={knobStackView({ count, stems, full })} slots={knobs} />
