<!--
  PadBank: the Svelte renderer of `padBankView` (PadBank.model.ts), the same root, room, grid and
  sixteen cells as `PadBank.tsx`; see PadBank.tsx for the job. The form comes from `getForm` /
  `getChosenForm`, as React's `useForm` / `useChosenForm`.
-->
<script lang="ts">
  import Pad from '../../components/music/Pad/Pad.svelte';
  import { getChosenForm, getForm } from '../../layout/assembly/forms.svelte';
  import { PAD_BANK_FORMS, padBankView, type PadBankProps } from './PadBank.model';
  import './PadBank.css';

  let props: PadBankProps = $props();
  const form = getForm(PAD_BANK_FORMS, () => props.form);
  const chosen = getChosenForm();
  const view = $derived(padBankView(props, form.current, chosen.current));
</script>

<div class={view.root.className} {...view.root.attrs}><div class={view.room.className} {...view.room.attrs}><div
      class={view.grid.className}
      {...view.grid.attrs}
    >{#each view.cells as cell (cell.index)}<div class={cell.className} {...cell.attrs}>{#if cell.empty}<span
            class={cell.empty.className}
            {...cell.empty.attrs}
          ></span>{:else if cell.pad}<Pad {...cell.pad} tipAction={props.tipAction} onPress={() => props.onPress?.(cell.index)} />{/if}</div>{/each}</div
    ></div></div>
