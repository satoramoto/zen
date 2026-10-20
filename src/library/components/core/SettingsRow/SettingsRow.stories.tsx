import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { LampButton } from '../LampButton/LampButton';
import { Tabs as LayoutTabs } from '../../../layout';
import { withLibraryTheme } from '../../../storybook';
import { SettingsRow } from './SettingsRow';
import type { SettingsRowModelProps } from './SettingsRow.model';
import { STACK_CONTROLS, controlArgs, settingsRowArgTypes, settingsRowStories as s, storyControls, type ControlArgs } from './SettingsRow.fixtures';

/** The story's args: SettingsRow's own props plus the stand-in control's, mapped into `children`. */
type Args = SettingsRowModelProps &
  ControlArgs & {
    ontoggle: (on: boolean) => void;
    onchoose: (id: string) => void;
    onchange: (value: number) => void;
  };

/** The lamp: a core LampButton, named by the row's label. */
function StandInLamp({ args }: { args: Args }) {
  return (
    <LampButton
      label={args.lampLabel}
      name={args.label}
      on={args.lampOn}
      disabled={args.lampDisabled}
      tip={args.lampTip}
      onToggle={(on) => args.ontoggle(on)}
    />
  );
}

/** The run of tabs: layout Tabs. */
function StandInTabs({ args }: { args: Args }) {
  return <LayoutTabs name={args.tabsLabel} items={args.tabs} value={args.tabsChosen} onChange={(id) => args.onchoose(id)} />;
}

/** Stand-in for a slider: a native range named by the row's label, with its value beside it. */
function StandInSlider({ args }: { args: Args }) {
  return (
    <>
      <input
        type="range"
        aria-label={args.label}
        aria-valuetext={`${args.sliderValue} ${args.sliderUnit}`}
        min={0}
        max={args.sliderMax}
        defaultValue={args.sliderValue}
        data-tip={args.sliderTip}
        onChange={(event) => args.onchange(Number(event.currentTarget.value))}
        style={{ width: 160, accentColor: 'var(--action)' } as CSSProperties}
      />
      <span style={{ color: 'var(--text-2)' }}>
        {args.sliderValue} {args.sliderUnit}
      </span>
    </>
  );
}

function control(args: Args) {
  if (args.control === 'lamp') return <StandInLamp args={args} />;
  if (args.control === 'tabs') return <StandInTabs args={args} />;
  if (args.control === 'slider') return <StandInSlider args={args} />;
  return undefined;
}

/**
 * One setting on a Settings page: its name in the label column, then the control, then an
 * optional hint. The stories put stand-in controls (library Buttons and a native range) into
 * `children`, picked by `control`; their args are grouped by control in the Controls panel.
 */
const meta: Meta<Args> = {
  title: 'Design OS/Components/Core/SettingsRow',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ maxWidth: 560, paddingInline: 'var(--space-2)' }}>
      <SettingsRow id={args.id} label={args.label} hint={args.hint} labelWidth={args.labelWidth}>
        {control(args)}
      </SettingsRow>
    </div>
  ),
  args: { ...s.Board.args, ...controlArgs, ontoggle: fn(), onchoose: fn(), onchange: fn() },
  argTypes: settingsRowArgTypes,
};

export default meta;
type Story = StoryObj<Args>;

const args = (story: keyof typeof s): Partial<Args> => ({ ...s[story].args, ...storyControls[story] });

/** The Chord page's Upper row: "Upper", its On lamp lit, and the hint "Chords from the right hand". */
export const Board: Story = { args: args('Board') };

/** Manual Bass, shown but not pressable while Upper is off: the lamp disabled, the hint says why. */
export const DisabledLamp: Story = { args: args('DisabledLamp') };

/** The Style page's Main timing: a run of tabs, Next bar chosen; no hint. */
export const Tabs: Story = { args: args('Tabs') };

/** The Chord page's Chord settle: a slider at 10 ms of 30. */
export const Slider: Story = { args: args('Slider') };

/** A name too long for the column: it truncates, and its full text is on hover. */
export const LongLabel: Story = { args: args('LongLabel') };

/**
 * A Settings page's stack: the labels share a column, and with `--yh-settings-control-w` set once
 * on the stack, so do the hints, whatever control each row holds. Hover a row to see its band.
 */
export const Stack: Story = {
  render: (args) => (
    <div style={{ maxWidth: 640, paddingInline: 'var(--space-2)', '--yh-settings-control-w': '200px' } as CSSProperties}>
      {(s.Stack.items ?? []).map((row, i) => (
        <SettingsRow key={row.id} {...row} label={row.label ?? ''}>
          {control({ ...args, ...STACK_CONTROLS[i], ...row })}
        </SettingsRow>
      ))}
    </div>
  ),
};
