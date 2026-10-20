<!--
  Region: the Svelte renderer of `regionView` (Region.model.ts), the same section, header and body
  as `Region.tsx`; see Region.tsx for the job. `label` and `aside` are text or snippets.

  Views: React's `Region.View` children are `views` here, one item per view (its id, tab label,
  name, disabled, tip). The header then shows their `Tabs` and the body is the chosen view's
  tabpanel, rendering `children` with the chosen id. With `view` the choice is the caller's
  (`bind:view` works too); without, the region keeps its own (`defaultView`, else the first).
-->
<script module lang="ts">
  import type { Snippet } from 'svelte';
  import type { TabItemModel } from './Tabs.model';

  /** One view of a region: its tab. The body is the region's `children`, given the chosen id. */
  export type RegionViewItem = TabItemModel<string | Snippet>;
</script>

<script lang="ts">
  import Text from '../primitives/Text.svelte';
  import Tabs from './Tabs.svelte';
  import type { TipAction } from './Tabs.model';
  import { chosenView, regionBodyView, regionHasHead, regionIds, regionView, type RegionModelProps } from './Region.model';
  import { styleString } from './style';
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
  const ids = regionIds(uid);
  // svelte-ignore state_referenced_locally
  let own = $state(defaultView ?? views[0]?.id);
  const tabbed = $derived(views.length > 0);
  const chosen = $derived(chosenView(views, view, own));

  const choose = (id: string) => {
    if (view === undefined) own = id;
    onView?.(id);
  };

  const root = $derived(regionView({ name, area, fit, className }, tabbed));
  const body = $derived(regionBodyView(gap, tabbed ? { panelId: ids.panel, tabId: chosen ? ids.tab(chosen.id) : undefined } : undefined));
</script>

<section class={root.className} {...root.attrs} style={styleString(root.style, style)}>{#if regionHasHead(label, aside, tabbed)}<header class="lib-region__head" data-part="head">{#if label}<Text size="caption" weight="strong" case="label" class="lib-region__label">{#if typeof label === 'string'}{label}{:else}{@render label()}{/if}</Text>{/if}{#if tabbed && chosen}<Tabs
          {name}
          items={views}
          value={chosen.id}
          onChange={choose}
          panelId={ids.panel}
          tabId={ids.tab}
          {tipAction}
        />{/if}{#if aside}<span class="lib-region__aside">{#if typeof aside === 'string'}{aside}{:else}{@render aside()}{/if}</span>{/if}</header>{/if}<div class={body.className} {...body.attrs}>{@render children?.(tabbed ? chosen?.id : undefined)}</div></section>
