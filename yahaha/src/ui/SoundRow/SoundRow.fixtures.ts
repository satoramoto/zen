import type { ComponentProps } from 'svelte'
import type SoundRow from './SoundRow.svelte'

/**
 * The board's parts: Right 1 Stage Grand, Right 2 Silk Strings (edited), Right 3 Brass Section
 * (off, plugin missing), Left Finger Bass; One Touch 2 applied.
 */
export const soundRowBoard = {
  parts: [
    { id: 'right1', part: 'R1', partName: 'Right 1', hue: 'r1', number: '1', sound: 'Stage Grand' },
    { id: 'right2', part: 'R2', partName: 'Right 2', hue: 'r2', number: '41', sound: 'Silk Strings', edited: true },
    {
      id: 'right3',
      part: 'R3',
      partName: 'Right 3',
      hue: 'r3',
      number: '57',
      sound: 'Brass Section',
      off: true,
      missing: true,
    },
    { id: 'left', part: 'L', partName: 'Left', hue: 'l', number: '33', sound: 'Finger Bass' },
  ],
  oneTouch: 2,
  oneTouchCount: 4,
} satisfies ComponentProps<typeof SoundRow>

/** Every part on, R2's plugin failed, Left playing the Style's bass, a long sound name; no One Touch applied, three in the style. */
export const soundRowClean = {
  parts: [
    { id: 'right1', part: 'R1', partName: 'Right 1', hue: 'r1', number: '3', sound: 'Warm Rhodes' },
    { id: 'right2', part: 'R2', partName: 'Right 2', hue: 'r2', number: '12', sound: 'Sampler Deluxe', failed: true },
    { id: 'right3', part: 'R3', partName: 'Right 3', hue: 'r3', number: '88', sound: 'Soft Pad with Slow Attack and Long Release' },
    { id: 'left', part: 'L', partName: 'Left', hue: 'l', number: '33', sound: 'Finger Bass', bass: true, off: true },
  ],
  oneTouch: 0,
  oneTouchCount: 3,
} satisfies ComponentProps<typeof SoundRow>
