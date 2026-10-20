<!--
  Display: the Svelte renderer of `displayView` (Display.model.ts), the same markup, classes and
  attributes as `Display.tsx`; see Display.tsx for the job and the tuning knobs. The form comes from
  `getForm`/`getChosenForm` (the assembled screen) and the auto form's width (`measureWide`); the
  readouts' fit is the `displayFit` action on the frame (fit.svelte.ts, over `fit.ts`).
-->
<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import { getChosenForm, getForm } from '../../layout/assembly/forms.svelte';
  import AccentBlock from '../AccentBlock/AccentBlock.svelte';
  import { tip } from '../AccentBlock/tip.svelte';
  import Button from '../../components/core/Button/Button.svelte';
  import BarBeat from '../../components/music/BarBeat/BarBeat.svelte';
  import ChordReadout from '../../components/music/ChordReadout/ChordReadout.svelte';
  import PartMarks from '../../components/music/PartMarks/PartMarks.svelte';
  import SectionName from '../../components/music/SectionName/SectionName.svelte';
  import TempoReadout from '../../components/music/TempoReadout/TempoReadout.svelte';
  import Stack from '../../primitives/Stack.svelte';
  import Text from '../../primitives/Text.svelte';
  import DisplayArt from '../DisplayArt/DisplayArt.svelte';
  import OneTouchPicker from '../OneTouchPicker/OneTouchPicker.svelte';
  import WaitingChip from '../WaitingChip/WaitingChip.svelte';
  import { DISPLAY_FORMS } from './Display.forms';
  import { DISPLAY_SIZES, PART_TIP, displayForm, displayMeasuresWidth, displayView, styleText, type DisplayModelProps } from './Display.model';
  import { displayFit, measureWide } from './fit.svelte';
  import './Display.css';

  let props: DisplayModelProps = $props();

  // The form: the `form` prop, then the assembled screen's choice, then `density`.
  const fromScreen = getForm(DISPLAY_FORMS, () => props.form);
  const chosen = getChosenForm();
  const wide = measureWide(() => displayMeasuresWidth(props, chosen.current));
  const picked = $derived(displayForm(props, fromScreen.current, chosen.current, wide.current));
  const view = $derived(displayView(props, picked.form, picked.byDensity));
</script>

