<!--
  Effects: the Effects page in the Stage's display box (1392 × 288, `--page-width` ×
  `--page-height`): three columns, each under its own header. At the left the list (the sends,
  Add send, then the style's inserts and the Master), the open one the chosen block; in the middle
  the open one's editor (a send's type, parameters, return and part sends; the Master Compressor
  and EQ; or the style's inserts); at the right the mix switches, always in view (Style inserts,
  Rotary fast, Master comp, Master EQ). The app bar, section row, band and keys stay the Stage's.
  Takes its data as one object; every change goes out through the region's callback.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import BusEditor from '../BusEditor/BusEditor.svelte'
  import EffectsMix from '../EffectsMix/EffectsMix.svelte'
  import InsertsEditor from '../InsertsEditor/InsertsEditor.svelte'
  import MasterEditor from '../MasterEditor/MasterEditor.svelte'
  import SendList from '../SendList/SendList.svelte'
  import type { BusChange, EffectsBus, EffectsData, InsertsChange, MasterChange, MixChange } from './types'

  type Props = {
    /** The whole page: which one is open, the list, the mix switches and each editor's data. */
    data: EffectsData
    /** The app's tooltip action (`use:tip`), passed to every region. */
    tipAction?: Action<HTMLElement, string>
    /** A row of the list was chosen: a send, the Master or the inserts. */
    onopen?: (bus: EffectsBus) => void
    /** Add send was pressed. */
    onadd?: () => void
    /** A change in the open send's editor. */
    onbus?: (change: BusChange) => void
    /** A change in the Master editor. */
    onmaster?: (change: MasterChange) => void
    /** A change in the inserts editor. */
    oninserts?: (change: InsertsChange) => void
    /** A mix switch was pressed. */
    onmix?: (change: MixChange) => void
  }

  let { data, tipAction, onopen, onadd, onbus, onmaster, oninserts, onmix }: Props = $props()
</script>

<div class="effects" role="region" aria-label="Effects page">
  <div class="list">
    <SendList list={data.list} bus={data.bus} {tipAction} {onopen} {onadd} />
  </div>
  <div class="editor">
    {#if data.bus === 'master'}
      <MasterEditor master={data.master} {tipAction} onchange={onmaster} />
    {:else if data.bus === 'inserts'}
      <InsertsEditor inserts={data.inserts} {tipAction} onchange={oninserts} />
    {:else if data.editor}
      <BusEditor bus={data.editor} {tipAction} onchange={onbus} />
    {/if}
  </div>
  <div class="mix">
    <EffectsMix mix={data.mix} {tipAction} onchange={onmix} />
  </div>
</div>

<style>
  .effects {
    display: flex;
    gap: var(--space-24);
    box-sizing: border-box;
    width: var(--page-width, 1392px);
    height: var(--page-height, 288px);
    overflow: hidden;
    color: var(--t);
    font-family: var(--font-sans);
  }
  .list {
    flex: none;
    width: 280px;
    height: 100%;
  }
  .editor {
    flex: 1;
    min-width: 0;
    height: 100%;
  }
  .mix {
    flex: none;
    width: 120px;
    height: 100%;
  }
</style>
