<!--
  LibrarySoundsSave: Library › Sounds' page actions, drawn at the right end of the Library header
  while the Sounds tab is chosen: the "edited" word, Save and Save as…, which opens an inline name
  field (an .aupreset switch for a plugin part, and Save / Cancel, or Replace / Cancel when that
  preset exists). Buttons stand as tall as the header's tabs. Controlled: every value is a prop,
  every change a callback.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import type { SoundCategoryItem, SoundSaveAs } from './types'

  type Props = {
    /** The four keyboard parts' names, Right 1 to Left. */
    partNames: string[]
    /** The target part (0-3): whose sound Save keeps. */
    part: number
    /** The target part's sound was edited since it was chosen or saved. */
    edited?: boolean
    /** The Save as… form; null: closed. */
    saveAs?: SoundSaveAs | null
    /** The target part plays a plugin that can keep an .aupreset: the form offers it. */
    canPreset?: boolean
    /** The categories, for the preset's category. */
    categories: SoundCategoryItem[]
    /** The app's tooltip action (`use:tip`). */
    tipAction?: Action<HTMLElement, string>
    /** Save the target part's sound over its own sound. */
    onsave?: () => void
    /** Save as… was pressed: open the form. */
    onsaveasopen?: () => void
    /** The form was edited (name, the .aupreset switch, its category). */
    onsaveasedit?: (change: Partial<Pick<SoundSaveAs, 'name' | 'aupreset' | 'category'>>) => void
    /** Save the form; `overwrite`: replace the .aupreset of that name. */
    onsaveas?: (overwrite: boolean) => void
    /** The form was cancelled (or the replace question, which goes back to the form). */
    onsaveascancel?: () => void
  }

  let {
    partNames,
    part,
    edited = false,
    saveAs = null,
    canPreset = false,
    categories,
    tipAction,
    onsave,
    onsaveasopen,
    onsaveasedit,
    onsaveas,
    onsaveascancel,
  }: Props = $props()

  const partName = $derived(partNames[part] ?? '')

  function tipped(node: HTMLElement, key: string) {
    return tipAction?.(node, key)
  }

  function saveAsKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (saveAs?.name.trim()) onsaveas?.(false)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onsaveascancel?.()
    }
  }

  function focusOnMount(node: HTMLInputElement) {
    node.focus()
    node.select()
  }
</script>

<span class="actions">
  {#if saveAs}
    <span class="saveas" role="group" aria-label="Save as a new sound">
      <input
        class="line-input name-input"
        type="text"
        value={saveAs.name}
        placeholder="Sound name"
        aria-label="New sound's name"
        spellcheck="false"
        autocomplete="off"
        data-tip="sounds.save_as_name"
        use:tipped={'sounds.save_as_name'}
        use:focusOnMount
        oninput={(e) => onsaveasedit?.({ name: e.currentTarget.value })}
        onkeydown={saveAsKey}
      />
      {#if canPreset}
        <Button
          label=".aupreset"
          on={saveAs.aupreset}
          pressed={saveAs.aupreset}
          name="Also save as an .aupreset"
          tip="sounds.save_preset"
          {tipAction}
          onpress={() => onsaveasedit?.({ aupreset: !saveAs?.aupreset })}
        />
        {#if saveAs.aupreset}
          <select
            class="line-input"
            aria-label="Category of the preset"
            value={saveAs.category}
            data-tip="sounds.preset_category"
            use:tipped={'sounds.preset_category'}
            onchange={(e) => onsaveasedit?.({ category: e.currentTarget.value })}
          >
            {#each categories as c (c.id)}<option value={c.id}>{c.label}</option>{/each}
          </select>
        {/if}
      {/if}
      {#if saveAs.replace}
        <span class="ask" role="alert">Replace ‘{saveAs.name.trim()}’?</span>
        <Button label="Replace" hue="ending" tip="sounds.preset_replace" {tipAction} onpress={() => onsaveas?.(true)} />
        <Button label="Cancel" tip="sounds.preset_replace_cancel" {tipAction} onpress={onsaveascancel} />
      {:else}
        <Button label="Save" disabled={!saveAs.name.trim()} name="Save the new sound" tip="sounds.save_as_confirm" {tipAction} onpress={() => onsaveas?.(false)} />
        <Button label="Cancel" tip="sounds.preset_cancel" {tipAction} onpress={onsaveascancel} />
      {/if}
    </span>
  {:else}
    {#if edited}<span class="edited" data-tip="sounds.edited" use:tipped={'sounds.edited'}>edited</span>{/if}
    <Button label="Save" name="Save {partName}'s sound" tip="sounds.save_over" {tipAction} onpress={onsave} />
    <Button label="Save as…" name="Save {partName}'s sound as a new sound" tip="sounds.save" {tipAction} onpress={onsaveasopen} />
  {/if}
</span>

<style>
  /* Stands on the header's rule, as its tabs do; the buttons take the tabs' height. */
  .actions,
  .saveas {
    display: flex;
    align-items: center;
    align-self: flex-end;
    gap: var(--space-8);
    min-width: 0;
    height: var(--tab-height-header);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
  }
  .actions {
    flex: none;
    margin-left: auto;
  }
  .actions :global(.btn) {
    height: var(--tab-height-header);
  }
  .edited {
    color: var(--t2);
  }
  .ask {
    color: var(--t);
  }
  .line-input {
    box-sizing: border-box;
    height: 30px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    border-bottom: var(--line-width) solid var(--m);
    border-radius: 0;
    background: var(--g);
    color: var(--t);
    caret-color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    outline: none;
  }
  .line-input:focus,
  .line-input:focus-visible {
    border-bottom-color: var(--t);
  }
  .line-input option {
    background: var(--g);
    color: var(--t);
  }
  .name-input {
    width: 180px;
  }
  .name-input::placeholder {
    color: var(--m);
    opacity: 1;
  }
</style>
