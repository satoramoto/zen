import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { MasterStrip } from './MasterStrip';
import { MasterStripHost } from './MasterStripHost.react.story';
import MasterStripHostSvelte from './MasterStripHost.story.svelte';
import type { MasterStripProps } from './MasterStrip.model';
import type { MixerCommands, MixerFrame } from './model';
import { masterStripStories as s } from './MasterStrip.fixtures';

function hostCommands(): MixerCommands {
  return {
    setRunning: fn(), stopAll: fn(), loopIn: fn(), loopOut: fn(), setLoopEnabled: fn(),
    setMaster: fn(), setMasterEq: fn(), setEffect: fn(), setEffectParam: fn(),
    setEffectEnabled: fn(), setEffectHighPass: fn(), setEffectsEnabled: fn(), clearEffectTails: fn(), setPhones: fn(),
    setDeck: fn(), setDeckEq: fn(), setStemLevel: fn(), launch: fn(),
  };
}

/** MasterStrip inherits a six-row subgrid in the source mixer; give the isolated story the same slot. */
const masterFrame: Decorator<MasterStripProps> = (Story, { args }) => {
  const { theme } = args as MasterStripProps;
  return <div className="wdg play-example" style={{
    '--play-signal': theme.signal, '--primary': theme.primary, '--amber': theme.primary,
    display: 'grid', gridTemplateColumns: '156px', gridTemplateRows: '30px repeat(5,auto)', width: 156,
    border: '1px solid var(--wdg-edge)', background: 'var(--wdg-face)',
  } as CSSProperties}><Story /></div>;
};

const meta = {
  id: 'music-master',
  title: 'Music/Mixer/Master strip',
  component: MasterStrip,
  decorators: [withRenderer, masterFrame, withMusicScope, withLibraryTheme],
  render: args => <MasterStripHost {...args} />,
  parameters: { layout: 'centered' },
  args: {
    commands: hostCommands(),
    readFrame: fn((): MixerFrame => ({ decks: {}, masterLevel: 0.7, masterStereo: [0.64, 0.51] })),
  },
  argTypes: {
    externalTransport: { control: 'boolean' },
    state: { control: false }, commands: { control: false }, params: { control: false },
    readFrame: { control: false }, theme: { control: false }, deckProps: { control: false },
  },
} satisfies Meta<typeof MasterStrip>;
export default meta;
type Story = StoryObj<MasterStripProps>;
const story = fixtureStories<Story>(MasterStripHost, MasterStripHostSvelte);

/** Source geometry and anatomy, with a deterministic stereo sampler and host-owned state. */
export const Default: Story = story(s.Default, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Master mixer')).toHaveClass('play-master-strip');
    await expect(canvas.getByRole('group', { name: 'Master stereo output' })).toHaveClass('play-master-stereo');
    await expect(canvas.getByRole('slider', { name: 'Crossfader' })).toHaveAttribute('aria-valuetext', 'Center');
    await expect(canvasElement.querySelector('.play-clock')).toHaveTextContent('017.2');
    await waitFor(() => expect(args.readFrame).toHaveBeenCalled());
  },
});

/** Run/Pause and Stop send intent; the host echoes state rather than the face inventing a clock. */
export const Transport: Story = story(s.Transport, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Ⅱ Pause' }));
    await expect(args.commands.setRunning).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(canvas.getByRole('button', { name: '▶ Run' })).toHaveAttribute('aria-pressed', 'false'));
    await userEvent.click(canvas.getByRole('button', { name: '▶ Run' }));
    await expect(args.commands.setRunning).toHaveBeenLastCalledWith(true);
    await userEvent.click(canvas.getByRole('button', { name: '■ Stop' }));
    await expect(args.commands.stopAll).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(canvasElement.querySelector('.play-clock')).toHaveTextContent('001.1'));
  },
});

