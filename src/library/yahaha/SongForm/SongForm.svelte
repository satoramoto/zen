<!--
  SongForm: the Svelte renderer of `songFormView` (SongForm.model.ts), the same markup, classes and
  attributes as `SongForm.tsx`; see SongForm.tsx for the job, the forms and the tuning knobs. Each
  half reads its form with `getForm` (forms.svelte.ts), as React's `useForm`.
-->
<script lang="ts">
  import Button from '../../components/core/Button/Button.svelte';
  import LampButton from '../../components/core/LampButton/LampButton.svelte';
  import Pad from '../../components/music/Pad/Pad.svelte';
  import Stack from '../../primitives/Stack.svelte';
  import Text from '../../primitives/Text.svelte';
  import { getForm } from '../../layout/assembly/forms.svelte';
  import { FORM_FORMS, TRANSPORT_FORMS } from './SongForm.forms';
  import { songFormView, type SongFormProps, type StepView } from './SongForm.model';
  import './SongForm.css';

  let props: SongFormProps = $props();
  const formId = getForm(FORM_FORMS, () => props.formForm, 'form');
  const transportId = getForm(TRANSPORT_FORMS, () => props.transportForm, 'transport');
  const view = $derived(songFormView(props, formId.current, transportId.current));
</script>

{#snippet step(s: StepView)}<div
    class={s.className}
    {...s.attrs}><Pad {...s.pad} /></div
  >{/snippet}

<Text as="div" class={view.root.className} {...view.root.attrs}
  ><Text as="div" class={view.inner.className} {...view.inner.attrs}
    >{#if view.form}{@const form = view.form}<Stack {...form.stack} class={form.className} {...form.attrs}
        ><span class={form.cue.className} {...form.cue.attrs}>{form.cue.word}</span><Stack
          {...form.parts.stack}
          class={form.parts.className}
          {...form.parts.attrs}
          >{#each form.items as p (p.part)}<Stack {...p.stack} class={p.className} {...p.attrs}
              >{#if p.arrow}<Text {...p.arrow.text} class={p.arrow.className} {...p.arrow.attrs}>{p.arrow.word}</Text
                >{/if}<Text {...p.caption.text} class={p.caption.className} {...p.caption.attrs}>{p.caption.word}</Text
              ><div class={p.steps.className} {...p.steps.attrs}
                >{#each p.items as s (s.id)}{@render step(s)}{/each}</div
              ></Stack
            >{/each}</Stack
        ><Stack {...form.mods.stack} class={form.mods.className} {...form.mods.attrs}
          ><div class={form.modSteps.className} {...form.modSteps.attrs}>{@render step(form.brk)}</div></Stack
        ></Stack
      >{/if}{#if view.transport}{@const transport = view.transport}<div class={transport.className} {...transport.attrs}
        ><div class={transport.start.className} {...transport.start.attrs}><Button {...transport.startButton} /></div
        >{#each transport.keys as k (k.key)}<div class={k.className} {...k.attrs}
            >{#if k.kind === 'button'}<Button {...k.button} />{:else}<LampButton {...k.lamp} />{/if}</div
          >{/each}</div
      >{/if}</Text
  ></Text
>
