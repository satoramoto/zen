<!--
  AssembledScreen: the Svelte renderer of `assembledView` (AssembledScreen.model.ts), the same
  root, bands, room, zones and slots as `AssembledScreen.tsx`; see AssembledScreen.tsx for the job.
  The room is measured by `measureRoom` (room.svelte.ts), the principles come from the nearest
  ThemeScope (`scopePrinciples`, principles.svelte.ts), and each slot hands its form to what's
  inside through `FormScope` (`getForm`, forms.svelte.ts). A region's content is a snippet given
  the chosen form and the placed region.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Surface from '../../primitives/Surface.svelte';
  import { styleString } from '../style';
  import { assemble } from './assemble';
  import { assembledView, type SlotView } from './AssembledScreen.model';
  import FormScope from './FormScope.svelte';
  import { scopePrinciples } from './principles.svelte';
  import { measureRoom } from './room.svelte';
  import type { Placed, Placement, Principles, ScreenSpec } from './types';
  import './Assembly.css';

  interface Props {
    /** The screen's accessible name. */
    name: string;
    spec: ScreenSpec;
    /** What goes in each region, by id: a snippet given the chosen form and the placed region. */
    regions?: Record<string, Snippet<[string, Placed]>>;
    /** The room in px. Unset, the screen measures its own box (1440 × 900 where nothing measures). */
    room?: { w: number; h: number };
    /** The solver's principles. Unset: the nearest ThemeScope's. */
    principles?: Principles;
    /** Called with each new placement. */
    onPlacement?: (placement: Placement) => void;
    class?: string;
    style?: string;
  }

  let { name, spec, regions = {}, room: given, principles, onPlacement, class: className, style }: Props = $props();

  const room = measureRoom(() => given);
  const p = scopePrinciples(() => principles);
  const placement = $derived(assemble(spec, room.current, p.current));
  $effect(() => {
    onPlacement?.(placement);
  });
  const view = $derived(assembledView(name, spec, placement, className));
</script>

{#snippet slot({ id, placed, attrs, style: decls, glass }: SlotView)}<div class="lib-assembled__slot" {...attrs} style={styleString(decls)}>{#if glass}<Surface layer="float" radius="none" class="lib-assembled__glass" aria-hidden="true" />{/if}<FormScope form={placed.form} parts={placed.parts}>{@render regions[id]?.(placed.form, placed)}</FormScope></div>{/snippet}

<div {@attach room.attach} class={view.className} {...view.attrs} style={styleString({}, style)}>{#each view.bands as band, i (i)}<Surface layer="ground" radius="none" class="lib-assembled__band" data-part="band" aria-hidden="true" style={styleString(band)} />{/each}<div class="lib-assembled__room" {...view.room.attrs} style={styleString(view.room.style)}>{#if view.header}<div class="lib-assembled__zone" data-part="header" style={styleString(view.header.style)}>{#each view.header.slots as s (s.id)}{@render slot(s)}{/each}</div>{/if}<div class="lib-assembled__zone" data-part="body" style={styleString(view.body.style)}><div class="lib-assembled__body" data-part="grid" style={styleString(view.body.gridStyle)}>{#each view.body.slots as s (s.id)}{@render slot(s)}{/each}</div></div>{#if view.footer}<div class="lib-assembled__zone" data-part="footer" style={styleString(view.footer.style)}>{#each view.footer.slots as s (s.id)}{@render slot(s)}{/each}</div>{/if}</div></div>
