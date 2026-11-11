import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { Emulator } from './Emulator';
import EmulatorSvelte from './Emulator.svelte';
import { emulatorStories as s } from './Emulator.fixtures';
import { cell, lampState, press, waitFor } from '../play';

/** A Push 3 emulator: the device over the sample Set, with a stand-in host answering it. */
const meta = {
  title: 'Push/Screens/Emulator',
  component: Emulator,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { onIntent: fn(), onInput: fn(), onState: fn() },
} satisfies Meta<typeof Emulator>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Emulator, EmulatorSvelte);

/** Press Play: the device asks, the stand-in host starts the Set, and the Play lamp lights. */
export const Sample: Story = {
  ...story(s.Sample),
  play: async ({ canvasElement, args }) => {
    await expect(lampState(canvasElement, 'play')).toBe('dim');
    await press(canvasElement, 'play');
    await expect(args.onIntent).toHaveBeenCalledWith({ kind: 'transport', action: 'play' });
    await waitFor(() => expect(lampState(canvasElement, 'play')).toBe('lit'));
    await expect(canvasElement.querySelector('[data-intent="play"]')).not.toBeNull();
  },
};
/** Control Mode: the User button can be pressed. */
export const ControlMode: Story = story(s.ControlMode);
/** A host that refuses: Play is asked and its lamp does not light. */
export const Refusing: Story = {
  ...story(s.Refusing),
  play: async ({ canvasElement, args }) => {
    await press(canvasElement, 'play');
    await expect(args.onIntent).toHaveBeenCalledTimes(1);
    await expect(lampState(canvasElement, 'play')).toBe('dim');
    await expect(cell(canvasElement, 'play')).not.toHaveAttribute('data-held');
  },
};
export const Bare: Story = story(s.Bare);
