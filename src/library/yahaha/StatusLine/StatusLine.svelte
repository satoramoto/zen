<!--
  StatusLine: the Svelte renderer of `statusLineView` (StatusLine.model.ts), the same markup,
  classes and attributes as `StatusLine.tsx`; see StatusLine.tsx for the job and what changed.
  The message's contents are keyed on `seq`, so a repeat is announced again.
-->
<script lang="ts">
  import Text from '../../primitives/Text.svelte';
  import { statusLineView, type StatusLineModelProps } from './StatusLine.model';
  import './StatusLine.css';

  let props: StatusLineModelProps = $props();
  const view = $derived(statusLineView(props));
</script>

<Text
  as="p"
  tabular
  class="yh-status-line"
  data-part="root"
  ariaRole="status"
  aria-live="polite"
  style={view.width === undefined ? undefined : `width: ${view.width}`}
  >{#if view.hint}<span class="yh-status-line-hint" data-part="hint" aria-hidden="true"
      ><Text weight="strong" tabular class="yh-status-line-hint-title" data-part="hint-title">{view.hint.title}</Text><span
        class="yh-status-line-hint-body"
        data-part="hint-body">{view.hint.body}</span
      >{#if view.hint.places.length > 0}<span class="yh-status-line-hint-meta" data-part="hint-meta"
          >{#each view.hint.places as place (place.label)}<span class="yh-status-line-hint-place" data-part="hint-place"
              ><Text role="caption" case="label" tabular class="yh-status-line-hint-label" data-part="hint-label">{place.label}</Text
              >{' '}<Text as="kbd" role="caption" tabular class="yh-status-line-key" data-part="key">{place.key}</Text></span
            >{/each}</span
        >{/if}</span
    >{/if}{#if view.message}<button type="button" class={view.message.className} {...view.message.attrs} onclick={() => props.onClear?.()}
      >{#key view.message.seq}{#if view.message.error}<Text
            role="label"
            leading="tight"
            tabular
            class="yh-status-line-tag"
            data-part="tag"
            aria-hidden="true"
            ><svg data-hue="warn" class="yh-status-line-mark" data-part="mark" width="12" height="12" viewBox="0 0 12 12"
              ><path d="M6 1.5 L11 10.5 H1 Z" /><path d="M6 5 V7.4" /><circle cx="6" cy="8.9" r="0.6" /></svg
            >Error</Text
          >{/if}<span class="yh-status-line-text" data-part="text"
          >{#if view.message.error}<span class="yh-status-line-hidden" data-part="hidden">Error:</span>{/if}{view.message.text}</span
        >{/key}<svg class="yh-status-line-clear" data-part="clear" aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"
        ><path d="M2 2 L8 8 M8 2 L2 8" /></svg
      ></button
    >{/if}</Text
>
