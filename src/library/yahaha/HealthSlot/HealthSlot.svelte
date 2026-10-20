<!--
  HealthSlot: the Svelte renderer of `healthSlotView` (HealthSlot.model.ts), the same markup,
  classes and attributes as `HealthSlot.tsx`; see HealthSlot.tsx for the job and the states. The
  app's `tipAction` is attached to whichever element carries `data-tip`.
-->
<script lang="ts">
  import StatusDot from '../../components/core/StatusDot/StatusDot.svelte';
  import Text from '../../primitives/Text.svelte';
  import { healthSlotView, type HealthSlotModelProps } from './HealthSlot.model';
  import './HealthSlot.css';

  let props: HealthSlotModelProps = $props();
  const view = $derived(healthSlotView(props));

  /** The app's tooltip action, applied while both `tip` and `tipAction` are set. */
  const tip = (target: HTMLElement) => {
    const { tipAction } = props;
    const key = view.tip;
    if (!tipAction || key === undefined) return;
    const handle = tipAction(target, key);
    return () => handle?.destroy?.();
  };
</script>

{#snippet mark()}<span class="yh-health-slot__mark" data-part="mark" data-state={view.state} aria-hidden="true"
    >{#if view.state === 'trouble'}<svg class="yh-health-slot__triangle" data-part="triangle" width="12" height="12" viewBox="0 0 12 12"
        ><path d="M6 1.5 L11 10.5 H1 Z" /><path d="M6 5 V7.4" /><circle cx="6" cy="8.9" r="0.6" /></svg
      >{:else}<StatusDot hue={view.state === 'calm' ? 'ok' : 'd'} hollow={view.state === 'off'} />{/if}</span
  >{/snippet}

<Text role="label" weight="body" case="none" tabular class={view.className} {...view.attrs} style={view.styleText}
  ><span role="status" class="yh-health-slot__live" data-part="live">{view.label}</span>{#if view.target}<Text
      as="button"
      role="label"
      weight="body"
      case="none"
      tabular
      type="button"
      class="yh-health-slot__button"
      data-part="button"
      data-tip={view.tip}
      onclick={() => {
        if (view.target) props.onOpen?.(view.target);
      }}
      {@attach tip}
      >{@render mark()}<span class="yh-health-slot__text" data-part="text"
        >{#each view.words as word, i (i)}{#if word.numeral}<Text role="numeral" size="inherit" class="yh-health-slot__num" data-part="num"
              >{word.text}</Text
            >{:else}{word.text}{/if}{/each}</span
      ></Text
    >{:else}<span class="yh-health-slot__calm" data-part="calm"
      >{@render mark()}<span class="yh-health-slot__text" data-part="text" aria-hidden="true" data-tip={view.tip} {@attach tip}
        >{view.text}</span
      ></span
    >{/if}</Text
>