/** Selected IDs, names, parameters, power and high pass all remain distinct for the two send slots. */
export const FXSelection: Story = story(s.FXSelection, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('slider', { name: 'FX A Delay Feedback' })).toHaveAttribute('aria-valuenow', '35');
    await userEvent.click(canvas.getByRole('combobox', { name: 'FX A effect' }));
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('option', { name: 'A · Reverb' }));
    await expect(args.commands.setEffect).toHaveBeenLastCalledWith('A', 'reverb');
    await waitFor(() => expect(canvas.queryByRole('slider', { name: 'FX A Delay Feedback' })).not.toBeInTheDocument());
    const decay = canvas.getByRole('slider', { name: 'FX A Reverb Decay' });
    await fireEvent.keyDown(decay, { key: 'End' });
    await expect(args.commands.setEffectParam).toHaveBeenLastCalledWith('A', 'reverb', 'decay', 10);
    await userEvent.click(canvas.getByRole('button', { name: 'FX B enabled' }));
    await expect(args.commands.setEffectEnabled).toHaveBeenLastCalledWith('B', true);
    await waitFor(() => expect(canvas.getByRole('button', { name: 'FX B enabled' })).toHaveAttribute('aria-pressed', 'true'));
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'FX B high pass cutoff' }), { key: 'End' });
    await expect(args.commands.setEffectHighPass).toHaveBeenLastCalledWith('B', 100);
    await userEvent.click(canvas.getByRole('combobox', { name: 'FX A effect' }));
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('option', { name: 'A · Chorus' }));
    await expect(args.commands.setEffect).toHaveBeenLastCalledWith('A', 'chorus');
    await waitFor(() => expect(canvas.queryByRole('slider', { name: 'FX A Reverb Decay' })).not.toBeInTheDocument());
    await expect(canvas.getByRole('slider', { name: 'FX A high pass cutoff' })).toBeInTheDocument();
  },
});

/** Every master control maps to its original semantic command, not a generic change callback. */
export const HostCallbacks: Story = story(s.HostCallbacks, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    for (const [label, control, value] of [
      ['BPM', 'bpm', 160], ['Master effects send A', 'masterSendA', 100],
      ['Master filter', 'masterFilter', 100], ['Master effects send B', 'masterSendB', 100],
      ['Master trim', 'masterTrim', 12], ['Crossfader', 'cross', 100],
    ] as const) {
      await fireEvent.keyDown(canvas.getByRole('slider', { name: label }), { key: 'End' });
      await expect(args.commands.setMaster).toHaveBeenLastCalledWith(control, value);
      await waitFor(() => expect(canvas.getByRole('slider', { name: label })).toHaveAttribute('aria-valuenow', String(value)));
    }
    for (const [band, label] of ['Master High', 'Master Mid', 'Master Low'].entries()) {
      await fireEvent.keyDown(canvas.getByRole('slider', { name: label }), { key: 'Home' });
      await expect(args.commands.setMasterEq).toHaveBeenLastCalledWith(band, -24);
    }
    await expect(canvas.getByRole('slider', { name: 'Crossfader' })).toHaveAttribute('aria-valuetext', '100 B');
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'Crossfader' }), { key: 'Home' });
    await expect(args.commands.setMaster).toHaveBeenLastCalledWith('cross', -100);
    await waitFor(() => expect(canvas.getByRole('slider', { name: 'Crossfader' })).toHaveAttribute('aria-valuetext', '100 A'));
  },
});

export const EffectsAndPhones: Story = story(s.EffectsAndPhones, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Effects group' }));
    await expect(args.commands.setEffectsEnabled).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Effects group' })).toHaveAttribute('aria-pressed', 'false'));
    await fireEvent.contextMenu(canvas.getByRole('button', { name: 'Effects group' }));
    const effects = page.getByRole('dialog', { name: 'Effects group' });
    await expect(within(effects).getByRole('button', { name: 'Clear tails' })).toBeEnabled();
    await userEvent.click(within(effects).getByRole('button', { name: 'Clear tails' }));
    await expect(args.commands.clearEffectTails).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('dialog', { name: 'Effects group' })).not.toBeInTheDocument());
    await expect(canvas.getByRole('button', { name: 'Effects group' })).toHaveFocus();
    await fireEvent.keyDown(canvas.getByRole('button', { name: 'Effects group' }), { key: 'F10', shiftKey: true });
    await expect(page.getByRole('dialog', { name: 'Effects group' })).toBeInTheDocument();
    await userEvent.click(page.getByRole('button', { name: 'Close Effects group' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Headphone monitoring' }));
    const phones = page.getByRole('dialog', { name: 'Headphone monitoring' });
    await fireEvent.keyDown(within(phones).getByRole('slider', { name: 'Headphone level' }), { key: 'Home' });
    await expect(args.commands.setPhones).toHaveBeenLastCalledWith('phonesLevel', 0);
    await waitFor(() => expect(within(phones).getByRole('slider', { name: 'Headphone level' })).toHaveAttribute('aria-valuenow', '0'));
    await expect(phones).toBeInTheDocument();
    await fireEvent.keyDown(page.getByRole('slider', { name: 'Headphone Cue Master blend' }), { key: 'End' });
    await expect(args.commands.setPhones).toHaveBeenLastCalledWith('phonesMix', 100);
  },
});

