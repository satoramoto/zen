<!--
  Tabs: the Svelte renderer of `tabsView` (Tabs.model.ts), the same markup, classes and attributes
  as `Tabs.tsx`; see Tabs.tsx for the job and the behaviour. The keyboard is the model's `nextTab`;
  each tab's tooltip is the app's `tipAction`, attached through Text. A label is a string or a snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Text from '../primitives/Text.svelte';
  import { nextTab, tabNode, tabsView, type TabsModelProps, type TabView } from './Tabs.model';
  import './Tabs.css';

  type Props = TabsModelProps<string | Snippet>;

  let props: Props = $props();
  const view = $derived(tabsView(props));

  let list = $state<HTMLDivElement | null>(null);

  const keyDown = (event: KeyboardEvent) => {
    const next = nextTab(props.items, props.value, event.key);
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    props.onChange?.(next);
    tabNode(list, view, next)?.focus();
  };

  /** The app's tooltip action on a tab, applied while both its `tip` and `tipAction` are set. */
  const tip = (tab: TabView<string | Snippet>) => (target: HTMLElement) => {
    const { tipAction } = props;
    if (!tipAction || tab.tip === undefined) return;
    const handle = tipAction(target, tab.tip);
    return () => handle?.destroy?.();
  };
</script>

<div bind:this={list} class={view.list.className} {...view.list.attrs} onkeydown={keyDown}
  >{#each view.tabs as tab (tab.id)}<Text
      as="button"
      {...tab.text}
      class={tab.face.className}
      {...tab.face.attrs}
      tabindex={tab.tabIndex}
      onclick={() => {
        if (tab.choosable) props.onChange?.(tab.id);
      }}
      {@attach tip(tab)}
      >{#if typeof tab.label === 'string'}{tab.label}{:else}{@render tab.label()}{/if}</Text
    >{/each}</div
>
