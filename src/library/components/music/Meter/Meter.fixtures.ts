// Meter's stories as plain props: Meter.stories.tsx (React) and Meter.stories.svelte.ts (Svelte)
// both draw them, and the parity test renders every instance in both.
import { defineFixtures } from '../../../fixtures';
import type { MeterModelProps } from './Meter.model';

/** The controls, the same in both Storybooks. */
export const meterArgTypes = {
  value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  peak: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  layout: { control: 'inline-radio', options: ['stacked', 'inline', 'inside'] },
  side: { control: 'inline-radio', options: ['left', 'right'] },
  showValue: { control: 'boolean' },
  display: { control: 'text' },
  width: { control: 'number' },
  length: { control: 'number' },
  ink: { control: 'text' },
} as const;

/** Every story's base: the meta args. */
export const meterBase = { value: 0.62, name: 'Level' };

const inside = { ...meterBase, name: 'Energy', layout: 'inside', showValue: true } as const;

export const meterStories = defineFixtures<MeterModelProps>()({
  Default: { args: meterBase },
  Peak: { args: { ...meterBase, value: 0.48, peak: 0.81 } },
  Vertical: { args: { ...meterBase, orientation: 'vertical', value: 0.7, peak: 0.9, showValue: true, length: 96, width: 6 } },
  Inline: { args: { ...meterBase, layout: 'inline', showValue: true } },
  Inside: { args: inside },
  Display: { args: { ...inside, display: 'live' } },
  Clamped: { args: { ...meterBase, value: 1.4, peak: 2, showValue: true } },
  Ink: { args: { ...meterBase, ink: 'var(--hue-3)', peak: 0.75 } },
  // The React story animates the level; the fixture holds one frame of its two meters.
  Driven: {
    args: meterBase,
    items: [
      { value: 0.5, peak: 0.7, showValue: true },
      { orientation: 'vertical', length: 96, value: 0.5, peak: 0.7 },
    ],
  },
});
