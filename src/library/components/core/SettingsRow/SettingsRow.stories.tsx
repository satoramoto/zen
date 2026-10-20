import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { treeStory, withRenderer, type StoryView } from '../../../stories/story';
import {
  controlArgs,
  settingsRowArgTypes,
  settingsRowSample,
  settingsRowStackSample,
  settingsRowStories as s,
  storyControls,
  type SampleArgs,
} from './SettingsRow.fixtures';

/** The story's args: SettingsRow's own props plus the stand-in control's, and the stand-ins' spies. */
type Args = SampleArgs & {
  ontoggle: (on: boolean) => void;
  onchoose: (id: string) => void;
  onchange: (value: number) => void;
};

/** The stand-ins' callbacks, by the keys the sample tree names. */
const handlers = (args: Args) => ({
  toggle: (on: boolean) => args.ontoggle(on),
  choose: (id: string) => args.onchoose(id),
  change: (event: Event) => args.onchange(Number((event.currentTarget as HTMLInputElement).value)),
});

const one: StoryView<Args> = (args) => ({ tree: settingsRowSample(args), handlers: handlers(args) });
const stack: StoryView<Args> = (args) => ({ tree: settingsRowStackSample(args), handlers: handlers(args) });

/**
 * One setting on a Settings page: its name in the label column, then the control, then an
 * optional hint. Each story is a view tree (SettingsRow.fixtures.ts): SettingsRow with a stand-in
 * control (a LampButton, layout Tabs or a native range) in its `children` slot, drawn by React's or
 * Svelte's `Tree` (the toolbar's Renderer). The stand-ins' args are grouped by control.
 */
const meta: Meta<Args> = {
  title: 'Design OS/Components/Core/SettingsRow',
  decorators: [withRenderer, withLibraryTheme],
  render: treeStory(one).render,
  parameters: { layout: 'fullscreen', ...treeStory(one).parameters },
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
export const Stack: Story = treeStory(stack);
