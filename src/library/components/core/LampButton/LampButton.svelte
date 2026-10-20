<!--
  LampButton: the Svelte renderer of `lampButtonView` (LampButton.model.ts), the same markup,
  classes and attributes as `LampButton.tsx`; see LampButton.tsx for the job, the faces and the
  tuning knobs. The long press is Button's store (`longPress.ts`) as an action, attached through
  Text to the button element.
-->
<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import Text from '../../../primitives/Text.svelte';
  import { actionOf } from '../../../view/bridge';
  import { bindLongPress } from '../Button/longPress';
  import { lampButtonView, lampToggle, type LampButtonModelProps } from './LampButton.model';
  import './LampButton.css';

  const longPress = actionOf(bindLongPress);
  let props: LampButtonModelProps = $props();
  const view = $derived(lampButtonView(props));

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
  class={view.face.className}
  style={view.minWidth === undefined ? undefined : `min-width: ${view.minWidth}`}
  {...view.face.attrs}
  onclick={() => {
    const next = lampToggle(props);
    if (next !== undefined) props.onToggle?.(next);
  }}
  {@attach fromAction(longPress, () => ({ onLongPress: props.onLongPress, onLongRelease: props.onLongRelease, disabled: !view.longPress }))}
  {@attach tip}
  ><span class="yh-lampbutton__led" data-part="lamp" aria-hidden="true"></span><span class="yh-lampbutton__label" data-part="label"
    >{view.label}</span
  >{#if view.code}<Text {...view.code.text} class={view.code.className} {...view.code.attrs}>{view.code.value}</Text>{/if}</Text
>
