import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { withMixerTheme } from '../stories/MixerTheme.story';
import { PreviewMixer } from '../stories/PreviewMixer.story';
import { MixerView } from './MixerView';
import MixerViewSvelte from './MixerView.svelte';
import type { MixerCommands } from './model';
import { mixerStories as s, mixerFrames } from './MixerView.fixtures';

const meta = {
  id: 'music-four-deck-mixer',
  title: 'Music/Mixer/Four-deck mixer',
  component: MixerView,
  tags: ['autodocs'],
  decorators: [withRenderer, withMixerTheme, withMusicScope, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'The original four-deck face on a silent simulation: four decks, sixteen stems, host-owned state, commands, parameters and a read-only clock. Choose mixflow / Dark for source fidelity; the normal Zen toolbar remains free to change every pack and facet. Default and Interactive use a React-only stateful harness. The fixed-clock specimens use both React and Svelte through the Renderer toolbar. No audio is produced.' } },
  },
  args: {
    state: s.Reference.args!.state!, params: s.Reference.args!.params!,
    commands: previewCommands(), readFrame: () => mixerFrames.Reference,
    theme: { primary: 'var(--primary)', signal: 'var(--signal)', stems: {}, decks: {} },
    externalTransport: false,
  },
  argTypes: {
    externalTransport: { control: 'boolean', description: 'The host already displays its shared transport above the mixer.' },
    state: { control: false }, commands: { control: false }, readFrame: { control: false },
    theme: { control: false }, params: { control: false }, deckProps: { control: false },
  },
} satisfies Meta<typeof MixerView>;
export default meta;
type Story = StoryObj<typeof meta>;
const fixtureStory = fixtureStories<Story>(MixerView, MixerViewSvelte);

// Only the commands supplied by the original silent simulator: optional engine controls stay
// absent/disabled, so the static Reference has the same anatomy as the source opening state.
function previewCommands(): MixerCommands {
  return {
    setRunning: fn(), stopAll: fn(), loopIn: fn(), loopOut: fn(), setLoopEnabled: fn(),
    deckLoopIn: fn(), deckLoopOut: fn(), setDeckLoopEnabled: fn(),
    setLoopBeats: fn(), setQuantize: fn(), setLaunchBeats: fn(),
    setEffect: fn(), setMaster: fn(), setMasterEq: fn(),
    setDeck: fn(), setDeckEq: fn(), setStemLevel: fn(), launch: fn(),
  };
}
function fixedStory(name: keyof typeof s, extra: Partial<Story> = {}): Story {
  const story = fixtureStory(s[name], {
    args: { ...s[name].args, commands: previewCommands(), readFrame: () => mixerFrames[name] },
  });
  return { ...story, ...extra, args: { ...story.args, ...extra.args }, parameters: { ...story.parameters, ...extra.parameters } };
}

/** Exact original opening state. No automatic play: this is the before/after screenshot baseline. */
export const FourDecks: Story = {
  name: 'Default',
  render: ({ externalTransport, theme }) => <PreviewMixer externalTransport={externalTransport} theme={theme} />,
  parameters: {
    docs: { description: { story: 'Original paused opening composition, unchanged by an automatic play. Run starts the silent clock, Pause holds pending choices, Stop clears selections, queues, loops and position. The toolbar colours it. React-only live harness; use Reference for the dual-renderer frozen equivalent.' } },
  },
};

