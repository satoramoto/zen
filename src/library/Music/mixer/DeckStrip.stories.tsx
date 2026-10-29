import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../stories/story';
import { h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { DeckStrip } from './DeckStrip';
import { deckStripModel, type DeckStripProps } from './DeckStrip.model';
import { deckFixtures as f, deckParams, deckReading, deckTheme, readyDeck } from './DeckStrip.fixtures';
import type { MixerCommands } from './model';

const hostCommands = (): MixerCommands => ({
  setRunning: fn(), stopAll: fn(), loopIn: fn(), loopOut: fn(), setLoopEnabled: fn(),
  setEffect: fn(), setMaster: fn(), setMasterEq: fn(), setDeck: fn(), setDeckEq: fn(), setStemLevel: fn(), launch: fn(),
  deckLoopIn: fn(), deckLoopOut: fn(), setDeckLoopEnabled: fn(), resizeLoop: fn(), moveLoop: fn(), quickLoop: fn(),
  setLoopFocus: fn(), setSlip: fn(), setDeckPlaying: fn(), setDeckSync: fn(), cueDeck: fn(), beatJump: fn(),
});

/** The isolated strip inherits exactly the same six-row subgrid as a deck in the source mixer. */
const view = (args: DeckStripProps) => {
  const { tree, handlers } = deckStripModel(args);
  return {
    tree: h('div', { class: 'wdg play-example', style: 'width: 340px; max-width: 100%' },
      h('div', { class: 'play-decks', style: `min-width: 0; grid-template-columns: minmax(0, 1fr); --play-signal: ${args.theme.signal}` }, tree)),
    handlers,
  };
};
const deckStory = treeStory(view);

const meta = {
  id: 'music-deck',
  title: 'Music/Mixer/Deck strip', component: DeckStrip,
  ...deckStory,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  parameters: {
    ...deckStory.parameters,
    layout: 'centered',
    docs: { description: { component: 'The source mix[flow] deck face: hot cues and stem loops, effects, channel strip, routing and transport. Static host fixtures make selected, queued and pending-stop states reproducible. Plays check semantic command intent; the face never invents playback or commits a host queue.' } },
  },
  args: {
    deck: readyDeck, index: 0, loopBeats: 8, params: deckParams, theme: deckTheme,
    commands: hostCommands(), readFrame: () => deckReading,
  },
  argTypes: {
    deck: { control: false }, commands: { control: false }, params: { control: false }, theme: { control: false },
    readFrame: { control: false }, deckProps: { control: false }, index: { control: 'number' }, loopBeats: { control: 'number' },
  },
} satisfies Meta<typeof DeckStrip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'After the rain' })).toBeInTheDocument();
    await expect(canvas.getByText('North Arcade')).toBeInTheDocument();
    await expect(canvas.getByRole('slider', { name: 'Deck 1 filter resonance' })).toHaveAttribute('aria-valuenow', '2');
    await expect(canvas.getByRole('button', { name: 'Deck 1: Drop Drums, selected' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Deck 1: stop all stems' })).toHaveTextContent(/^Stop$/);
    await expect(canvasElement.querySelectorAll('.play-knob-stack')[0]).toHaveAttribute('data-staggered', 'false');
  },
};

export const LaunchingAndStopping: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: launch Intro all stems' }));
    await expect(args.commands.launch).toHaveBeenLastCalledWith('deck-a', 'intro');
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: Build Bass' }));
    await expect(args.commands.launch).toHaveBeenLastCalledWith('deck-a', 'build', 'bass');
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: stop Vocals' }));
    await expect(args.commands.launch).toHaveBeenLastCalledWith('deck-a', null, 'vocals');
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: stop all stems' }));
    await expect(args.commands.launch).toHaveBeenLastCalledWith('deck-a', null);
    // A command is intent, not a local playback decision: this static host has not echoed it.
    await expect(canvas.getByRole('button', { name: 'Deck 1: Drop Drums, selected' })).toHaveAttribute('aria-pressed', 'true');
  },
};

