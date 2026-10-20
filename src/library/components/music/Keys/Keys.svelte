<!--
  Keys: the Svelte renderer of `keysView` (Keys.model.ts), the same markup, classes and attributes
  as `Keys.tsx`; see Keys.tsx for the job, the width and the tuning knobs. The input is the
  `keysInput.ts` store (its handlers on the handle and the pick surface, its Esc while armed), the
  measured width the `fillWidth` action (fillWidth.svelte.ts, over `fillWidth.ts`).
-->
<script lang="ts">
  import Text from '../../../primitives/Text.svelte';
  import { styleText } from '../../../theme.model';
  import { KEYS_TIP, keysView, type KeysModelProps } from './Keys.model';
  import { bindPickEscape, createKeysInput } from './keysInput';
  import { fillWidth } from './fillWidth.svelte';
  import './Keys.css';

  let props: KeysModelProps = $props();
  let measured = $state(0);
  const view = $derived(keysView(props, measured));

  let strip = $state<HTMLElement | null>(null);
  const input = createKeysInput(
    () => ({ settings: view.settings, onSplit: props.onSplit, onPick: props.onPick }),
    () => strip,
  );

  // Esc while armed disarms, and only that: caught first so the app's Esc doesn't also leave the screen.
  $effect(() => {
    if (!view.armed) return;
    const binding = bindPickEscape(window, { armed: true, onPick: (next) => props.onPick?.(next) });
    return () => binding.destroy();
  });

  /** The app's tooltip, on the handle. */
  const tip = (target: HTMLElement) => {
    const { tipAction } = props;
    if (!tipAction) return;
    const result = tipAction(target, KEYS_TIP);
    return () => result?.destroy?.();
  };
</script>

<div
  class={view.root.className}
  style={styleText(view.root.style)}
  {...view.root.attrs}
  use:fillWidth={{ on: view.fill, onWidth: (width) => (measured = width) }}
  >{#if view.ruler}<div class="yh-keys__ruler" data-part="ruler" aria-hidden="true"
      >{#each view.ruler.zones as zone (zone.side)}<div class="yh-keys__zone" {...zone.attrs} style={styleText(zone.style)}
          ><Text role="body" size="label" case="label" class="yh-keys__part" data-part="zone-name">{zone.name}</Text
          >{#if zone.hint}<Text role="body" size="label" class="yh-keys__hint" data-part="hint"
              >Press a key to set the split · Esc cancels</Text
            >{:else if zone.held !== null}<Text role="body" weight="strong" tabular class="yh-keys__held" data-part="held"
              >{zone.held}</Text
            >{/if}</div
        >{/each}{#if view.ruler.marker}<Text
          role="body"
          size="label"
          weight="strong"
          tabular
          class="yh-keys__marker"
          data-part="marker"
          style={styleText(view.ruler.marker.style)}>{view.ruler.marker.text}</Text
        >{/if}</div
    >{/if}<div class="yh-keys__body" data-part="body"
    ><div class="yh-keys__strip" {...view.strip.attrs} bind:this={strip}
      >{#each view.whites as key (key.note)}<Text
          as="div"
          {...key.text}
          class="yh-keys__white"
          {...key.attrs}
          style={styleText(key.style)}>{key.label}</Text
        >{/each}{#each view.blacks as key (key.note)}<div class="yh-keys__black" {...key.attrs} style={styleText(key.style)}></div
        >{/each}{#if view.split}<div class="yh-keys__split" {...view.split.attrs}
          ><span class="yh-keys__split-top" data-part="split-top"></span
          >{#if view.split.join}<span class="yh-keys__split-join" data-part="split-join"></span
            >{/if}<span class="yh-keys__split-bottom" data-part="split-bottom"></span
          ></div
        >{/if}</div
    >{#if view.pick}<div
        class="yh-keys__pick"
        data-part="pick"
        aria-hidden="true"
        onpointerdown={input.pickDown}
        onpointermove={input.pickMove}
        onpointerup={input.pickUp}
        onpointercancel={input.pickCancel}
      ></div
      >{/if}</div
  >{#if view.handle}<!-- svelte-ignore a11y_no_noninteractive_tabindex (its role, slider, comes from the view's attrs) --><span
      class="yh-keys__handle"
      tabindex="0"
      {...view.handle.attrs}
      style={styleText(view.handle.style)}
      onkeydown={input.handleKey}
      onpointerdown={input.handleDown}
      onpointermove={input.handleMove}
      onpointerup={input.handleUp}
      onpointercancel={input.handleCancel}
      {@attach tip}
      ><Text role="body" size="label" weight="strong" leading="tight" tabular class="yh-keys__flag" data-part="flag"
        ><span class="yh-keys__grip" data-part="grip" aria-hidden="true"></span>{view.handle.text}</Text
      ></span
    >{/if}</div
>
