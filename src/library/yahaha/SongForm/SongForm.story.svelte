<!--
  SongForm's Svelte story (not shipped): the region in its box on the Stage (`storyWidth`, default
  1392, and `storyHeight` when the Stage's strip gives one), as the React stories' decorator draws
  it; with `storySheet`, the Forms sheet: every form of each half in a box exactly its least and
  its ideal, as the React Forms story.
-->
<script lang="ts">
  import Stack from '../../primitives/Stack.svelte';
  import Text from '../../primitives/Text.svelte';
  import { resolveNeed } from '../../layout/assembly/units';
  import { scopePrinciples } from '../../layout/assembly/principles.svelte';
  import type { Forms } from '../../layout/assembly/types';
  import SongForm from './SongForm.svelte';
  import { SONG_FORM_WIDTH } from './SongForm.fixtures';
  import { FORM_FORMS, SONG_FORM_FORMS, TRANSPORT_FORMS, type FormFormId, type TransportFormId } from './SongForm.forms';
  import type { SongFormPart, SongFormProps } from './SongForm.model';

  interface Props extends SongFormProps {
    storyWidth?: number;
    storyHeight?: number;
    storySheet?: boolean;
  }

  let { storyWidth = SONG_FORM_WIDTH, storyHeight, storySheet = false, ...args }: Props = $props();

  const principles = scopePrinciples();
  const rows: { part: SongFormPart; forms: Forms; pin: (id: string) => Partial<SongFormProps> }[] = [
    { part: 'transport', forms: TRANSPORT_FORMS, pin: (id) => ({ transportForm: id as TransportFormId }) },
    { part: 'form', forms: FORM_FORMS, pin: (id) => ({ formForm: id as FormFormId }) },
    {
      part: 'both',
      forms: SONG_FORM_FORMS,
      pin: (id) => {
        const parts = SONG_FORM_FORMS.find((f) => f.id === id)!.parts!;
        return { formForm: parts.form as FormFormId, transportForm: parts.transport as TransportFormId };
      },
    },
  ];
  const specimens = $derived(
    rows.flatMap(({ part, forms, pin }) =>
      forms.flatMap((f) =>
        (['min', 'ideal'] as const).map((at) => {
          const { w, h } = resolveNeed(f[at], principles.current);
          return { key: `${part}-${f.id}-${at}`, name: `${part} ${f.id} ${at}`, caption: `${part} · ${f.id} · ${at} ${Math.round(w)} × ${Math.round(h)}`, w, h, props: { part, ...pin(f.id) } };
        }),
      ),
    ),
  );
</script>

<div style:width="{storyWidth}px" style:max-width="100%" style:height={storyHeight === undefined ? undefined : `${storyHeight}px`}>
  {#if storySheet}
    <Stack gap={6}>
      {#each specimens as s (s.key)}
        <Stack gap={2}>
          <Text role="caption" tone="muted">{s.caption}</Text>
          <div
            data-specimen={s.name}
            style:width="{s.w}px"
            style:height="{s.h}px"
            style:display="flex"
            style:flex-direction="column"
            style:overflow="hidden"
            style:outline="1px dashed var(--border)"
          >
            <SongForm {...args} {...s.props} />
          </div>
        </Stack>
      {/each}
    </Stack>
  {:else}
    <SongForm {...args} />
  {/if}
</div>
