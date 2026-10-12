import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { LampButton } from '../LampButton/LampButton';
import { Tabs as LayoutTabs } from '../../../layout';
import { withLibraryTheme } from '../../../storybook';
import { SettingsRow } from './SettingsRow';

type Control = 'lamp' | 'tabs' | 'slider' | 'none';
type Tab = { id: string; label: string; tip?: string };

/** The story's args: SettingsRow's own props plus the stand-in control's, mapped into `children`. */
type Args = {
  label: string;
  hint?: string;
  labelWidth?: number;
  control: Control;
  lampLabel: string;
  lampOn: boolean;
  lampDisabled: boolean;
  lampTip?: string;
  ontoggle: (on: boolean) => void;
  tabs: Tab[];
  tabsChosen: string;
  tabsLabel: string;
  onchoose: (id: string) => void;
  sliderValue: number;
  sliderMax: number;
  sliderUnit: string;
  sliderTip?: string;
  onchange: (value: number) => void;
};

const MAIN_TIMING: Tab[] = [
  { id: 'immediate', label: 'Immediate', tip: 'settings.section_timing' },
  { id: 'nextBar', label: 'Next bar', tip: 'settings.section_timing' },
];

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
      <SettingsRow label={args.label} hint={args.hint} labelWidth={args.labelWidth}>
        {control(args)}
      </SettingsRow>
    </div>
  ),
  args: {
    label: 'Upper',
    hint: 'Chords from the right hand',
    labelWidth: 120,
    control: 'lamp',
    lampLabel: 'On',
    lampOn: true,
    lampDisabled: false,
    ontoggle: fn(),
    tabs: MAIN_TIMING,
    tabsChosen: 'nextBar',
    tabsLabel: 'Main timing',
    onchoose: fn(),
    sliderValue: 10,
    sliderMax: 30,
    sliderUnit: 'ms',
    sliderTip: 'settings.chord_settle',
    onchange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    labelWidth: { control: 'number' },
    control: { control: 'inline-radio', options: ['lamp', 'tabs', 'slider', 'none'], table: { category: 'children' } },
    lampLabel: { control: 'text', table: { category: 'Lamp' } },
    lampOn: { control: 'boolean', table: { category: 'Lamp' } },
    lampDisabled: { control: 'boolean', table: { category: 'Lamp' } },
    lampTip: { control: 'text', table: { category: 'Lamp' } },
    ontoggle: { table: { category: 'Lamp' } },
    tabs: { control: 'object', table: { category: 'Tabs' } },
    tabsChosen: { control: 'select', options: ['immediate', 'nextBar'], table: { category: 'Tabs' } },
    tabsLabel: { control: 'text', table: { category: 'Tabs' } },
    onchoose: { table: { category: 'Tabs' } },
    sliderValue: { control: 'number', table: { category: 'Slider' } },
    sliderMax: { control: 'number', table: { category: 'Slider' } },
    sliderUnit: { control: 'text', table: { category: 'Slider' } },
    sliderTip: { control: 'text', table: { category: 'Slider' } },
    onchange: { table: { category: 'Slider' } },
  },
};

export default meta;
type Story = StoryObj<Args>;

/** The Chord page's Upper row: "Upper", its On lamp lit, and the hint "Chords from the right hand". */
export const Board: Story = {};

/** Manual Bass, shown but not pressable while Upper is off: the lamp disabled, the hint says why. */
export const DisabledLamp: Story = {
  args: { label: 'Manual Bass', hint: 'Works with Upper on', lampOn: false, lampDisabled: true },
};

/** The Style page's Main timing: a run of tabs, Next bar chosen; no hint. */
export const Tabs: Story = {
  args: { label: 'Main timing', hint: '', control: 'tabs' },
};

/** The Chord page's Chord settle: a slider at 10 ms of 30. */
export const Slider: Story = {
  args: { label: 'Chord settle', hint: '', control: 'slider' },
};

/** A name too long for the column: it truncates, and its full text is on hover. */
export const LongLabel: Story = {
  args: { label: 'Fingered on bass with split', hint: 'Lowest note of the left hand sets the bass, the rest the chord' },
};

/**
 * A Settings page's stack: the labels share a column, and with `--yh-settings-control-w` set once
 * on the stack, so do the hints, whatever control each row holds. Hover a row to see its band.
 */
export const Stack: Story = {
  render: (args) => (
    <div style={{ maxWidth: 640, paddingInline: 'var(--space-2)', '--yh-settings-control-w': '200px' } as CSSProperties}>
      <SettingsRow label="Upper" hint="Chords from the right hand">
        <StandInLamp args={{ ...args, label: 'Upper' }} />
      </SettingsRow>
      <SettingsRow label="Manual Bass" hint="Works with Upper on">
        <StandInLamp args={{ ...args, label: 'Manual Bass', lampOn: false, lampDisabled: true }} />
      </SettingsRow>
      <SettingsRow label="Main timing">
        <StandInTabs args={{ ...args, label: 'Main timing' }} />
      </SettingsRow>
      <SettingsRow label="Chord settle" hint="Wait before reading the chord">
        <StandInSlider args={{ ...args, label: 'Chord settle' }} />
      </SettingsRow>
      <SettingsRow label="Pedal" hint="Fader button 7" />
    </div>
  ),
};