export const QueuedLaunchAndStop: Story = {
  args: { deck: f.QueuedLaunchAndStop },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const queued = canvas.getByRole('button', { name: 'Deck 1: Build Drums, queued' });
    await expect(queued).toHaveTextContent('◷');
    await expect(queued.closest('.play-cell')).toHaveAttribute('data-queued', 'true');
    await expect(canvas.getByRole('button', { name: 'Deck 1: Drop Drums, selected' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Deck 1: stop all stems' })).toHaveTextContent(/^Stop$/);
    await expect(canvas.getByRole('status')).toHaveTextContent('Changes wait for the next bar');
  },
};

export const AllStopsQueued: Story = {
  args: { deck: f.AllStopsQueued },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Deck 1: stop all stems' })).toHaveTextContent('◷ Stop');
  },
};

export const FullMix: Story = {
  args: { deck: f.FullMix },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/LEADER/)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Deck 1: launch Break full mix, queued' })).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('button', { name: 'Deck 1: launch Drop full mix' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('slider', { name: 'Deck 1 Drums level' })).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByRole('button', { name: 'Deck 1: stop all stems' })).toHaveTextContent(/^Stop$/);
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: launch Break full mix, queued' }));
    await expect(args.commands.launch).toHaveBeenLastCalledWith('deck-a', 'break');
  },
};

export const FullStopQueued: Story = {
  args: { deck: f.FullStopQueued },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Deck 1: stop all stems' })).toHaveTextContent('◷ Stop');
  },
};

export const Loops: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    for (const [label, command, extra] of [
      ['Deck 1 loop in', args.commands.deckLoopIn, []], ['Deck 1 loop out', args.commands.deckLoopOut, []],
      ['Deck 1 loop enabled', args.commands.setDeckLoopEnabled, [false]],
      ['Deck 1 halve loop', args.commands.resizeLoop, [.5]], ['Deck 1 double loop', args.commands.resizeLoop, [2]],
      ['Deck 1 move loop back', args.commands.moveLoop, [-1]], ['Deck 1 move loop ahead', args.commands.moveLoop, [1]],
      ['Deck 1 quick loop', args.commands.quickLoop, []],
    ] as const) {
      await userEvent.click(canvas.getByRole('button', { name: label }));
      await expect(command).toHaveBeenLastCalledWith('deck-a', ...extra);
    }
    await expect(canvas.getByRole('button', { name: 'Deck 1 quick loop' })).toHaveAttribute('title', 'Exit loop · 2 bars · 8 beats');
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1 loop settings' }));
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole('dialog', { name: 'Deck 1 loop settings' });
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Deck 1 loop target' }), 'focus');
    await expect(args.commands.setLoopFocus).toHaveBeenLastCalledWith('deck-a', true);
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Deck 1 Slip loops' }));
    await expect(args.commands.setSlip).toHaveBeenLastCalledWith('deck-a', true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('dialog', { name: 'Deck 1 loop settings' })).not.toBeInTheDocument());
    await expect(canvas.getByRole('button', { name: 'Deck 1 loop settings' })).toHaveFocus();
  },
};

export const LoopInPending: Story = {
  args: { deck: f.LoopInPending },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Deck 1 loop enabled' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Deck 1 loop enabled' })).toHaveTextContent('Out…');
    await expect(canvas.getByRole('button', { name: 'Deck 1 halve loop' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1 loop settings' }));
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.getByRole('combobox', { name: 'Deck 1 loop target' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
  },
};

export const RoutingAndPhones: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const route = within(canvas.getByRole('radiogroup', { name: 'Deck 1 crossfade assignment' }));
    await userEvent.click(route.getByRole('radio', { name: 'B' }));
    await expect(args.commands.setDeck).toHaveBeenLastCalledWith('deck-a', 'route', 2);
    await userEvent.click(route.getByRole('radio', { name: 'Thru' }));
    await expect(args.commands.setDeck).toHaveBeenLastCalledWith('deck-a', 'route', 1);
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1 headphone cue' }));
    await expect(args.commands.setDeck).toHaveBeenLastCalledWith('deck-a', 'cue', true);
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1 original full mix' }));
    await expect(args.commands.setDeck).toHaveBeenLastCalledWith('deck-a', 'full', true);
  },
};

export const Transport: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1 play/pause' }));
    await expect(args.commands.setDeckPlaying).toHaveBeenLastCalledWith('deck-a', true);
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1 sync' }));
    await expect(args.commands.setDeckSync).toHaveBeenLastCalledWith('deck-a', false);
    for (const [label, delta] of [['Deck 1 jump forward one beat', 1], ['Deck 1 jump backward one beat', -1]] as const) {
      await userEvent.click(canvas.getByRole('button', { name: label }));
      await expect(args.commands.beatJump).toHaveBeenLastCalledWith('deck-a', delta);
    }
    const cue = canvas.getByRole('button', { name: 'Deck 1 transport cue' });
    await fireEvent.keyDown(cue, { key: ' ' });
    await expect(args.commands.cueDeck).toHaveBeenLastCalledWith('deck-a', true);
    await fireEvent.keyDown(cue, { key: 'Enter' });
    await expect(args.commands.setDeckPlaying).toHaveBeenLastCalledWith('deck-a', true);
    await fireEvent.keyUp(cue, { key: ' ' });
    await expect(args.commands.cueDeck).toHaveBeenLastCalledWith('deck-a', false);
    await userEvent.pointer([{ target: cue, keys: '[MouseLeft>]' }, { keys: '[/MouseLeft]' }]);
    await expect(args.commands.cueDeck).toHaveBeenLastCalledWith('deck-a', false);
  },
};

