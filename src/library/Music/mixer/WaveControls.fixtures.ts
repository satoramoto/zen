import { defineFixtures } from '../../fixtures';
import { frameDeck } from './frames.fixtures';
import type { WaveControlsProps } from './WaveControls.model';

export const waveControlsStories = defineFixtures<WaveControlsProps>()({
  RelativeMovement: { args: {} },
  RollbackAndKeys: { args: {} },
  FocusedCueAndTakeover: { args: {} },
  ScopeAndZoom: { args: {} },
  FullSource: { args: { deck: { ...frameDeck, full: true, playing: false, cueHeld: false, zoom: 0 } } },
  Loading: { args: { deck: { ...frameDeck, status: 'loading', message: 'Reading source…' } } },
});
