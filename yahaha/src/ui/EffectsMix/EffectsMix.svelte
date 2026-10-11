<!--
  EffectsMix: the Effects page's right column, 120 × 288, always in view. A "Mix" group header,
  then four lamps stacked: Style inserts and Rotary fast, a hairline, then Master comp and
  Master EQ. Each is a neutral LampButton (outline at rest, solid when on); a click reports the
  change asked for and leaves the state to the parent.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import type { MixChange, MixData } from '../Effects/types'

  type Props = {
    /** The four switches' states. */
    mix: MixData
    /** The app's tooltip action (`use:tip`), applied to every lamp. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the change a lamp asks for. */
    onchange?: (change: MixChange) => void
  }

  let { mix, tipAction, onchange }: Props = $props()
</script>

<section class="mix" aria-label="Mix switches">
  <GroupHeader title="Mix" />
  <div class="lamps">
    <LampButton
      size="cell"
      label="Style inserts"
      name="Style insertion effects"
      on={mix.insertsOn}
      tip="fx.inserts"
      {tipAction}
      ontoggle={(on) => onchange?.({ type: 'insertsOn', on })}
    />
    <LampButton
      size="cell"
      label="Rotary fast"
      name="Rotary speaker fast"
      on={mix.rotaryFast}
      tip="fx.rotary_fast"
      {tipAction}
      ontoggle={() => onchange?.({ type: 'rotaryFast' })}
    />
    <span class="rule" aria-hidden="true"></span>
    <LampButton
      size="cell"
      label="Master comp"
      name="Master Compressor"
      on={mix.compOn}
      tip="fx.master_comp"
      {tipAction}
      ontoggle={(on) => onchange?.({ type: 'compOn', on })}
    />
    <LampButton
      size="cell"
      label="Master EQ"
      name="Master EQ"
      on={mix.eqOn}
      tip="fx.master_eq"
      {tipAction}
      ontoggle={(on) => onchange?.({ type: 'eqOn', on })}
    />
  </div>
</section>

<style>
  .mix {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 120px;
    height: 288px;
  }
  .lamps {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding-top: var(--space-12);
  }
  .rule {
    height: var(--line-width);
    margin: var(--space-4) 0;
    background: var(--line);
  }
</style>
