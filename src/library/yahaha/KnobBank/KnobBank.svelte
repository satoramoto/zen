<!--
  KnobBank: the Svelte renderer of `knobBankView` (KnobBank.model.ts), the same markup, classes and
  attributes as `KnobBank.tsx`; see KnobBank.tsx for the job, the forms and the tuning knobs. The
  form is `getForm` (a `form` prop wins over the assembled screen's choice).
-->
<script lang="ts">
  import Knob from '../../components/music/Knob/Knob.svelte';
  import { getForm } from '../../layout/assembly/forms.svelte';
  import { KNOB_BANK_FORMS, knobBankView, type KnobBankProps } from './KnobBank.model';
  import './KnobBank.css';

  let props: KnobBankProps = $props();
  const form = getForm(KNOB_BANK_FORMS, () => props.form);
  const view = $derived(knobBankView({ knobs: props.knobs }, form.current));
</script>

<div class={view.root.className} {...view.root.attrs}
  ><div class={view.knobs.className} {...view.knobs.attrs}
    >{#each view.slots as slot (slot.index)}<div class={slot.className} {...slot.attrs}
        >{#if slot.empty}<span class={slot.empty.className} {...slot.empty.attrs}
            ><span class={slot.empty.line.className} {...slot.empty.line.attrs}></span><svg
              class={slot.empty.ring.className}
              viewBox={slot.empty.ring.viewBox}
              aria-hidden="true"><path d={slot.empty.ring.d} /></svg
            ></span
          >{:else if slot.knob}<Knob
            {...slot.knob}
            tipAction={props.tipAction}
            onpress={() => props.onPress?.(slot.index)}
            onstep={(delta) => props.onStep?.(slot.index, delta)}
          />{/if}</div
      >{/each}</div
  ></div>
