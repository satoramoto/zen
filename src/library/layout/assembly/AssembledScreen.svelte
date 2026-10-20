<!--
  AssembledScreen: the model's tree (`assembledScreenView`, AssembledScreen.model.ts) drawn by the
  Svelte `Tree`, as `AssembledScreen.tsx` draws it with the React one; see AssembledScreen.tsx for
  the job. The measured room is a local state (`localState`) the `room` store writes, read with
  `fromStore`; the principles come from the nearest ThemeScope (`scopePrinciples`,
  principles.svelte.ts). Each region's content is a snippet given the chosen form and the placed
  region, rendered with them by the tree's slot (its arguments), inside the `FormScope` the tree wraps it in:
  the `region:<id>` prop (a model's tree passes it so), else `regions[id]`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../view/Tree.svelte';
  import { localState } from '../local';
  import { assembledPlacement, assembledScreenHandlers, assembledScreenView, regionContent, regionFills, type RegionSlotName } from './AssembledScreen.model';
  import { scopePrinciples } from './principles.svelte';
  import type { RoomSize } from './room';
  import type { Placed, Placement, Principles, ScreenSpec } from './types';
  import '../../primitives/Surface.css';
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
    /** The root's class, as Screen's tree passes it (`class` wins). */
    className?: string;
    style?: string;
    /** A region's content by its slot's name (`regionSlot(id)`, as a model's tree fills it); it
     *  wins over `regions[id]`. */
    [region: RegionSlotName]: Snippet<[string, Placed]> | undefined;
  }

  let { name, spec, regions, room: given, principles, onPlacement, class: cls, className, style, ...byId }: Props = $props();

  const room = localState<RoomSize | null>(null);
  const measured = fromStore(room);
  const scope = scopePrinciples(() => principles);
  const model = $derived({ name, spec, room: given, className: cls ?? className, style });
  const placement = $derived(assembledPlacement(model, { room: measured.current, principles: scope.current }));
  // Each region's snippet as is: the tree's slot renders it with the form and the placed region.
  const slots = $derived(regionFills(placement, (id) => regionContent<Snippet<[string, Placed]> | undefined>(byId, regions, id)));
</script>

<Tree tree={assembledScreenView(model, placement)} {slots} handlers={assembledScreenHandlers({ onPlacement }, placement, room)} />
