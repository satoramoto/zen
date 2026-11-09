import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { host, withHost } from '../host.story';
import { ControlPanel } from './ControlPanel';
import ControlPanelSvelte from './ControlPanel.svelte';
import { controlPanelArgTypes, controlPanelStories as s } from './ControlPanel.fixtures';
import type { ControlPanelProps } from './ControlPanel.model';

// MIDI learn on a control panel: the app's learn mode, the control it waits on, and its mappings,
// all readings; learning and forgetting are asks. `withHost` stands in for the app in both
// renderers: a learn press makes that parameter the one it waits on, and its preset buttons play
// the app mapping it, or a controller moving a value.

const meta = {
  id: 'music-live-control-panel-learn',
  title: 'Music/Live/Control panel/Learn',
  component: ControlPanel,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 960, h: 360 },
    spec: {
      capability: 'live-midi-learn',
      purpose: 'Learn mode on a control panel: asking to learn a control’s parameter, the control the app waits on, and showing and forgetting mappings.',
      requirement: 'Learn mode asks to learn a control’s parameter',
      shall: 'While the app says learn mode is on, pressing a control SHALL ask to learn its parameter instead of moving it, and the control the app is waiting on SHALL be marked until the app maps it or learn mode ends.',
    },
  },
  args: s.Default.args,
  argTypes: controlPanelArgTypes,
} satisfies Meta<typeof ControlPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ControlPanel, ControlPanelSvelte);

/** The app: a learn ask makes that parameter the pending one; presets map it, or move a value as a controller would. */
const app = host<ControlPanelProps>({
  apply: { onLearn: (_props, param: string) => ({ learnTarget: param }) },
  presets: {
    'Story: the app maps it': { learnTarget: undefined, mappings: { cutoff: 'CC 21 · ch 1', delay: 'CC 22 · ch 1' } },
    'Story: a controller moves the filter': { values: { ...s.Default.args!.values, cutoff: 5000 } },
  },
});

const spied = (fixture: Parameters<typeof story>[0]): Story => {
  const st = story(fixture);
  return { ...st, args: { ...fixture.args, onParam: fn(), onTrigger: fn(), onLearn: fn(), onForget: fn() }, parameters: { ...st.parameters, ...app } };
};
const cell = (el: HTMLElement, id: string) => el.querySelector<HTMLElement>(`[data-cell="${id}"]`)!;

export const LearningAFader: Story = scenario(
  {
    name: 'Learning a fader',
    when: 'learn mode is on and a person presses the delay send fader',
    then: 'one learn intent naming the delay send is sent, no parameter intent is sent, and the fader shows it is waiting once the app says so',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'learn Delay send' }));
    },
    check: async ({ canvasElement, args }) => {
      await expect((args.onLearn as ReturnType<typeof fn>).mock.calls).toEqual([['delay']]);
      await expect(args.onParam).not.toHaveBeenCalled();
      await waitFor(() => expect(cell(canvasElement, 'c2')).toHaveAttribute('data-pending', 'true'));
    },
  },
  spied(s.Learning),
) as Story;

export const TheAppMapsIt: Story = scenario(
  {
    name: 'The app maps it',
    when: 'the app stops waiting and gives the delay send a mapping',
    then: 'the fader stops showing it is waiting and shows its mapping',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Story: the app maps it' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(cell(canvasElement, 'c2')).not.toHaveAttribute('data-pending'));
      await expect(within(cell(canvasElement, 'c2')).getByText('CC 22')).toBeTruthy();
    },
  },
  spied(s.Pending),
) as Story;

export const LearnModeOff: Story = scenario(
  {
    name: 'Learn mode off',
    when: 'learn mode is off',
    then: 'pressing a control moves it as usual and asks to learn nothing',
    act: async ({ canvasElement }) => {
      const pad = within(cell(canvasElement, 'c6')).getByRole('button');
      await fireEvent.pointerDown(pad, { pointerId: 2, button: 0 });
      await fireEvent.pointerUp(pad, { pointerId: 2, button: 0 });
    },
    check: async ({ args }) => {
      await expect((args.onTrigger as ReturnType<typeof fn>).mock.calls.length).toBe(2);
      await expect(args.onLearn).not.toHaveBeenCalled();
    },
  },
  spied(s.Mapped),
) as Story;

export const AMappedControlOnStage: Story = scenario(
  {
    requirement: 'Mappings are shown and can be forgotten',
    shall: 'A control whose parameter the app has mapped SHALL show the mapping in the app’s words, in learn mode and out of it, and in learn mode SHALL offer to forget it.',
    name: 'A mapped control on stage',
    when: 'the filter is mapped to `CC 21 · ch 1` and learn mode is off',
    then: 'the fader shows a small `CC 21` mark and plays as usual',
    check: async ({ canvasElement }) => {
      await expect(within(cell(canvasElement, 'c1')).getByText('CC 21')).toHaveAttribute('title', 'CC 21 · ch 1');
      await expect(within(cell(canvasElement, 'c1')).getByRole('slider', { name: 'Filter' })).toBeTruthy();
      await expect(within(canvasElement).queryByRole('button', { name: /^forget/ })).toBeNull();
    },
  },
  spied(s.Mapped),
) as Story;

export const ForgettingAMapping: Story = scenario(
  {
    requirement: 'Mappings are shown and can be forgotten',
    shall: 'A control whose parameter the app has mapped SHALL show the mapping in the app’s words, in learn mode and out of it, and in learn mode SHALL offer to forget it.',
    name: 'Forgetting a mapping',
    when: 'learn mode is on and a person forgets the filter’s mapping',
    then: 'one forget intent naming the filter is sent',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'forget Filter’s mapping' }));
    },
    check: async ({ args }) => {
      await expect((args.onForget as ReturnType<typeof fn>).mock.calls).toEqual([['cutoff']]);
      await expect(args.onLearn).not.toHaveBeenCalled();
    },
  },
  spied(s.Learning),
) as Story;

export const AHardwareMove: Story = scenario(
  {
    requirement: 'Mappings are shown and can be forgotten',
    shall: 'A control whose parameter the app has mapped SHALL show the mapping in the app’s words, in learn mode and out of it, and in learn mode SHALL offer to forget it.',
    name: 'A hardware move',
    when: 'the app moves the filter’s value because a controller moved',
    then: 'the fader follows it like any other reading',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Story: a controller moves the filter' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(cell(canvasElement, 'c1').textContent).toMatch(/5\.00\s*kHz/));
    },
  },
  spied(s.Mapped),
) as Story;
