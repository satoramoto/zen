// SoundCell's stories as plain props: SoundCell.stories.tsx (React) and SoundCell.stories.svelte.ts
// (Svelte) both draw them, and parity.test.tsx renders every instance in both. The marks are a
// React node or a Svelte snippet, so each Storybook adds its own (WithMarks).
import { defineFixtures } from '../../../fixtures';
import type { SoundCellModelProps } from './SoundCell.model';

/** The controls, the same in both Storybooks. */
export const soundCellArgTypes = {
  part: { control: 'text' },
  partName: { control: 'text' },
  hue: { control: 'inline-radio', options: [1, 2, 3, 4, 5] },
  number: { control: 'text' },
  sound: { control: 'text' },
  off: { control: 'boolean' },
  soundName: { control: 'text' },
  partTip: { control: 'text' },
  soundTip: { control: 'text' },
} as const;

/** The args every story starts from (the tooltip keys). */
export const soundCellArgs = { partTip: 'mixer.strip.select', soundTip: 'launchkey.fader_sound' };

export const soundCellStories = defineFixtures<SoundCellModelProps>()({
  Board: { args: { part: 'R1', partName: 'Right 1', hue: 1, number: '1', sound: 'Stage Grand', off: false } },
  Off: { args: { part: 'R3', partName: 'Right 3', hue: 3, number: '57', sound: 'Brass Section', off: true } },
  LongName: { args: { part: 'L', partName: 'Left', hue: 4, number: '208', sound: 'Concert Grand Piano Bright Stereo' } },
  WithMarks: { args: { part: 'R2', partName: 'Right 2', hue: 2, number: '41', sound: 'Warm Strings' } },
  NoNumber: { args: { part: 'R1', partName: 'Right 1', hue: 1, sound: 'User Piano' } },
  Row: {
    args: { part: 'R1', partName: 'Right 1', sound: 'Stage Grand' },
    items: [
      { part: 'R1', partName: 'Right 1', hue: 1, number: '1', sound: 'Stage Grand' },
      { part: 'R2', partName: 'Right 2', hue: 2, number: '41', sound: 'Warm Strings' },
      { part: 'R3', partName: 'Right 3', hue: 3, number: '57', sound: 'Brass Section', off: true },
      { part: 'L', partName: 'Left', hue: 4, number: '208', sound: 'Concert Grand Piano Bright Stereo' },
      { part: '5', partName: 'Slot 5', hue: 5, number: '12', sound: 'Jazz Organ' },
    ],
  },
});
