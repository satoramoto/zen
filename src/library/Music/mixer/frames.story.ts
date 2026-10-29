// Story-only command harness. Production code never imports storybook/test.
import { fn } from 'storybook/test';
import type { MixerCommands } from './model';

export function frameCommandSpies(): MixerCommands {
  return {
    setRunning: fn(), stopAll: fn(), loopIn: fn(), loopOut: fn(), setLoopEnabled: fn(),
    setEffect: fn(), setMaster: fn(), setMasterEq: fn(), setDeck: fn(), setDeckEq: fn(), setStemLevel: fn(), launch: fn(),
    moveDeck: fn(), setFocus: fn(), setZoom: fn(), setMoveTogether: fn(),
    setDeckPlaying: fn(), setStemPlaying: fn(), cueDeck: fn(), cueStem: fn(),
  };
}