export const PlayingWhileCueHeld: Story = {
  args: { deck: { ...readyDeck, playing: true, cueHeld: true } },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Deck 1 play/pause' }));
    await expect(args.commands.setDeckPlaying).toHaveBeenLastCalledWith('deck-a', true);
  },
};

export const ChannelControls: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    for (const [name, control, value] of [
      ['Deck 1 effects send A', 'sendA', 100], ['Deck 1 filter', 'filter', 100],
      ['Deck 1 filter resonance', 'filterResonance', 12], ['Deck 1 effects send B', 'sendB', 100],
      ['Deck 1 trim', 'trim', 12], ['Deck 1 level', 'gain', 100],
    ] as const) {
      await fireEvent.keyDown(canvas.getByRole('slider', { name }), { key: 'End' });
      await expect(args.commands.setDeck).toHaveBeenLastCalledWith('deck-a', control, value);
    }
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'Deck 1 Bass level' }), { key: 'Home' });
    await expect(args.commands.setStemLevel).toHaveBeenLastCalledWith('deck-a', 'bass', 0);
    for (const [band, name] of ['High', 'Mid', 'Low'].entries()) {
      await fireEvent.keyDown(canvas.getByRole('slider', { name: `Deck 1 ${name}` }), { key: 'Home' });
      await expect(args.commands.setDeckEq).toHaveBeenLastCalledWith('deck-a', band, -24);
    }
  },
};

export const SixStems: Story = {
  args: { deck: f.SixStems },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stack = canvasElement.querySelector('.play-knob-stack')!;
    await expect(stack).toHaveAttribute('data-staggered', 'true');
    await expect(stack.querySelectorAll('[data-stem-order]')).toHaveLength(6);
    await expect(canvas.getByRole('slider', { name: 'Deck 1 Piano level' })).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByRole('button', { name: 'Deck 1: Intro Piano' })).toBeDisabled();
    await waitFor(() => expect(stack.querySelector('.play-stem-connections > path')?.getAttribute('d')).toMatch(/^M.+ H.+ V/));
    await expect(stack.querySelectorAll('.play-stem-connections mask > rect')).toHaveLength(7);
  },
};

export const Empty: Story = {
  args: { deck: f.Empty },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Empty deck' })).toBeInTheDocument();
    await expect(canvas.getByText('Drop a track here')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Deck 1: launch Intro all stems' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Deck 1 play/pause' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Deck 1 transport cue' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Deck 1 quick loop' })).toBeDisabled();
    const calls = (args.commands.launch as ReturnType<typeof fn>).mock.calls.length;
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: stop all stems' }));
    await expect(args.commands.launch).toHaveBeenCalledTimes(calls);
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
  },
};

export const Loading: Story = { args: { deck: f.Loading } };
export const OptionalReadings: Story = {
  args: {
    deck: { ...readyDeck, filterResonance: undefined, track: { ...readyDeck.track!, bpm: Number.NaN } },
    readFrame: () => ({ decks: {}, masterLevel: 0 }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(/BPM/)).not.toBeInTheDocument();
    await expect(canvas.getByRole('slider', { name: 'Deck 1 filter resonance' })).toHaveAttribute('aria-valuenow', '0');
    await expect(canvas.getByRole('meter', { name: 'Deck 1 left output' })).toBeInTheDocument();
    await expect(canvas.getByRole('meter', { name: 'Deck 1 right output' })).toBeInTheDocument();
  },
};
export const Unavailable: Story = {
  args: { deck: f.Unavailable },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Stems are unavailable');
  },
};

export const UnconnectedHost: Story = {
  args: { commands: { ...hostCommands(), setDeckPlaying: undefined, setDeckSync: undefined, cueDeck: undefined, resizeLoop: undefined, moveLoop: undefined, quickLoop: undefined, setSlip: undefined, beatJump: undefined }, params: { ...deckParams, filterResonance: undefined } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Deck 1 play/pause', 'Deck 1 sync', 'Deck 1 transport cue']) await expect(canvas.getByRole('button', { name })).toBeDisabled();
    await expect(canvas.queryByRole('button', { name: 'Deck 1 quick loop' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Deck 1 loop settings' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('slider', { name: 'Deck 1 filter resonance' })).not.toBeInTheDocument();
  },
};