/** Exercise the simulation without changing Four Decks' screenshot baseline. React harness only. */
export const Interactive: Story = {
  ...FourDecks,
  name: 'Interactive',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: Verse Drums' }));
    await expect(canvas.getByRole('button', { name: 'Deck 1: Verse Drums, selected' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Deck 1: Drop Drums' })).toHaveAttribute('aria-pressed', 'false');

    const level = canvas.getByRole('slider', { name: 'Deck 1 level' });
    level.focus();
    await userEvent.keyboard('{Home}');
    await expect(level).toHaveAttribute('aria-valuenow', '0');
    await userEvent.keyboard('{End}');
    await expect(level).toHaveAttribute('aria-valuenow', '100');

    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1 original full mix' }));
    await expect(canvas.getByRole('button', { name: 'Deck 1 original full mix' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('slider', { name: 'Deck 1 Drums level' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1 original full mix' }));

    // This arg also works in the live story, not only in frozen specimens.
    if (args.externalTransport) {
      await expect(canvas.queryByRole('button', { name: /Run/ })).toBeNull();
      return;
    }
    await userEvent.click(canvas.getByRole('button', { name: /Run/ }));
    await expect(canvas.getByRole('button', { name: /Pause/ })).toHaveAttribute('aria-pressed', 'true');
    // Stop the real-time clock again so the play leaves no running animation behind.
    await userEvent.click(canvas.getByRole('button', { name: /Pause/ }));
    await expect(canvas.getByRole('button', { name: /Run/ })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(canvas.getByRole('button', { name: /■ Stop/ }));
    await expect(canvas.getByRole('button', { name: 'Deck 1: Verse Drums' })).toHaveAttribute('aria-pressed', 'false');
    await expect(canvasElement.querySelector('.play-clock')).toHaveTextContent('001.1');
  },
};

/** Frozen beat zero, identical input data to the original paused Four Decks. Both renderers. */
export const Reference: Story = fixedStory('Reference');

/** Host reports playback at beat 49.5 with a 16-beat loop; sampling never advances it. */
export const RunningReference: Story = fixedStory('RunningReference', {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.play-clock')).toHaveTextContent('013.2');
    await expect(canvasElement.querySelector('.play-loop-region')).toHaveAttribute('data-enabled', 'true');
  },
});

/** Pending stem starts, a pending stop and a pending full-mix section, at fixed beat 51.25. */
export const Queued: Story = fixedStory('Queued', {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Deck 1: Break Drums, queued' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Deck 4: launch Break full mix, queued' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: launch Verse all stems' }));
    await expect(args.commands!.launch).toHaveBeenCalledWith('deck-a', 'verse');
    await userEvent.click(canvas.getByRole('button', { name: 'Deck 1: stop Bass' }));
    await expect(args.commands!.launch).toHaveBeenCalledWith('deck-a', null, 'bass');
  },
});

/** Four, five and six stems use the original grid geometry, rather than assuming four everywhere. */
export const FourToSixStems: Story = fixedStory('FourToSixStems', {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Deck 2: Drop Guitar, selected' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Deck 3: Drop Piano, selected' })).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.play-deck')[2]).toHaveStyle('--play-stems: 6');
  },
});

/** A partial six-stem source, empty deck, loading source and missing source. */
export const EmptyLoadingUnavailable: Story = fixedStory('EmptyLoadingUnavailable', {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Empty deck' })).toBeInTheDocument();
    await expect(canvas.getByRole('status', { name: 'Deck 3 loading' })).toHaveTextContent('Reading track');
    await expect(canvas.getByRole('button', { name: 'Deck 4: launch Intro all stems' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Deck 1: Intro Piano' })).toBeDisabled();
    await expect(canvas.getByText('Source file not found. Relink this track to continue.')).toBeInTheDocument();
  },
});

/** Read-only host snapshot: independent 4–6 stem lanes, cue/loop marks and a whole-track lane. */
export const SourceLanes: Story = fixedStory('SourceLanes', {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Deck 3 Piano waveform')).toBeInTheDocument();
    await expect(canvas.getByLabelText('Deck 4 Original waveform')).toBeInTheDocument();
    await expect(canvasElement.querySelector('.play-cue-marker')).toBeInTheDocument();
  },
});

/** Embedded by a host with its own transport: only the shared transport, tempo and clock disappear. */
export const ExternalTransport: Story = fixedStory('ExternalTransport', {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    if (args.externalTransport) {
      await expect(canvas.queryByRole('button', { name: /Run/ })).toBeNull();
      await expect(canvasElement.querySelector('.play-clock')).toBeNull();
    }
    await expect(canvas.getByRole('slider', { name: 'Crossfader' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Deck 1 play/pause' })).toBeInTheDocument();
  },
});
