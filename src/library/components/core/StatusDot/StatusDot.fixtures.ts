// StatusDot's stories as plain props: StatusDot.stories.tsx (React) and StatusDot.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every instance in both.
import { defineFixtures } from '../../../fixtures';
import type { StatusDotHue, StatusDotModelProps } from './StatusDot.model';

export const HUES: StatusDotHue[] = ['ok', 'd', 't', 'intro', 'main', 'ending', 'brk', 'fill'];

/** The controls, the same in both Storybooks. */
export const statusDotArgTypes = {
  hue: { control: 'select', options: HUES },
  hollow: { control: 'boolean' },
  glow: { control: 'boolean' },
  size: { control: 'select', options: ['md', 'sm'] },
  visible: { control: 'boolean' },
  name: { control: 'text' },
} as const;

/** The word the Faces story writes beside a dot. */
export const faceWord = ({ hue = 'ok', hollow }: StatusDotModelProps): string => (hollow ? `${hue} armed` : hue);

export const statusDotStories = defineFixtures<StatusDotModelProps>()({
  Board: { args: { hue: 'ok' } },
  Section: { args: { hue: 'main' } },
  Intro: { args: { hue: 'intro' } },
  Stopped: { args: { hue: 'main', visible: false } },
  Disconnected: { args: { hue: 'd', hollow: true } },
  SyncStart: { args: { hue: 'ok', hollow: true } },
  Small: { args: { size: 'sm', hue: 't', glow: false } },
  Named: { args: { hue: 'ok', name: 'Running' } },
  NamedHollow: { args: { hue: 'ok', hollow: true, name: 'Sync start armed' } },
  NamedHidden: { args: { hue: 'ok', name: 'Running', visible: false } },
  // Every hue, solid then hollow, each beside its word (`faceWord`), two to a row.
  Faces: { items: HUES.flatMap((hue) => [{ hue }, { hue, hollow: true }]) },
});
