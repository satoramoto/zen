// Surface's stories as plain props: Surface.stories.tsx draws them with either renderer's `Tree`,
// and the tree snapshot prints each. Lamps come from the model's own projection of the sample Set,
// so a story shows what the device would.
import { defineFixtures } from '../../../fixtures';
import { CONTROLS } from '../../model/layout';
import { project } from '../../model/project';
import { sampleSet } from '../../model/sample';
import { initialState } from '../../model/state';
import type { Lamp } from '../../model/types';
import type { SurfaceModelProps } from './Surface.model';

const projected = project(initialState(), sampleSet());

/** Every lamp lit: pads and colour buttons through the lamp table, the rest white. */
const everyLamp: Record<string, Lamp> = Object.fromEntries(
  CONTROLS.filter((c) => c.lamp !== 'none').map((c, i) => [c.id, c.lamp === 'colour' ? { state: 'lit', colour: i % 70 } : { state: 'lit' }] as const),
);

/** One row of each lamp state in one colour, for telling them apart. */
const states: Record<string, Lamp> = {
  'pad-1-1': { state: 'off' }, 'pad-1-2': { state: 'dim', colour: 20 }, 'pad-1-3': { state: 'lit', colour: 20 }, 'pad-1-4': { state: 'pulse', colour: 20 }, 'pad-1-5': { state: 'blink', colour: 20 },
  'pad-2-1': { state: 'lit', colour: 14, shade: 'dark' }, 'pad-2-2': { state: 'lit', colour: 14, shade: 'dim' }, 'pad-2-3': { state: 'lit', colour: 14 }, 'pad-2-4': { state: 'lit', colour: 14, shade: 'bright' }, 'pad-2-5': { state: 'lit', colour: 14, shade: 'light' },
  'pad-3-1': { state: 'lit', colour: 'play' }, 'pad-3-2': { state: 'lit', colour: 'record' }, 'pad-3-3': { state: 'lit', colour: 'select' }, 'pad-3-4': { state: 'lit', colour: 'solo' }, 'pad-3-5': { state: 'lit', colour: 'mute' }, 'pad-3-6': { state: 'lit', colour: 99 },
  play: { state: 'lit', colour: 'play' }, record: { state: 'blink', colour: 'record' }, metronome: { state: 'pulse' }, mute: { state: 'dim', colour: 'mute' }, solo: { state: 'lit', colour: 'solo' }, device: { state: 'lit' }, mix: { state: 'dim' },
  'upper-1': { state: 'lit', colour: 8 }, 'upper-2': { state: 'dim', colour: 8 }, 'lower-1': { state: 'lit', colour: 14 }, 'scene-1': { state: 'lit', colour: 'play' }, 'scene-2': { state: 'blink', colour: 'play' },
};

export const surfaceStories = defineFixtures<SurfaceModelProps>()({
  /** The whole unit as the model projects the sample Set when first switched on. */
  Unit: { args: { lamps: projected.lamps, strip: projected.strip, screen: projected.screen } },
  /** No Set and no lamps: the bare inventory. */
  Bare: { args: {} },
  /** Every lamp lit, through the lamp table. */
  AllLit: { args: { lamps: everyLamp, strip: { kind: 'level', value: 0.6 } } },
  /** Each lamp state, each derived shade and each meaning's colour. */
  LampStates: { args: { lamps: states, strip: { kind: 'bend', value: 0.4 } } },
  /** LED brightness at 30 percent. */
  Dimmed: { args: { lamps: everyLamp, ledBrightness: 30, displayLight: 40, strip: { kind: 'range', from: 0.25, to: 0.5 } } },
  /** The touch trace on. */
  Trace: { args: { lamps: projected.lamps, expression: { inTune: 'pad', inTuneWidth: 0.25, slideRange: 'full', trace: true } } },
  DisplayRegion: { args: { region: 'display', lamps: everyLamp } },
  PadRegion: { args: { region: 'pads', lamps: everyLamp, strip: { kind: 'level', value: 0.3 } } },
  LeftRegion: { args: { region: 'left', lamps: everyLamp } },
  RightRegion: { args: { region: 'right', lamps: everyLamp } },
});
