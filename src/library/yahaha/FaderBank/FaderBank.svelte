<!--
  FaderBank: the Svelte renderer of `faderBankView` (FaderBank.model.ts), the same markup, classes
  and attributes as `FaderBank.tsx`; see FaderBank.tsx for the job. The form is `getForm` (React's
  `useForm`); the name button's tooltip is the `tip` action (tip.svelte.ts, over `tip.ts`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromAction } from 'svelte/attachments';
  import Stack from '../../primitives/Stack.svelte';
  import Text from '../../primitives/Text.svelte';
  import Group from '../../layout/Group.svelte';
  import Button from '../../components/core/Button/Button.svelte';
  import Fader from '../../components/music/Fader/Fader.svelte';
  import LampButton from '../../components/core/LampButton/LampButton.svelte';
  import PartMarks from '../../components/music/PartMarks/PartMarks.svelte';
  import { getForm } from '../../layout/assembly/forms.svelte';
  import { styleString } from '../../layout/style';
  import { FADER_BANK_FORMS } from './FaderBank.forms';
  import { faderBankView, type BankLampView, type FaderBankModelProps } from './FaderBank.model';
  import { tip } from './tip.svelte';
  import './FaderBank.css';

  let props: FaderBankModelProps<string | Snippet> = $props();
  const form = getForm(FADER_BANK_FORMS, () => props.form);
  const view = $derived(faderBankView(props, form.current));
</script>

{#snippet lamp(item: BankLampView)}<LampButton
    {...item.lamp}
    tipAction={props.tipAction}
    onToggle={(on: boolean) => props.onLamp?.(item.id, on)}
    onLongPress={item.long ? () => props.onLampLong?.(item.id) : undefined}
    onLongRelease={item.long ? () => props.onLampRelease?.(item.id) : undefined}
  />{/snippet}

<Stack gap={view.root.gap} class={view.root.className} {...view.root.attrs}
  ><div class={view.grid.className} style={styleString(view.grid.style)}
    >{#each view.dividers as divider (divider.key)}<span class={divider.className} style={styleString(divider.style)} {...divider.attrs}
      ></span>{/each}{#if view.plate}<span class={view.plate.className} style={styleString(view.plate.style)} {...view.plate.attrs}
      ></span>{/if}{#each view.strips as strip (strip.id)}<Stack gap={1} class={strip.className} style={styleString(strip.style)} {...strip.attrs}
        ><Fader {...strip.fader} tipAction={props.tipAction} onlevel={(level: number) => props.onLevel?.(strip.id, level)} />{#if strip.parked}<Text
            size="inherit"
            leading="snug"
            class={strip.name.className}
            {...strip.name.attrs}
            ><Text size="label" weight="strong" leading="snug" class="yh-faderbank__tag-text">{strip.name.tag}</Text><Text
              size="caption"
              leading="snug"
              class="yh-faderbank__sound">{strip.name.sound}</Text
            >{#if strip.marks}<span class={strip.marks.className}></span>{/if}</Text
          >{:else}<Text
            as="button"
            size="inherit"
            leading="snug"
            class={strip.name.className}
            {...strip.name.attrs}
            onclick={() => props.onOpen?.(strip.id)}
            {@attach fromAction(tip, () => ({ tip: strip.name.tip, tipAction: props.tipAction }))}
            ><Text size="label" weight="strong" leading="snug" class="yh-faderbank__tag-text">{strip.name.tag}</Text><Text
              size="caption"
              leading="snug"
              class="yh-faderbank__sound">{strip.name.sound}</Text
            >{#if strip.marks}<span class={strip.marks.className}
                >{#if strip.marks.props}<PartMarks {...strip.marks.props} />{/if}</span
              >{/if}</Text
          >{/if}</Stack
      >{/each}{#each view.partLamps as item (item.id)}<div class={item.cell.className} style={styleString(item.cell.style)} {...item.cell.attrs}
        >{@render lamp(item)}</div
      >{/each}<div class={view.page.cell.className} style={styleString(view.page.cell.style)} {...view.page.cell.attrs}
      ><Button
        {...view.page.button}
        tipAction={props.tipAction}
        onPress={props.onPageButton}
        onLongPress={props.onPageLong}
        onLongRelease={props.onPageRelease}
      /></div
    ></div
  >{#if view.functions}<div class={view.functions.className}
      ><Group name={view.functions.group.name} label={false} gap={view.functions.group.gap} class={view.functions.group.className}
        >{#each view.functions.lamps as item (item.id)}{@render lamp(item)}{/each}</Group
      ></div
    >{/if}{#if view.note}<span class={view.note.className} {...view.note.attrs}>{view.note.lead}<span>{view.note.text}</span></span
    >{/if}</Stack
>
