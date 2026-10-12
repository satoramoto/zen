import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { AppBar, type AppBarProps } from './AppBar';
import { boardAppBar, boardMetronome, displayPageTabs, fullPageTabs } from './AppBar.fixtures';

const PAGE_IDS = [...displayPageTabs, ...fullPageTabs].map((tab) => tab.id);

/**
 * The bar on top of every page: the page nav (display pages, a hairline, full pages), the global
 * switches (Metronome with its ▾ settings, Unison, ?), Panic set apart, then the Launchkey and
 * the audio health. The parent owns `chosen` and every switch; a press only calls back.
 */
const meta = {
  title: 'Yahaha/Components/AppBar',
  component: AppBar,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    ...boardAppBar,
    displayTabs: displayPageTabs,
    fullTabs: fullPageTabs,
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
  argTypes: {
    width: { control: { type: 'number', min: 0, step: 1 } },
    chosen: { control: 'select', options: [null, ...PAGE_IDS], table: { category: 'Tabs' } },
    displayTabs: { control: 'object', table: { category: 'Tabs' } },
    fullTabs: { control: 'object', table: { category: 'Tabs' } },
    launchkey: { control: 'boolean', table: { category: 'StatusDot' } },
    failedPart: { control: 'select', options: [null, 0, 1, 2, 3], table: { category: 'HealthSlot' } },
    synthOn: { control: 'boolean', table: { category: 'HealthSlot' } },
    dropouts: { control: { type: 'number', min: 0, step: 1 }, table: { category: 'HealthSlot' } },
    bufferFrames: { control: 'select', options: [null, 64, 128, 256, 512, 1024], table: { category: 'HealthSlot' } },
    cpu: { control: { type: 'range', min: 0, max: 1.2, step: 0.01 }, table: { category: 'HealthSlot' } },
    metronome: { control: 'boolean', table: { category: 'Switches' } },
    metronomeOpen: { control: 'boolean', table: { category: 'Switches' } },
    metronomeVolume: { control: { type: 'number', min: 0, max: 127, step: 1 }, table: { category: 'Switches' } },
    metronomeBell: { control: 'boolean', table: { category: 'Switches' } },
    metronomeAudible: { control: 'boolean', table: { category: 'Switches' } },
    unison: { control: 'boolean', table: { category: 'Switches' } },
    help: { control: 'boolean', table: { category: 'Switches' } },
    nowPlaying: { control: 'object' },
    end: { control: false },
  },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Stage board: Stage chosen, the Launchkey connected, "Audio" calm at the right edge, every switch off. */
export const Board: Story = {
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
export const Library: Story = {
  args: { chosen: 'library' },
};

/** Off the Stage (Settings here): the style and its tempo in the bar's middle, the tabs where they were. */
export const OffStage: Story = {
  args: { chosen: 'settings', nowPlaying: { style: 'Sunday Drive Pop', tempo: 104 } },
};

/** The Launchkey unplugged: a hollow ring and the word fades. */
export const NoLaunchkey: Story = {
  args: { launchkey: false },
};

/** Trouble: Right 3's plugin failed, "R3 failed" in the danger role; a click opens its Channel page. */
export const Trouble: Story = {
  args: { failedPart: 2 },
};

/** The switches as on the section row's Helpers story: Metronome on, lit in the `transport` hue. */
export const Helpers: Story = {
  args: { metronome: true },
  play: async ({ canvasElement }) => {
    const switches = within(canvasElement).getByRole('group', { name: 'Global switches' });
    await expect(within(switches).getByRole('button', { name: 'Metronome' })).toHaveAttribute('data-hue', 'role-2');
  },
};

/** The section row's AllOn: Metronome on with its settings open, Unison and help on. */
export const AllOn: Story = {
  args: {
    metronome: true,
    metronomeOpen: true,
    metronomeVolume: boardMetronome.volume,
    metronomeBell: boardMetronome.bell,
    unison: true,
    help: true,
  },
  parameters: { layout: 'fullscreen' },
};

/** The metronome's settings open, and the synth off: the popover says the click can't sound. */
export const MetronomeNotAudible: Story = {
  args: { metronome: true, metronomeOpen: true, metronomeAudible: false, synthOn: false },
};

/** The smallest board, 1217 wide: tighter gaps, the name steps aside, every control still there. */
export const Narrow: Story = {
  args: { width: 1217, chosen: 'settings', nowPlaying: { style: 'Sunday Drive Pop', tempo: 104 }, dropouts: 4 },
};

/** The board's full 1440 width. */
export const Wide: Story = {
  args: { width: 1440 },
};

/** Wired: the bar holds its own state here, so the tabs, switches and popover respond as in the app. */
export const Live: Story = {
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const caret = canvas.getByRole('button', { name: /^Metronome settings/ });
    await userEvent.click(caret);
    await expect(canvas.getByRole('dialog', { name: 'Metronome settings' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog', { name: 'Metronome settings' })).toBeNull();
  },
};