{#snippet tempoKeys()}<Stack direction="row" gap={1} align="center" class="yh-display__tempo-keys" data-part="tempo-keys"
    ><Button
      label="Tap"
      size="md"
      hold
      name="Tap tempo"
      tip="tempo.tap"
      tipAction={props.tipAction}
      onHold={(down: boolean) => {
        if (down) props.onTap?.();
      }}
      onPress={() => props.onTap?.()}
    /><Button
      label="Style tempo"
      size="md"
      variant="quiet"
      disabled={view.atStyleTempo}
      name="Back to the style's tempo"
      tip="tempo.reset"
      tipAction={props.tipAction}
      onPress={() => props.onStyleTempo?.()}
    /></Stack
  >{/snippet}

<Text as="div" size="inherit" class={view.root.className} {...view.root.attrs} style={styleText(view.rootStyle)} {@attach wide.attach}
  >{#if props.art}<div class="yh-display__art" data-part="art"><DisplayArt /></div>{/if}<div
    class="yh-display__frame"
    data-part="frame"
    data-fit="1"
    use:displayFit={view.fitKey}
    ><header class="yh-display__header" data-part="header"
      ><Stack direction="row" gap={1} align="center" class="yh-display__style" data-part="style" role="group" aria-label="Style"
        ><Button
          symbol="prev"
          size="icon"
          variant="quiet"
          name="Previous style (Track left)"
          tip="style.prev"
          tipAction={props.tipAction}
          onPress={() => props.onPrev?.()}
        /><span class="yh-display__style-name" data-part="style-name" title={view.name}
          ><AccentBlock
            as="button"
            label={view.name}
            name={`${view.name}: open the Browser`}
            chevron={false}
            tip="browser.open"
            tipAction={props.tipAction}
            onPress={() => props.onBrowse?.()}
          /></span
        ><Button
          symbol="next"
          size="icon"
          variant="quiet"
          name="Next style (Track right)"
          tip="style.next"
          tipAction={props.tipAction}
          onPress={() => props.onNext?.()}
        />{#if view.queued}<span class="yh-display__queued" data-part="queued" title={`Next style: ${view.queued}`}
            ><WaitingChip label={view.queued} hue="a" size="line" /></span
          >{:else if view.meta}<Text size="label" tabular class="yh-display__meta" data-part="meta" title={view.meta}>{view.meta}</Text
          >{/if}</Stack
      ><div class="yh-display__ots" data-part="one-touch"
        ><OneTouchPicker
          applied={props.style.oneTouch ?? 0}
          count={props.style.oneTouchCount ?? 4}
          tipAction={props.tipAction}
          onApply={(n: number) => props.onOneTouch?.(n)}
        /></div
      >{#if view.tempoKeysInHeader}{@render tempoKeys()}{/if}</header
    ><div class="yh-display__readouts" data-part="readouts"
      ><div class="yh-display__cell yh-display__section" data-part="section" role="group" aria-label="Section"
        ><div class="yh-display__now" data-part="now" role="img" aria-label={view.nowLabel} data-live={view.nowLive}
          ><SectionName label={props.nowPlaying.playing} idle={!view.running} size={DISPLAY_SIZES.section} /></div
        >{#if view.hasLine}<Text as="p" size="label" class="yh-display__next" data-part="next"
            >{#if view.line.status}<Text size="label" class="yh-display__status" data-part="status">{view.line.status}</Text
              >{/if}{#if view.hasThen}<Text
                size="label"
                class="yh-display__then"
                data-part="then"
                data-docked={view.thenDocked}
                style={styleText(view.thenStyle)}
                ><span class="yh-display__then-arrow" data-part="then-arrow" aria-hidden="true"></span><span
                  class="yh-display__then-word"
                  data-part="then-word">{'then '}</span
                >{#if view.line.next}<Text weight="strong" leading="tight" class="yh-display__then-name" data-part="then-name"
                    >{view.line.next}</Text
                  >{/if}{#if view.line.when}<span class="yh-display__when" data-part="when">{view.line.when}</span>{/if}</Text
              >{/if}</Text
          >{/if}</div
      ><div class="yh-display__cell yh-display__chord" data-part="chord"
        ><ChordReadout {...props.nowPlaying.chord} tip="fingering.select" tipAction={props.tipAction} size={DISPLAY_SIZES.chord} /></div
      ><div class="yh-display__cell yh-display__tempo" data-part="tempo" role="group" aria-label="Tempo and Tap"
        ><TempoReadout
          bpm={props.nowPlaying.bpm}
          size={DISPLAY_SIZES.tempo}
          tipAction={props.tipAction}
          onTempo={props.onTempo}
          onPlus={props.onTempoUp}
          onMinus={props.onTempoDown}
          onReset={props.onStyleTempo}
        /><div class="yh-display__beat" data-part="beat"
          ><BarBeat beat={view.beat} beats={view.beats} thickness={DISPLAY_SIZES.beat} /></div
        >{#if !view.tempoKeysInHeader}{@render tempoKeys()}{/if}</div
      >{#if view.parts.length > 0}<Stack as="ul" gap={0} class="yh-display__parts" data-part="parts" aria-label="Sounds"
          >{#each view.parts as p (p.id)}<li
              ><Text
                as="button"
                size="label"
                leading="normal"
                class="yh-display__part"
                {...p.attrs}
                style={styleText(p.style)}
                onclick={() => props.onSound?.(p.id)}
                {@attach fromAction(tip, () => ({ tip: PART_TIP, tipAction: props.tipAction }))}
                ><span class="yh-display__part-dot" data-part="part-dot" data-lit={p.lit} aria-hidden="true"></span><Stack
                  as="span"
                  direction="row"
                  gap={2}
                  align="center"
                  class="yh-display__part-sound"
                  data-part="part-sound"
                  aria-hidden="true"
                  ><span class="yh-display__part-name" data-part="part-name">{p.sound}</span><PartMarks
                    edited={p.edited}
                    missing={p.missing}
                    failed={p.failed}
                  /></Stack
                ><Text size="caption" leading="normal" case="label" class="yh-display__part-part" data-part="part-part" aria-hidden="true"
                  ><span class="yh-display__part-label" data-part="part-label">{p.name}</span>{#if p.tail}<span
                      class="yh-display__part-tail"
                      data-part="part-tail">{p.tail}</span
                    >{/if}</Text
                ></Text
              ></li
            >{/each}</Stack
        >{/if}</div
    ></div
  ></Text
>