/** Missing stereo and nullish optional host readings use precisely the source defaults. */
export const NullValues: Story = story(s.NullValues, {
  args: { ...s.NullValues.args, readFrame: fn((): MixerFrame => ({ decks: {}, masterLevel: 0 })) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByRole('slider', { name: 'FX A Delay Feedback' })).toHaveAttribute('aria-valuenow', '35');
    await expect(canvas.getByRole('slider', { name: 'FX A high pass cutoff' })).toHaveAttribute('aria-valuenow', '0');
    await expect(canvas.getByRole('button', { name: 'FX B enabled' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Effects group' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Headphone monitoring' }));
    await expect(page.getByRole('slider', { name: 'Headphone level' })).toHaveAttribute('aria-valuenow', '100');
    await expect(page.getByRole('slider', { name: 'Headphone Cue Master blend' })).toHaveAttribute('aria-valuenow', '0');
    await userEvent.keyboard('{Escape}');
  },
});

export const ExternalTransport: Story = story(s.ExternalTransport, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: '▶ Run' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: '■ Stop' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('group', { name: 'Tempo' })).not.toBeInTheDocument();
    await expect(canvasElement.querySelector('.play-clock')).toBeNull();
    await expect(canvas.getAllByRole('combobox')).toHaveLength(2);
    await expect(canvas.getByRole('slider', { name: 'Crossfader' })).toBeInTheDocument();
  },
});

export const PlaybackUnavailable: Story = story(s.PlaybackUnavailable, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const run = canvas.getByRole('button', { name: '▶ Run' });
    await expect(run).toBeDisabled();
    await expect(run).toHaveAttribute('title', 'Four-deck playback is not connected yet');
    await userEvent.click(run);
    await expect(args.commands.setRunning).not.toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: '■ Stop' })).toBeEnabled();
  },
});

export const ReadOnlyEffects: Story = story(s.ReadOnlyEffects, {
  args: { ...s.ReadOnlyEffects.args, commands: {
    ...hostCommands(), setEffectParam: undefined, setEffectHighPass: undefined,
    setEffectEnabled: undefined, setEffectsEnabled: undefined, setPhones: undefined,
  } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const parameter = canvas.getByRole('slider', { name: 'FX A Delay Feedback' });
    await expect(parameter).toHaveAttribute('aria-disabled', 'true');
    await fireEvent.keyDown(parameter, { key: 'End' });
    await expect(parameter).toHaveAttribute('aria-valuenow', '35');
    await expect(canvas.queryByRole('button', { name: 'FX A enabled' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('slider', { name: 'FX A high pass cutoff' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Effects group' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Headphone monitoring' })).not.toBeInTheDocument();
    await fireEvent.keyDown(canvas.getByRole('combobox', { name: 'FX A effect' }), { key: 'ArrowDown' });
    await expect(args.commands.setEffect).toHaveBeenLastCalledWith('A', 'reverb');
  },
});

export const TailsDecaying: Story = story(s.TailsDecaying, {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Effects group' });
    await expect(trigger).toHaveAttribute('aria-pressed', 'false');
    await expect(trigger).toHaveAttribute('title', expect.stringContaining('FX bypassed · tails decaying'));
    await expect(trigger.querySelector('.play-tail-dot')).not.toBeNull();
    await fireEvent.click(trigger, { shiftKey: true });
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Effects group' });
    await expect(within(dialog).getByRole('button', { name: 'Clear tails' })).toBeEnabled();
    await userEvent.keyboard('{Escape}');
  },
});

export const NoEffects: Story = story(s.NoEffects, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('combobox')).toHaveLength(2);
    await expect(canvasElement.querySelectorAll('.play-fx-params .wdg')).toHaveLength(0);
    await fireEvent.keyDown(canvas.getByRole('combobox', { name: 'FX A effect' }), { key: 'ArrowDown' });
    await expect(args.commands.setEffect).not.toHaveBeenCalled();
  },
});
