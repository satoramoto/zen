<!--
  SettingsRow's Svelte stories (not shipped): the same rows as SettingsRow.stories.tsx, from
  SettingsRow.fixtures.ts. The stand-in controls are core Buttons (a lamp, a run of tabs) and a
  native range, until LampButton and Tabs have Svelte twins.
-->
<script lang="ts">
  import Button from '../Button/Button.svelte';
  import SettingsRow from './SettingsRow.svelte';
  import type { SettingsRowModelProps } from './SettingsRow.model';
  import { STACK_CONTROLS, settingsRowStories, type ControlArgs } from './SettingsRow.fixtures';

  type Args = SettingsRowModelProps &
    ControlArgs & {
      ontoggle?: (on: boolean) => void;
      onchoose?: (id: string) => void;
      onchange?: (value: number) => void;
    };

  interface Props extends Args {
    /** `Stack` draws the page's stack; anything else one row from the args. */
    story?: string;
  }

  let { story, ...args }: Props = $props();
  const rows = settingsRowStories.Stack.items ?? [];
</script>

{#snippet control(a: Args)}
  {#if a.control === 'lamp'}
    <Button
      label={a.lampLabel}
      name={a.label}
      on={a.lampOn}
      pressed={a.lampOn}
      disabled={a.lampDisabled}
      tip={a.lampTip}
      onPress={() => a.ontoggle?.(!a.lampOn)}
    />
  {:else if a.control === 'tabs'}
    <div role="tablist" aria-label={a.tabsLabel} style:display="flex" style:gap="var(--space-1)">
      {#each a.tabs as tab (tab.id)}<Button
          variant="quiet"
          label={tab.label}
          chosen={tab.id === a.tabsChosen}
          pressed={tab.id === a.tabsChosen}
          tip={tab.tip}
          onPress={() => a.onchoose?.(tab.id)}
        />{/each}
    </div>
  {:else if a.control === 'slider'}
    <input
      type="range"
      aria-label={a.label}
      aria-valuetext="{a.sliderValue} {a.sliderUnit}"
      min={0}
      max={a.sliderMax}
      value={a.sliderValue}
      data-tip={a.sliderTip}
      onchange={(event) => a.onchange?.(Number(event.currentTarget.value))}
      style:width="160px"
      style:accent-color="var(--action)"
    />
    <span style:color="var(--text-2)">{a.sliderValue} {a.sliderUnit}</span>
  {/if}
{/snippet}

{#if story === 'Stack'}
  <div style:max-width="640px" style:padding-inline="var(--space-2)" style:--yh-settings-control-w="200px">
    {#each rows as row, i (row.id)}
      <SettingsRow {...row} label={row.label ?? ''}>{@render control({ ...args, ...STACK_CONTROLS[i], ...row } as Args)}</SettingsRow>
    {/each}
  </div>
{:else}
  <div style:max-width="560px" style:padding-inline="var(--space-2)">
    <SettingsRow id={args.id} label={args.label} hint={args.hint} labelWidth={args.labelWidth}>{@render control(args)}</SettingsRow>
  </div>
{/if}
