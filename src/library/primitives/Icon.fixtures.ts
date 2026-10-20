// Icon's stories as plain data: Icon.stories.tsx (React) and Icon.stories.svelte.ts (Svelte) both
// draw them, and the parity test renders every story's Icon in both. The glyphs (a play triangle, a
// stop square) are SVG markup each Storybook draws itself, so the Icons are compared without them.
import { defineFixtures } from '../fixtures';
import { ICON_SIZES, type IconModelProps, type IconSize } from './Icon.model';
import { TEXT_TONES, type TextTone } from './Text.model';

/** The Playground's controls (`default` and `inherit` for no prop). */
export interface IconArgs {
  size: IconSize | 'default';
  tone: TextTone | 'inherit';
  label: string;
}

export const iconArgs: IconArgs = { size: 'control', tone: 'primary', label: 'Play' };

export const iconArgTypes = {
  size: { control: 'select', options: ['default', ...ICON_SIZES] },
  tone: { control: 'select', options: ['inherit', ...TEXT_TONES] },
  label: { control: 'text' },
} as const;

/** The Icon props for the Playground's args. */
export const iconProps = ({ size, tone, label }: IconArgs): IconModelProps => ({
  size: size === 'default' ? undefined : size,
  tone: tone === 'inherit' ? undefined : tone,
  label: label || undefined,
});

export const iconStories = defineFixtures<IconModelProps>()({
  Playground: { args: iconProps(iconArgs) },
  /** One per size (the stories draw a play and a stop icon at each, beside text in the same role). */
  Sizes: { items: ICON_SIZES.map((size) => ({ size })) },
  Tones: { items: TEXT_TONES.map((tone) => ({ size: 'heading' as const, tone })) },
});
