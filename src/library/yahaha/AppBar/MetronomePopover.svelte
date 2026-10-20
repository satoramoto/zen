<!--
  MetronomePopover: the Svelte renderer of `metronomePopoverView` (MetronomePopover.model.ts), the
  same markup, classes and attributes as `MetronomePopover.tsx`; see MetronomePopover.tsx for the
  job. Esc and a press outside are the `dismiss` action (popover.svelte.ts, over `popover.ts`).
-->
<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import LampButton from '../../components/core/LampButton/LampButton.svelte';
  import LineSlider from '../../components/core/LineSlider/LineSlider.svelte';
  import SettingsRow from '../../components/core/SettingsRow/SettingsRow.svelte';
  import Text from '../../primitives/Text.svelte';
  import { isOwnKey, METRONOME_LABEL_WIDTH, metronomePopoverView, type MetronomePopoverModelProps } from './MetronomePopover.model';
  import { dismiss } from './popover.svelte';
  import './MetronomePopover.css';

  let props: MetronomePopoverModelProps = $props();
  const view = $derived(metronomePopoverView(props));
</script>

<Text
  as="div"
  class={view.className}
  {...view.attrs}
  ariaRole="dialog"
  tabindex={-1}
  onkeydown={(event: KeyboardEvent) => {
    if (isOwnKey(event.key)) event.stopPropagation();
  }}
  {@attach fromAction(dismiss, () => ({ id: view.id, onClose: props.onClose }))}
  ><Text role="label" tone="primary" class="yh-metronome-popover__title" data-part="title">Metronome</Text><SettingsRow
    id={view.rowIds.on}
    label="On/off"
    labelWidth={METRONOME_LABEL_WIDTH}
    ><LampButton
      label={view.onLabel}
      on={view.on}
      size="sm"
      name="Metronome on/off"
      tip="metronome.on"
      tipAction={props.tipAction}
      onToggle={(next: boolean) => props.onOn?.(next)}
    /></SettingsRow
  ><SettingsRow id={view.rowIds.volume} label="Volume" labelWidth={METRONOME_LABEL_WIDTH}
    ><LineSlider
      value={view.volume}
      min={0}
      max={127}
      name="Metronome volume"
      width={120}
      tip="metronome.volume"
      tipAction={props.tipAction}
      onchange={(v: number) => props.onVolume?.(v)}
    /></SettingsRow
  ><SettingsRow id={view.rowIds.bell} label="Bell on beat 1" labelWidth={METRONOME_LABEL_WIDTH}
    ><LampButton
      label={view.bellLabel}
      on={view.bell}
      size="sm"
      name="Bell on beat 1"
      tip="metronome.bell"
      tipAction={props.tipAction}
      onToggle={(next: boolean) => props.onBell?.(next)}
    /></SettingsRow
  >{#if view.note}<Text as="p" size="caption" class="yh-metronome-popover__note" data-part="note"
      >The built-in synth isn't running: the click can't sound.</Text
    >{/if}</Text
>
