<!--
  DisplayArt's Svelte story (not shipped): the art at the display's width, as DisplayArt.stories.tsx
  draws it, and with `readouts` the chord and tempo over it. ChordReadout and TempoReadout have no
  Svelte renderers yet, so their markup is written out here with the classes their React renderers
  give (static: no fitting, no tempo input); the music lane's Svelte twins replace it.
-->
<script lang="ts">
  import Text from '../../primitives/Text.svelte';
  import { focusRing } from '../../primitives/Ring';
  import '../../primitives/Surface.css';
  import '../../components/music/ChordReadout/ChordReadout.css';
  import '../../components/music/TempoReadout/TempoReadout.css';
  import DisplayArt from './DisplayArt.svelte';
  import { DISPLAY_WIDTH, UNDER_READOUTS } from './DisplayArt.fixtures';

  interface Props {
    fade?: boolean;
    /** Lay the chord and tempo readouts over the art (the UnderReadouts story). */
    readouts?: boolean;
  }

  let { fade, readouts = false }: Props = $props();
  const { chord, extension, bpm } = UNDER_READOUTS;
  const digits = String(bpm).length;
</script>

<div style:width="{DISPLAY_WIDTH}px">
  {#if readouts}
    <div style:position="relative">
      <DisplayArt {fade} />
      <div class="lib-specimens" style:position="absolute" style:inset="0" style:align-content="center" style:padding="var(--space-6)">
        <div
          class="lib-surface yh-chord-readout"
          data-material="screen"
          data-radius="control"
          data-part="window"
          role="img"
          aria-label="Chord {chord}{extension}"
          data-held="false"
        ><Text as="div" role="display" leading="snug" class="yh-chord-readout__chord" data-part="chord" data-fit="full" aria-hidden="true"
            >{chord}<Text role="display" leading="tight" class="yh-chord-readout__ext" data-part="extension">{extension}</Text></Text
          ><Text as="p" role="body" size="label" class="yh-chord-readout__line" data-part="line" aria-hidden="true" /></div>
        <div class="yh-tempo-readout" data-part="root" style:--yh-tempo-readout-digits={digits}
          ><span class="yh-tempo-readout__reading" data-part="window" data-material="screen"
            ><Text
              role="numeral"
              class="yh-tempo-readout__bpm {focusRing}"
              data-part="value"
              ariaRole="spinbutton"
              tabindex={0}
              aria-label="Tempo, BPM. Drag, scroll or use the arrow keys; double-click for the style's tempo"
              aria-valuenow={bpm}
              aria-valuemin={5}
              aria-valuemax={500}
              aria-valuetext="{bpm} BPM"
              data-tip="display.tempo">{bpm}</Text
            ><Text role="label" size="caption" weight="body" leading="tight" class="yh-tempo-readout__unit" data-part="unit" aria-hidden="true">BPM</Text
            ></span
          ><Text role="numeral" class="yh-tempo-readout__steps" data-part="steps" ariaRole="group" aria-label="Tempo"
            ><Text
              as="button"
              role="numeral"
              size="heading"
              tabular={false}
              type="button"
              class="yh-tempo-readout__step"
              data-part="step"
              data-material="key"
              aria-label="Tempo up (Scene Launch)"
              data-tip="tempo.up"><span aria-hidden="true">+</span></Text
            ><Text
              as="button"
              role="numeral"
              size="heading"
              tabular={false}
              type="button"
              class="yh-tempo-readout__step"
              data-part="step"
              data-material="key"
              aria-label="Tempo down (Function)"
              data-tip="tempo.down"><span aria-hidden="true">−</span></Text
            ></Text
          ></div>
      </div>
    </div>
  {:else}
    <DisplayArt {fade} />
  {/if}
</div>
