import { defineFixtures } from '../../fixtures';
import type { TransportStoryArgs } from './TransportHarness.model';

export const transportStories = defineFixtures<TransportStoryArgs>()({
  Default: { args: { playing: false, disabled: false, withStop: true, withLoop: true, looping: false, loopingPart: false, tempo: 'field', bpm: 124, withNormalSpeed: false, seconds: 187.9, withBeats: true, bar: 2.3125, bars: 32, fine: false, latency: 0, playTitle: '', stopTitle: '' } },
  Playing: { args: { playing: true, looping: true, loopingPart: true } },
  FullRow: { args: { looping: true, loopingPart: true, withNormalSpeed: true, bpm: 128, latency: 0.012 } },
  Mixer: { args: { tempo: 'reading', withLoop: false, withNormalSpeed: true, bpm: 128 } },
  Harness: { args: { withLoop: false, tempo: 'none', withBeats: false, fine: true, latency: 0.0116, seconds: 12.3456 } },
  Disabled: { args: { disabled: true, seconds: 0, bar: 0 } },
  ClockToggle: { args: {} },
  TempoField: { args: { withNormalSpeed: true } },
  TempoDisabled: { args: { tempoDisabled: true } },
  Minimal: { args: { withStop: false, withLoop: false, tempo: 'none', withBeats: false, seconds: 0 } },
});
