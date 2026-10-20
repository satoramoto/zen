<!--
  AppBar: the Svelte renderer of `appBarView` (AppBar.model.ts), the same markup, classes and
  attributes as `AppBar.tsx`; see AppBar.tsx for the job, the changes and the tuning knobs. Focus
  goes back to the ▾ when the popover closes through `createFocusReturn` (popover.svelte.ts, over
  `popover.ts`). `end` and a tab's label may be snippets.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '../../components/core/Button/Button.svelte';
  import LampButton from '../../components/core/LampButton/LampButton.svelte';
  import Separator from '../../components/core/Separator/Separator.svelte';
  import StatusDot from '../../components/core/StatusDot/StatusDot.svelte';
  import Tabs from '../../layout/Tabs.svelte';
  import Stack from '../../primitives/Stack.svelte';
  import Text from '../../primitives/Text.svelte';
  import HealthSlot from '../HealthSlot/HealthSlot.svelte';
  import MetronomePopover from './MetronomePopover.svelte';
  import { appBarView, type AppBarModelProps } from './AppBar.model';
  import { createFocusReturn } from './popover.svelte';
  import './AppBar.css';

  interface Props extends AppBarModelProps<string | Snippet> {
    /** Extra controls after the page nav, before the switches, behind a hairline of their own. */
    end?: Snippet;
  }

  let props: Props = $props();
  const view = $derived(appBarView(props));

  let caretBox = $state<HTMLSpanElement | null>(null);
  // When the popover closes with focus inside it, focus would fall to the page: give it back to ▾.
  const focusReturn = createFocusReturn(() => caretBox);
  $effect(() => focusReturn(view.metronome.open));

  const choose = (id: string) => props.onChoose?.(id);
</script>

<Text as="header" size="label" class="yh-appbar" data-part="root" style={view.styleText}
  ><Stack direction="row" align="center" class="yh-appbar__row" data-part="row"
    ><Text size="label" weight="strong" class="yh-appbar__name" data-part="name">yahaha</Text><Stack
      as="nav"
      direction="row"
      gap={0}
      align="center"
      class="yh-appbar__nav"
      data-part="nav"
      aria-label="Pages"
      ><Tabs name="Display pages" items={props.displayTabs} value={view.chosen} onChange={choose} tipAction={props.tipAction} /><span
        class="yh-appbar__runs-gap"
        data-part="runs-gap"><Separator /></span
      ><Tabs name="Full pages" items={props.fullTabs} value={view.chosen} onChange={choose} tipAction={props.tipAction} /></Stack
    ><span class="yh-appbar__middle" data-part="middle"
      >{#if view.nowPlaying}<span class="yh-appbar__playing" data-part="playing" aria-label={view.nowPlaying.label}
          ><Text size="label" weight="strong" tabular class="yh-appbar__style" data-part="style">{view.nowPlaying.style}</Text><Text
            role="numeral"
            size="label"
            class="yh-appbar__tempo"
            data-part="tempo">{view.nowPlaying.tempo}</Text
          ><span class="yh-appbar__unit" data-part="unit">BPM</span></span
        >{/if}</span
    >{#if props.end}<Stack as="span" direction="row" align="center" class="yh-appbar__end" data-part="end"
        ><Separator />{@render props.end()}</Stack
      >{/if}<Stack
      as="span"
      direction="row"
      align="center"
      class="yh-appbar__switches"
      data-part="switches"
      role="group"
      aria-label="Global switches"
      ><Stack as="span" direction="row" gap={0} align="center" class="yh-appbar__metronome" data-part="metronome" role="group" aria-label="Metronome"
        ><LampButton
          label="Metronome"
          on={view.metronome.on}
          hue={view.metronome.hue}
          join="start"
          name="Metronome"
          tip="metronome.on"
          tipAction={props.tipAction}
          onToggle={(next: boolean) => props.onMetronome?.(next)}
        /><span bind:this={caretBox} class="yh-appbar__caret" data-part="caret"
          ><Button
            symbol="caret"
            size="caret"
            join="end"
            popup="dialog"
            expanded={view.metronome.open}
            controls={view.metronome.id}
            name="Metronome settings: on/off, volume, bell on beat 1"
            tip="metronome.settings"
            tipAction={props.tipAction}
            onPress={() => props.onMetronomeSettings?.()}
          /></span
        >{#if view.metronome.open}<span class="yh-appbar__popover" data-part="popover"
            ><MetronomePopover
              id={view.metronome.id}
              on={view.metronome.on}
              volume={view.metronome.volume}
              bell={view.metronome.bell}
              audible={view.metronome.audible}
              tipAction={props.tipAction}
              onOn={(next: boolean) => props.onMetronome?.(next)}
              onVolume={(v: number) => props.onMetronomeVolume?.(v)}
              onBell={(next: boolean) => props.onMetronomeBell?.(next)}
              onClose={() => props.onMetronomeClose?.()}
            /></span
          >{/if}</Stack
      ><LampButton
        label="Unison"
        on={view.unison}
        name="Unison"
        tip="transport.unison"
        tipAction={props.tipAction}
        onToggle={(next: boolean) => props.onUnison?.(next)}
      /><Button
        label="?"
        size="icon"
        on={view.help}
        pressed={view.help}
        name="Help mode: point at any control to learn what it does"
        tip="app.help"
        tipAction={props.tipAction}
        onPress={() => props.onHelp?.(!view.help)}
      /></Stack
    ><Stack as="span" direction="row" align="center" class="yh-appbar__status" data-part="status" role="group" aria-label="Connections"
      ><Separator /><Stack
        as="span"
        direction="row"
        gap={2}
        align="center"
        class="yh-appbar__launchkey"
        data-part="launchkey"
        role="status"
        title={view.launchkey.label}
        data-connected={view.launchkey.connected}
        aria-label={view.launchkey.label}
        ><StatusDot hue={view.launchkey.dot.hue} hollow={view.launchkey.dot.hollow} /><Text
          size="label"
          case="label"
          class="yh-appbar__launchkey-word"
          data-part="launchkey-word">Launchkey</Text
        ></Stack
      ><span class="yh-appbar__health" data-part="health"
        ><HealthSlot {...view.health} tipAction={props.tipAction} onOpen={props.onHealth} /></span
      ></Stack
    ><Stack as="span" direction="row" align="center" class="yh-appbar__panic" data-part="panic"
      ><Separator /><Button
        label="Panic"
        hue="rec"
        name="Panic: all notes off"
        tip="transport.panic"
        tipAction={props.tipAction}
        onPress={() => props.onPanic?.()}
      /></Stack
    ></Stack
  ></Text
>
