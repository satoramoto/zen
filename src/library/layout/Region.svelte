<!--
  Region: the model's tree (`regionView`, Region.model.ts) drawn by the Svelte `Tree`, as
  `Region.tsx` draws it with the React one; see Region.tsx for the job. `label` and `aside` are
  text or snippets.

  Views: React's `Region.View` children are `views` here, one item per view (its id, tab label,
  name, disabled, tip). The header then shows their `Tabs` and the body is the chosen view's
  tabpanel, rendering `children` with the chosen id. With `view` the choice is the caller's
  (`bind:view` works too); without, the region keeps its own (`defaultView`, else the first), a
  local store the handlers write.
-->
<script module lang="ts">
  import type { Snippet } from 'svelte';
  import type { TabItemModel } from './Tabs.model';

  /** One view of a region: its tab. The body is the region's `children`, given the chosen id. */
  export type RegionViewItem = TabItemModel<string | Snippet>;
</script>

<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../view/Tree.svelte';
  import type { TipAction } from '../view/tip';
  import { localState } from './local';
  import { isSlotContent, regionHandlers, regionInitialView, regionView, regionViewSlot, type RegionModelProps } from './Region.model';
  import '../primitives/Text.css';
  import './Region.css';

  interface Props extends Omit<RegionModelProps, 'className'> {
    /** A visible header label; omit for a region that needs none. */
    label?: string | Snippet;
    /** Header content on the right: a second switch (a `Tabs`), a count. */
    aside?: string | Snippet;
    /** The views: the header shows a tab per view and the body the chosen one. */
    views?: RegionViewItem[];
    /** The chosen view's id (controlled). Without it the region keeps its own choice. */
    view?: string;
    /** The first view shown when uncontrolled; default the first. */
    defaultView?: string;
    /** Called with the id a tab asks for. */
    onView?: (id: string) => void;
    /** The app's tooltip action, passed to the views' tabs. */
    tipAction?: TipAction;
    class?: string;
    style?: string;
    /** The body; with views, called with the chosen view's id. */
    children?: Snippet<[string | undefined]>;
  }

  let {
    name,
    label,
    aside,
    area,
    gap,
    fit,
    views = [],
    view = $bindable(),
    defaultView,
    onView,
    tipAction,
    class: className,
    style,
    children,
  }: Props = $props();

  const uid = $props.id();
  // svelte-ignore state_referenced_locally
  const own = localState(regionInitialView(views, defaultView));
  const chosen = fromStore(own);
  const text = (value: string | Snippet | undefined) => (typeof value === 'string' ? value : undefined);
  const snippet = (value: string | Snippet | undefined) => (typeof value === 'string' ? undefined : value);
  // Every view's body is `children`: the tree's `SlotCall` renders it with the chosen view's id.
  const slots = $derived({
    label: snippet(label),
    aside: snippet(aside),
    children: children as Snippet | undefined,
    ...Object.fromEntries(views.map((v) => [regionViewSlot(v.id), children as Snippet | undefined])),
  });
</script>

<Tree
  tree={regionView(
    { name, area, gap, fit, className, style, views, view, tipAction, label: text(label), aside: text(aside) },
    { label: isSlotContent(label), aside: isSlotContent(aside) },
    { uid, own: chosen.current },
  )}
  {slots}
  handlers={regionHandlers({ view, onView, tipAction }, own, uid)}
/>
