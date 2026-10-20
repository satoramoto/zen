<!--
  PartMarks: the Svelte renderer of `partMarksView` (PartMarks.model.ts), the same markup, classes
  and attributes as `PartMarks.tsx`; see PartMarks.tsx for the job. Nothing is drawn when no mark
  shows; the app's tooltip action lives only while one does.
-->
<script lang="ts">
  import Text from '../../../primitives/Text.svelte';
  import { partMarksView, type PartMarksModelProps } from './PartMarks.model';
  import './PartMarks.css';

  let props: PartMarksModelProps = $props();
  const view = $derived(partMarksView(props));

  /** The app's tooltip action, applied while both `tip` and `tipAction` are set. */
  const tip = (target: HTMLElement) => {
    const { tip: key, tipAction } = props;
    if (!tipAction || key === undefined) return;
    const handle = tipAction(target, key);
    return () => handle?.destroy?.();
  };
</script>

{#if view !== null}<Text size="caption" weight="strong" leading="tight" class={view.root.className} {...view.root.attrs} {@attach tip}
    >{#each view.marks as m (m.mark)}{#if m.kind === 'dot'}<span class={m.className} {...m.attrs}></span
        >{:else if m.kind === 'icon'}<svg class={m.className} {...m.attrs}
          >{#each m.paths as d (d)}<path {d} />{/each}{#if m.dot}<circle {...m.dot} />{/if}</svg
        >{:else}<Text size="inherit" leading="tight" case="label" class={m.className} {...m.attrs}>{m.word}</Text>{/if}{/each}</Text
  >{/if}
