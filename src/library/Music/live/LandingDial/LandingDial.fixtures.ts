// LandingDial's stories as plain props: LandingDial.stories.tsx draws them with React's or
// Svelte's `Tree`. A riser carrying the set into Wire: eight bars, three left, half a bar in.
import { defineFixtures } from '../../../fixtures';
import type { LandingDialProps } from './LandingDial.model';

/** RISER into Wire (118, G), the drop on the one: bar 6 of 8, two and a half beats in. */
export const landingDialBoard: LandingDialProps = {
  via: 'RISER',
  lands: 'Wire',
  landsHint: '118 · G',
  hit: 'DROP',
  target: 'song',
  length: 8,
  barsLeft: 3,
  beat: 22.5,
  armed: true,
};

/** The controls, the same in both Storybooks. */
export const landingDialArgTypes = {
  via: { control: 'text' },
  lands: { control: 'text' },
  landsHint: { control: 'text' },
  hit: { control: 'text' },
  target: { control: 'inline-radio', options: ['song', 'section', 'scene'] },
  length: { control: 'inline-radio', options: [4, 8, 16] },
  barsLeft: { control: { type: 'number', min: 0, max: 16 } },
  beat: { control: { type: 'number', min: 0, step: 0.25 } },
  armed: { control: 'boolean' },
  form: { control: 'inline-radio', options: ['dial', 'chip'] },
  onTarget: { control: false },
  onLength: { control: false },
  onCancel: { control: false },
} as const;

/** Every story's args by export name. */
export const landingDialStories = defineFixtures<LandingDialProps>()({
  Default: { args: landingDialBoard },
  /** The last bar of a four-bar fill into the next section, three beats in: gone, now and the downbeat. */
  EveryState: { args: { ...landingDialBoard, via: 'FILL', lands: 'Chorus', landsHint: 'bar 33', hit: 'KICK', target: 'section', length: 4, barsLeft: 1, beat: 15 } },
  /** Sixteen bars, nothing gone yet: a long build just armed. */
  Long: { args: { ...landingDialBoard, length: 16, barsLeft: 16, beat: 0.75 } },
  /** Set up but not counting: a dashed ring, "not armed". */
  Disarmed: { args: { ...landingDialBoard, armed: false, barsLeft: 8 } },
  /** The `chip` form: one line. */
  Dense: { args: { ...landingDialBoard, form: 'chip' } },
  /** Nothing queued: disarmed, no destination. */
  Empty: { args: { via: '', lands: '', target: 'song', length: 8, barsLeft: 8, beat: 0, armed: false } },
  /** No callbacks: the dial read, not pressed. */
  Disabled: { args: landingDialBoard },
});
