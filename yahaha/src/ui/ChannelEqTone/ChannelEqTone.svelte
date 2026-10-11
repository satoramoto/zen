<!--
  ChannelEqTone: the Channel page's EQ & Tone tab body (docs/specs/push/Channel.md, Groups › B and
  D's Play rows, fitted to the display box's 1110×240 body): four 264px columns, 18px apart. Column
  1 the EQ (low and high shelf gain and frequency), columns 2–3 the Tone (eight offsets on the
  sound, 64 the voice's own), column 4 Play (Mono, Portamento time with its own on/off switch, Octave, Bend range). A Style part
  has no tone or play: those rows are shown, not editable. Neutral controls draw in `--neutral`,
  which the open part's hue takes. Controlled: every edit goes out through `onchange`.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import BarReadout from '../BarReadout/BarReadout.svelte'
  import { HIGH_STEPS, LOW_STEPS } from '../BarReadout/bar'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import Stepper from '../Stepper/Stepper.svelte'
  import { sectionHue } from '../Settings/hues'
  import type { ChannelChange, ChannelData, ToneId } from '../Channel/types'

  type Props = {
    /** Everything the Channel page shows; this tab reads the part's EQ, tone and play settings. */
    data: ChannelData
    /** The app's `use:tip` action, passed in by the wiring and applied to every control with a tooltip. */
    tipAction?: Action<HTMLElement, string>
    /** Called with each change asked for (eq, tone, mono, portamento on/off and time, octave, bend). */
    onchange?: (change: ChannelChange) => void
  }

  let { data, tipAction, onchange }: Props = $props()

  type ToneRow = { control: ToneId; label: string; tip: string }
  /** The Tone rows, left column then right. */
  const TONE: ToneRow[][] = [
    [
      { control: 'cutoff', label: 'Cutoff', tip: 'mixer.channel.tone.cutoff' },
      { control: 'resonance', label: 'Resonance', tip: 'mixer.channel.tone.resonance' },
      { control: 'attack', label: 'Attack', tip: 'mixer.channel.tone.attack' },
      { control: 'decay', label: 'Decay', tip: 'mixer.channel.tone.decay' },
    ],
    [
      { control: 'release', label: 'Release', tip: 'mixer.channel.tone.release' },
      { control: 'vibratoDepth', label: 'Vibrato', tip: 'mixer.channel.tone.vibrato_depth' },
      { control: 'vibratoRate', label: 'Vib rate', tip: 'mixer.channel.tone.vibrato_rate' },
      { control: 'vibratoDelay', label: 'Vib delay', tip: 'mixer.channel.tone.vibrato_delay' },
    ],
  ]

  const eq = $derived(data.eq)
  const tone = $derived(data.tone)
  const play = $derived(data.play)
  const octaveLabel = $derived(play === null ? '—' : play.octave > 0 ? `+${play.octave}` : play.octave < 0 ? `−${-play.octave}` : '0')
  const bend = $derived(play?.bend ?? null)

  function change(c: ChannelChange) {
    onchange?.(c)
  }
</script>

<div class="eqtone" style={data.hue ? sectionHue(data.hue) : undefined}>
  <section class="group" aria-labelledby="channel-eq">
    <GroupHeader title="EQ" level={3} id="channel-eq" />
    <div class="body">
      <BarReadout
        label="Low"
        value={eq.lowGain}
        min={-12}
        max={12}
        kind="db"
        bipolar
        default={0}
        tip="mixer.strip.eq_low_gain"
        {tipAction}
        onchange={(value) => change({ type: 'eq', field: 'lowGain', value })}
      />
      <BarReadout
        label="Low freq"
        value={eq.lowFreq}
        min={LOW_STEPS[0]}
        max={LOW_STEPS[LOW_STEPS.length - 1]}
        steps={LOW_STEPS}
        kind="hz"
        default={80}
        tip="mixer.strip.eq_low_freq"
        {tipAction}
        onchange={(value) => change({ type: 'eq', field: 'lowFreq', value })}
      />
      <BarReadout
        label="High"
        value={eq.highGain}
        min={-12}
        max={12}
        kind="db"
        bipolar
        default={0}
        tip="mixer.strip.eq_high_gain"
        {tipAction}
        onchange={(value) => change({ type: 'eq', field: 'highGain', value })}
      />
      <BarReadout
        label="High freq"
        value={eq.highFreq}
        min={HIGH_STEPS[0]}
        max={HIGH_STEPS[HIGH_STEPS.length - 1]}
        steps={HIGH_STEPS}
        kind="hz"
        default={10000}
        tip="mixer.strip.eq_high_freq"
        {tipAction}
        onchange={(value) => change({ type: 'eq', field: 'highFreq', value })}
      />
    </div>
  </section>

  <section class="group tone" aria-labelledby="channel-tone">
    <GroupHeader title="Tone" detail={tone ? 'offsets on the sound' : "the style's voice"} level={3} id="channel-tone" />
    <div class="pair">
      {#each TONE as column, i (i)}
        <div class="body">
          {#each column as row (row.control)}
            <BarReadout
              label={row.label}
              value={tone?.[row.control] ?? 64}
              min={0}
              max={127}
              kind="offset"
              bipolar
              default={64}
              disabled={tone === null}
              tip={row.tip}
              {tipAction}
              onchange={(value) => change({ type: 'tone', control: row.control, value })}
            />
          {/each}
        </div>
      {/each}
    </div>
  </section>

  <section class="group" aria-labelledby="channel-play">
    <GroupHeader title="Play" level={3} id="channel-play" />
    <div class="body">
      <div class="row">
        <span class="label">Mono</span>
        <LampButton
          label={play?.mono ? 'On' : 'Off'}
          on={play?.mono ?? false}
          size="sm"
          width={52}
          disabled={play === null}
          name={play?.mono ? 'Mono on' : 'Mono off'}
          tip="mixer.channel.mono"
          {tipAction}
          ontoggle={() => change({ type: 'mono' })}
        />
      </div>
      <div class="row">
        <div class="grow">
          <BarReadout
            label="Portamento"
            value={play?.portamento.time ?? 0}
            min={0}
            max={127}
            default={0}
            disabled={play === null}
            name="Portamento time"
            suffix={play && !play.portamento.on ? ', off' : ''}
            tip="mixer.channel.portamento_time"
            {tipAction}
            onchange={(time) => change({ type: 'portamento', time })}
          />
        </div>
        <LampButton
          label={play?.portamento.on ? 'On' : 'Off'}
          on={play?.portamento.on ?? false}
          size="sm"
          width={52}
          disabled={play === null}
          name={play?.portamento.on ? 'Portamento on' : 'Portamento off'}
          tip="mixer.channel.portamento"
          {tipAction}
          ontoggle={() => change({ type: 'portamentoOn' })}
        />
      </div>
      <div class="row">
        <span class="label">Octave</span>
        <Stepper
          value={octaveLabel}
          nameDown="Octave down"
          nameUp="Octave up"
          tipDown="part.octave_down"
          tipUp="part.octave_up"
          atMin={play === null || play.octave <= -2}
          atMax={play === null || play.octave >= 2}
          {tipAction}
          ondown={() => change({ type: 'octave', step: -1 })}
          onup={() => change({ type: 'octave', step: 1 })}
        />
      </div>
      <div class="row">
        <span class="label">Bend</span>
        <Stepper
          value={bend === null ? '—' : String(bend)}
          unit={bend === null ? '' : 'st'}
          nameDown="Bend range down"
          nameUp="Bend range up"
          tipDown="pedal.bend_down"
          tipUp="pedal.bend_up"
          atMin={bend === null || bend <= 0}
          atMax={bend === null || bend >= 12}
          {tipAction}
          ondown={() => change({ type: 'bend', step: -1 })}
          onup={() => change({ type: 'bend', step: 1 })}
        />
      </div>
    </div>
  </section>
</div>

<style>
  .eqtone {
    --channel-column: 264px;
    --channel-column-gap: 18px;
    --channel-label-width: 76px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: var(--channel-column-gap);
    align-items: start;
    box-sizing: border-box;
    width: 100%;
    max-width: calc(4 * var(--channel-column) + 3 * var(--channel-column-gap));
    max-height: 240px;
    overflow: hidden;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: var(--header-gap);
    min-width: 0;
  }
  .tone {
    grid-column: span 2;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--channel-column-gap);
  }
  .body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    height: var(--row-height, var(--control-height));
    min-width: 0;
    white-space: nowrap;
  }
  .grow {
    flex: 1;
    min-width: 0;
  }
  .label {
    flex: none;
    width: var(--channel-label-width);
    overflow: hidden;
    color: var(--caption-ink);
    text-overflow: ellipsis;
  }
</style>
