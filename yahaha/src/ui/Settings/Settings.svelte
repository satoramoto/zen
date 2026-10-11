<!--
  Settings: the Settings page at 1440 × 900, a full-screen page in place of the Stage. The app bar
  as on the Stage (no transport row: the owner found it confusing here); then a left column (the
  six pages as a list from its top, the open one the chosen block, and Panic
  and help mode's ? at its foot) beside the open page, whose sections start at the top (the chosen
  page in the list names it); the status line and the keys at the foot. Every page stays mounted
  (the others hidden), so switching is instant. Each region takes its data as one object; every
  change goes out through its page's callback. The keys carry their own callbacks: with `onsplit`
  the split is set on them.
-->
<script lang="ts">
  import type { Component, ComponentProps } from 'svelte'
  import type { Action } from 'svelte/action'
  import AppBar from '../AppBar/AppBar.svelte'
  import Button from '../Button/Button.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import Keys from '../Keys/Keys.svelte'
  import PageList from '../PageList/PageList.svelte'
  import SettingsChord from '../SettingsChord/SettingsChord.svelte'
  import SettingsKeyboard from '../SettingsKeyboard/SettingsKeyboard.svelte'
  import SettingsLaunchkey from '../SettingsLaunchkey/SettingsLaunchkey.svelte'
  import SettingsPedals from '../SettingsPedals/SettingsPedals.svelte'
  import SettingsStyle from '../SettingsStyle/SettingsStyle.svelte'
  import SettingsSystem from '../SettingsSystem/SettingsSystem.svelte'
  import StatusLine from '../StatusLine/StatusLine.svelte'
  import type {
    ChordChange,
    ChordPageData,
    KeyboardChange,
    KeyboardPageData,
    LaunchkeyChange,
    LaunchkeyPageData,
    PedalsChange,
    PedalsPageData,
    SettingsPageId,
    SettingsPageItem,
    StyleChange,
    StylePageData,
    SystemChange,
    SystemPageData,
  } from './types'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Any = Component<any>
  /** A region's data: its props without `tipAction` and the `on…` callbacks. */
  type DataOf<P> = {
    [K in keyof P as K extends 'tipAction'
      ? never
      : K extends `on${string}`
        ? NonNullable<P[K]> extends (...args: never[]) => unknown
          ? never
          : K
        : K]: P[K]
  }
  type Data<C extends Any> = DataOf<ComponentProps<C>>
  type On<C extends Any, K extends keyof ComponentProps<C>> = Pick<ComponentProps<C>, K>

  type Props = {
    /** The app bar: pages (Settings chosen), Launchkey, audio health. */
    appBar: Data<typeof AppBar>
    /** Help mode on: the ? at the foot of the left column is lit. */
    help?: boolean
    /** The six pages, with what each is set to. */
    pages: SettingsPageItem[]
    /** The open page. */
    page: SettingsPageId
    chord: ChordPageData
    style: StylePageData
    keyboard: KeyboardPageData
    pedals: PedalsPageData
    system: SystemPageData
    launchkey: LaunchkeyPageData
    /** The status line above the keys. */
    status: Data<typeof StatusLine>
    /** The keys: range, split, held notes. */
    keys: ComponentProps<typeof Keys>
    /** The app's tooltip action (`use:tip`), passed to every region. */
    tipAction?: Action<HTMLElement, string>
    /** A page in the list was chosen. */
    onpage?: (id: SettingsPageId) => void
    /** A change on the Chord & Split page. */
    onchord?: (change: ChordChange) => void
    /** A change on the Style page. */
    onstyle?: (change: StyleChange) => void
    /** A change on the Keyboard page. */
    onkeyboard?: (change: KeyboardChange) => void
    /** A change on the Pedals page. */
    onpedals?: (change: PedalsChange) => void
    /** A change on the System page. */
    onsystem?: (change: SystemChange) => void
    /** A change on the Controller page (the Launchkey's pad page order). */
    onlaunchkey?: (change: LaunchkeyChange) => void
    /** Panic pressed (all notes off). */
    onpanic?: () => void
    /** The ? pressed: help mode asked on (`true`) or off. */
    onhelp?: (on: boolean) => void
  } & On<typeof AppBar, 'onchoose' | 'onhealth'> &
    On<typeof StatusLine, 'onclear'>

  let p: Props = $props()
</script>

<div class="screen">
  <AppBar {...p.appBar} tipAction={p.tipAction} onchoose={p.onchoose} onhealth={p.onhealth} />
  <section class="body" aria-label="Settings">
    <div class="side">
      <div class="list">
        <GroupHeader title="Settings" level={2} />
        <PageList
          pages={p.pages}
          chosen={p.page}
          label="Settings pages"
          tipAction={p.tipAction}
          onchoose={(id) => p.onpage?.(id as SettingsPageId)}
        />
      </div>
      <div class="helpers">
        <Button label="Panic" name="Panic: all notes off" tip="transport.panic" tipAction={p.tipAction} onpress={p.onpanic} />
        <Button
          label="?"
          size="icon"
          on={p.help ?? false}
          pressed={p.help ?? false}
          name="Help mode: point at any control to learn what it does"
          tip="app.help"
          tipAction={p.tipAction}
          onpress={() => p.onhelp?.(!(p.help ?? false))}
        />
      </div>
    </div>
    <div class="page">
      <div class="pages">
        <div class="slot" data-page="chord" hidden={p.page !== 'chord'}>
          <SettingsChord data={p.chord} tipAction={p.tipAction} onchange={p.onchord} />
        </div>
        <div class="slot" data-page="style" hidden={p.page !== 'style'}>
          <SettingsStyle data={p.style} tipAction={p.tipAction} onchange={p.onstyle} />
        </div>
        <div class="slot" data-page="keyboard" hidden={p.page !== 'keyboard'}>
          <SettingsKeyboard data={p.keyboard} tipAction={p.tipAction} onchange={p.onkeyboard} />
        </div>
        <div class="slot" data-page="pedals" hidden={p.page !== 'pedals'}>
          <SettingsPedals data={p.pedals} tipAction={p.tipAction} onchange={p.onpedals} />
        </div>
        <div class="slot" data-page="system" hidden={p.page !== 'system'}>
          <SettingsSystem data={p.system} tipAction={p.tipAction} onchange={p.onsystem} />
        </div>
        <div class="slot" data-page="launchkey" hidden={p.page !== 'launchkey'}>
          <SettingsLaunchkey data={p.launchkey} tipAction={p.tipAction} onchange={p.onlaunchkey} />
        </div>
      </div>
    </div>
  </section>
  <StatusLine {...p.status} tipAction={p.tipAction} onclear={p.onclear} />
  <Keys {...p.keys} />
</div>

<style>
  .screen {
    --settings-side-width: 320px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: var(--screen-width);
    height: var(--screen-height);
    padding: var(--screen-pad);
    overflow: hidden;
    background: var(--backdrop-ground);
    color: var(--t);
    font-family: var(--font-sans);
  }
  .body {
    display: flex;
    flex: 1;
    gap: var(--band-gap);
    min-height: 0;
    margin-top: var(--stage-gap-display);
    margin-bottom: var(--space-8);
  }
  .side {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: var(--space-20);
    width: var(--settings-side-width);
  }
  .list {
    display: flex;
    flex-direction: column;
  }
  /* Panic and help mode's ?: safety and help stay in reach, at the foot of the left column. */
  .helpers {
    display: flex;
    gap: var(--space-8);
    margin-top: auto;
  }
  .page {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .pages {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .slot[hidden] {
    display: none;
  }
</style>
