<!--
  Stage: the Svelte renderer of `stageView` and the Stage's derivations (Stage.model.ts), the same
  frame and assembled screen as `Stage.tsx`; see Stage.tsx for the job. The principles come from
  the nearest ThemeScope (`scopePrinciples`), the screen measures its own room (Screen.svelte), and
  the taps are one `createTapTempo` store per mounted screen.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Keys from '../../components/music/Keys/Keys.svelte';
  import { scopePrinciples } from '../../layout/assembly/principles.svelte';
  import type { Placed } from '../../layout/assembly/types';
  import Region from '../../layout/Region.svelte';
  import Screen from '../../layout/Screen.svelte';
  import { styleString } from '../../layout/style';
  import AppBar from '../AppBar/AppBar.svelte';
  import Display from '../Display/Display.svelte';
  import FaderBankRegion from '../FaderBank/FaderBankRegion.svelte';
  import KnobBankRegion from '../KnobBank/KnobBankRegion.svelte';
  import PadBankRegion from '../PadBank/PadBankRegion.svelte';
  import SongForm from '../SongForm/SongForm.svelte';
  import StatusLine from '../StatusLine/StatusLine.svelte';
  import { stageKeysWidth, stagePads, stageTap, stageView, type StageModelProps } from './Stage.model';
  import { createTapTempo } from './tapTempo';
  import './Stage.css';

  let props: StageModelProps<string | Snippet> = $props();

  const tapper = createTapTempo();
  const p = scopePrinciples();
  const view = $derived(stageView(props));
  const onTap = () => stageTap(props.display, tapper, performance.now());
  const shownPads = $derived(stagePads(props.pads, props.songForm, onTap));
</script>

{#snippet bar()}<AppBar {...props.appBar} tipAction={props.tipAction} />{/snippet}
{#snippet hero()}<Region name="Hero"><Display {...props.display} parts={undefined} tipAction={props.tipAction} {onTap} /></Region>{/snippet}
{#snippet transport()}<Region name="Transport"><SongForm {...props.songForm} part="transport" tipAction={props.tipAction} /></Region>{/snippet}
{#snippet mixer()}<FaderBankRegion {...props.faders} tipAction={props.tipAction} />{/snippet}
{#snippet knobs()}<KnobBankRegion {...props.knobs} tipAction={props.tipAction} />{/snippet}
{#snippet pads()}<PadBankRegion {...shownPads} tipAction={props.tipAction} />{/snippet}
{#snippet keys(_form: string, placed: Placed)}<Region name="Keyboard"><Keys {...props.keys} ruler={false} width={stageKeysWidth(placed, p.current.plate.inset)} tipAction={props.tipAction} /></Region>{/snippet}
{#snippet status()}<StatusLine {...props.status} />{/snippet}

<div class={view.className} {...view.attrs} style={styleString(view.style)}><Screen name="Stage" class="yh-stage__screen" spec={view.spec} room={view.room} onPlacement={props.onPlacement} regions={{ bar, hero, transport, mixer, knobs, pads, keys, status }} /></div>
