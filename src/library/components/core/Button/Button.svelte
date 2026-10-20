<!--
  Button: the Svelte renderer of `buttonView` (Button.model.ts), the same markup, classes and
  attributes as `Button.tsx`; see Button.tsx for the job, the faces and the tuning knobs. The hold
  is the `hold.ts` store and the long press the `longPress` action (longPress.svelte.ts, over
  `longPress.ts`), attached through Text to the button element. `icon` is a snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromAction } from 'svelte/attachments';
  import Text from '../../../primitives/Text.svelte';
  import { buttonView, clickPresses, type ButtonModelProps } from './Button.model';
  import { createHold } from './hold';
  import { longPress } from './longPress.svelte';
  import './Button.css';

  interface Props extends ButtonModelProps {
    /** An icon before the label, or alone, drawn in the face's ink and hidden from assistive tech. */
    icon?: Snippet;
  }

  let props: Props = $props();
  const view = $derived(buttonView(props));

  let node = $state<HTMLElement | null>(null);
  const holding = createHold(
    () => node,
    () => props.onHold,
  );
  // A hold ends at once when it can't continue: disabled, or no longer a hold button...
  $effect(() => {
    if (props.disabled || !props.hold) holding.stop(true);
  });
  // ...or when the button goes away while held.
  $effect(() => () => holding.stop(false));

  /** The app's tooltip action, applied while both `tip` and `tipAction` are set. */
  const tip = (target: HTMLElement) => {
    const { tip: key, tipAction } = props;
    if (!tipAction || key === undefined) return;
    const handle = tipAction(target, key);
    return () => handle?.destroy?.();
  };
</script>

<Text
  as="button"
  {...view.text}
  bind:ref={node}
  class={view.face.className}
  {...view.face.attrs}
  onclick={(event: MouseEvent) => {
    if (clickPresses(props, event.detail)) props.onPress?.();
  }}
  onpointerdown={(event: PointerEvent) => holding.down(event, props.hold === true && !props.disabled)}
  onpointerup={(event: PointerEvent) => holding.end(event)}
  onpointercancel={(event: PointerEvent) => holding.end(event)}
  onlostpointercapture={(event: PointerEvent) => holding.end(event)}
  {@attach fromAction(longPress, () => ({ onLongPress: props.onLongPress, onLongRelease: props.onLongRelease, disabled: !view.longPress }))}
  {@attach tip}
  >{#if props.icon}<span class="yh-button__icon" data-part="icon" aria-hidden="true">{@render props.icon()}</span
    >{/if}{#if view.label !== null}<span class="yh-button__label" data-part="label">{view.label}</span>{/if}{#if view.glyph}<Text
      role="label"
      leading="tight"
      class={view.glyph.className}
      {...view.glyph.attrs}>{view.glyph.char}</Text
    >{/if}</Text
>
