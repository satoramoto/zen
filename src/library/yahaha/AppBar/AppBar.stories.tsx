import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { AppBar, type AppBarProps } from './AppBar';
import AppBarSvelte from './AppBar.svelte';
import { appBarArgTypes, appBarStories as s, boardAppBar } from './AppBar.fixtures';

/**
 * The bar on top of every page: the page nav (display pages, a hairline, full pages), the global
 * switches (Metronome with its ▾ settings, Unison, ?), Panic set apart, then the Launchkey and
 * the audio health. The parent owns `chosen` and every switch; a press only calls back. Every
 * story is built from AppBar.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it with
 * React's or Svelte's `Tree`.
 */
const meta = {
  title: 'Yahaha/Components/AppBar',
  component: AppBar,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    ...boardAppBar,
    onChoose: fn(),
    onHealth: fn(),
    onMetronome: fn(),
    onMetronomeSettings: fn(),
    onMetronomeClose: fn(),
    onMetronomeVolume: fn(),
    onMetronomeBell: fn(),
    onUnison: fn(),
    onHelp: fn(),
    onPanic: fn(),
    tipAction: fn(),
  },
  argTypes: appBarArgTypes,
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(AppBar, AppBarSvelte);

/** The Stage board: Stage chosen, the Launchkey connected, "Audio" calm at the right edge, every switch off. */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Pages' });
    await expect(within(nav).getByRole('tab', { name: 'Stage' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(within(nav).getByRole('tab', { name: 'Looper' }));
    await expect(args.onChoose).toHaveBeenLastCalledWith('looper');
    await userEvent.click(canvas.getByRole('button', { name: 'Panic: all notes off' }));
    await expect(args.onPanic).toHaveBeenCalledTimes(1);
  },
};

/** Library chosen: the block moves past the hairline. */
export const Library: Story = story(s.Library);

/** Off the Stage (Settings here): the style and its tempo in the bar's middle, the tabs where they were. */
export const OffStage: Story = story(s.OffStage);

/** The Launchkey unplugged: a hollow ring and the word fades. */
export const NoLaunchkey: Story = story(s.NoLaunchkey);

/** Trouble: Right 3's plugin failed, "R3 failed" in the danger role; a click opens its Channel page. */
export const Trouble: Story = story(s.Trouble);

/** The switches as on the section row's Helpers story: Metronome on, lit in the `transport` hue. */
export const Helpers: Story = {
  ...story(s.Helpers),
  play: async ({ canvasElement }) => {
    const switches = within(canvasElement).getByRole('group', { name: 'Global switches' });
    await expect(within(switches).getByRole('button', { name: 'Metronome' })).toHaveAttribute('data-hue', 'role-2');
  },
};

/** The section row's AllOn: Metronome on with its settings open, Unison and help on. */
export const AllOn: Story = story(s.AllOn);

/** The metronome's settings open, and the synth off: the popover says the click can't sound. */
export const MetronomeNotAudible: Story = story(s.MetronomeNotAudible);

/** The smallest board, 1217 wide: tighter gaps, the name steps aside, every control still there. */
export const Narrow: Story = story(s.Narrow);

/** The board's full 1440 width. */
export const Wide: Story = story(s.Wide);

/**
 * Wired: the bar holds its own state here, so the tabs, switches and popover respond as in the app.
 * React only: the state lives in this story's own React `render`.
 */
export const Live: Story = {
  ...story(s.Live, {
    render: function Live(args: AppBarProps) {
      const [chosen, setChosen] = useState<string | null>(args.chosen ?? 'stage');
      const [metronome, setMetronome] = useState(false);
      const [open, setOpen] = useState(false);
      const [volume, setVolume] = useState(90);
      const [bell, setBell] = useState(true);
      const [unison, setUnison] = useState(false);
      const [help, setHelp] = useState(false);
      return (
        <div style={{ minHeight: 320 }}>
          <AppBar
            {...args}
            chosen={chosen}
            onChoose={setChosen}
            metronome={metronome}
            onMetronome={setMetronome}
            metronomeOpen={open}
            onMetronomeSettings={() => setOpen((o) => !o)}
            onMetronomeClose={() => setOpen(false)}
            metronomeVolume={volume}
            onMetronomeVolume={setVolume}
            metronomeBell={bell}
            onMetronomeBell={setBell}
            unison={unison}
            onUnison={setUnison}
            help={help}
            onHelp={setHelp}
          />
        </div>
      );
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const caret = canvas.getByRole('button', { name: /^Metronome settings/ });
    await userEvent.click(caret);
    await expect(canvas.getByRole('dialog', { name: 'Metronome settings' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog', { name: 'Metronome settings' })).toBeNull();
  },
};
