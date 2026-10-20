<!--
  TempoReadout: the Svelte renderer of `tempoReadoutView` (TempoReadout.model.ts), the same markup,
  classes and attributes as `TempoReadout.tsx`; see TempoReadout.tsx for the job and the tuning
  knobs. The drag, wheel, keys and + / − holds are the `tempoNumber` and `tempoStep` actions
  (tempoGestures.svelte.ts, over `tempoGestures.ts`), attached through Text to their elements.
-->
<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import Text from '../../../primitives/Text.svelte';
  import { styleText, tempoReadoutView, type TempoReadoutModelProps } from './TempoReadout.model';
  import { applyTip } from './tempoGestures';
  import { tempoNumber, tempoStep } from './tempoGestures.svelte';
  import './TempoReadout.css';

  let props: TempoReadoutModelProps = $props();
  const view = $derived(tempoReadoutView(props));

  /** The app's tooltip action on a node with `key`, while `tipAction` is set. */
  const tip = (key: () => string) => (node: HTMLElement) => applyTip(node, props.tipAction, key());
</script>

<div class={view.root.className} {...view.root.attrs} style={styleText(view.root.style)}
  ><span class={view.window.className} {...view.window.attrs}
    ><Text
      {...view.value.text}
      class={view.value.className}
      {...view.value.attrs}
      {@attach fromAction(tempoNumber, () => ({ bpm: props.bpm, min: props.min, max: props.max, onTempo: props.onTempo, onReset: props.onReset }))}
      {@attach tip(() => view.value.tip)}>{view.value.label}</Text
    ><Text {...view.unit.text} class={view.unit.className} {...view.unit.attrs}>{view.unit.label}</Text
    ></span
  ><Text {...view.steps.text} class={view.steps.className} {...view.steps.attrs}
    ><Text
      as="button"
      {...view.plus.text}
      class={view.plus.className}
      {...view.plus.attrs}
      {@attach fromAction(tempoStep, () => ({ report: props.onPlus }))}
      {@attach tip(() => view.plus.tip)}><span aria-hidden="true">{view.plus.glyph}</span></Text
    ><Text
      as="button"
      {...view.minus.text}
      class={view.minus.className}
      {...view.minus.attrs}
      {@attach fromAction(tempoStep, () => ({ report: props.onMinus }))}
      {@attach tip(() => view.minus.tip)}><span aria-hidden="true">{view.minus.glyph}</span></Text
    ></Text
  ></div>
