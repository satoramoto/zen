<!--
  SearchField: an underline search field (the Library's style, sound and instrument search). A
  label with a 1px bottom line in --m (--t while the field has focus), a 13×13 magnifier in --m,
  a visually hidden accessible name and a borderless `<input type="search">` in --type-text and
  --t. 30 tall. Controlled: it shows `value` and calls `oninput` as you type; the parent moves
  `value`. Esc clears a non-empty field (oninput('')) and goes no further; on an empty field it
  bubbles, so the page can close or step back. `onkeydown` sees every other key, so the parent can
  drive a list from the field (↑ ↓ Enter).
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Props = {
    /** The text in the field. The parent owns it: typing only calls `oninput`. */
    value?: string
    /** The field's accessible name, visually hidden ("Search styles"). */
    label: string
    /** The hint shown in `--m` while the field is empty ("Search"). */
    placeholder?: string
    /** A fixed width in px. Default: fills its container. */
    width?: number
    /** The tooltip key, set as `data-tip` on the input and passed to `tipAction`. */
    tip?: string
    /** The app's tooltip action (`use:tip`), applied to the input when `tip` is set. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the field's text on every edit, and with '' when Esc clears it. */
    oninput?: (value: string) => void
    /** Called on every key the field doesn't handle itself (all but Esc on a non-empty field). */
    onkeydown?: (event: KeyboardEvent) => void
  }

  let { value = '', label, placeholder, width, tip, tipAction, oninput, onkeydown }: Props = $props()

  function tipOn(node: HTMLElement, key: string | undefined) {
    if (!tipAction || !key) return
    return tipAction(node, key)
  }

  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && value !== '') {
      event.preventDefault()
      event.stopPropagation()
      oninput?.('')
      return
    }
    onkeydown?.(event)
  }
</script>

<label class="field" style:width={width === undefined ? '100%' : `${width}px`}>
  <svg class="glass" width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
    <circle cx="5.5" cy="5.5" r="4.25" fill="none" stroke="currentColor" stroke-width="1.5" />
    <line x1="8.6" y1="8.6" x2="12.25" y2="12.25" stroke="currentColor" stroke-width="1.5" />
  </svg>
  <span class="name">{label}</span>
  <input
    type="search"
    class="input"
    {value}
    {placeholder}
    autocomplete="off"
    spellcheck="false"
    data-tip={tip}
    use:tipOn={tip}
    oninput={(event) => oninput?.(event.currentTarget.value)}
    onkeydown={keydown}
  />
</label>

<style>
  .field {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    box-sizing: border-box;
    height: 30px;
    min-width: 0;
    border-bottom: var(--line-width) solid var(--m);
    color: var(--m);
    cursor: text;
  }
  .field:focus-within {
    border-bottom-color: var(--t);
  }
  .glass {
    flex: none;
  }
  .name {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
  .input {
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--t);
    caret-color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    outline: none;
    appearance: none;
  }
  .input::placeholder {
    color: var(--m);
    opacity: 1;
  }
  .input::-webkit-search-decoration,
  .input::-webkit-search-cancel-button,
  .input::-webkit-search-results-button,
  .input::-webkit-search-results-decoration {
    appearance: none;
  }
</style>
