<!--
  OneTouchPicker: the Svelte renderer of `oneTouchPickerView` (OneTouchPicker.model.ts), the same
  markup, classes and attributes as `OneTouchPicker.tsx`; see OneTouchPicker.tsx for the job. In
  `cells` the caption and the numbers are top-level siblings, no wrapper. Each number runs the
  tooltip action with its own key through an attachment.
-->
<script lang="ts">
  import Text from '../../primitives/Text.svelte';
  import { oneTouchPickerView, type OneTouchPickerProps } from './OneTouchPicker.model';
  import './OneTouchPicker.css';

  let props: OneTouchPickerProps = $props();
  const view = $derived(oneTouchPickerView(props));

  /** The app's tooltip action on one number, with that number's key. */
  const tip = (key: string) => (target: HTMLElement) => {
    const { tipAction } = props;
    if (!tipAction) return;
    const handle = tipAction(target, key);
    return () => handle?.destroy?.();
  };
</script>

{#snippet label()}<Text {...view.label.text} class={view.label.className} {...view.label.attrs}>{view.label.word}</Text>{/snippet}
{#snippet buttons()}{#each view.numbers as number (number.n)}<Text
      {...view.numberText}
      as="button"
      class={number.className}
      {...number.attrs}
      disabled={number.disabled}
      onclick={() => props.onApply?.(number.n)}
      {@attach tip(number.tip)}>{number.n}</Text
    >{/each}{/snippet}

{#if view.cells}{@render label()}{@render buttons()}{:else}<div class={view.root.className} {...view.root.attrs}
    >{@render label()}<span class={view.strip.className} {...view.strip.attrs}>{@render buttons()}</span></div
  >{/if}
