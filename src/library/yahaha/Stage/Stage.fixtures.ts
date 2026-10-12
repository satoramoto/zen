import { boardAppBar } from '../AppBar/AppBar.fixtures';
import { displayBoard, displayStopped } from '../Display/Display.fixtures';
import { faderPageTabs, functionLamps, layerTabs, panelStrips, partLamps, reverbStrips } from '../FaderBank/FaderBank.fixtures';
import { boardKeys } from '../Keys/Keys.fixtures';
import { chorusKnobs, delayKnobs, knobPages, panKnobs, rackKnobs, reverbKnobs, styleKnobs } from '../KnobBank/KnobBank.fixtures';
import { padBanks, padsByBank, quickRackPads } from '../PadBank/PadBank.fixtures';
import { songFormBoard, songFormStopped } from '../SongForm/SongForm.fixtures';
import type { KnobItem } from '../KnobBank/KnobBank';
import { TEMPO_MAX, TEMPO_MIN, type StageProps } from './Stage';

// Composed from the regions' own fixtures, as the original's Stage.fixtures.ts composes its
// regions'. Each region's board is the Stage board's; nothing here restates a region's data,
// except the Tempo knob, which always reads the hero's tempo.

/** A knob page with its Tempo knob set to `bpm`, so the knob and the hero agree. */
export function withTempo(knobs: KnobItem[], bpm: number): KnobItem[] {
  return knobs.map((k) => (k.label === 'Tempo' ? { ...k, value: `${bpm}`, fraction: (bpm - TEMPO_MIN) / (TEMPO_MAX - TEMPO_MIN) } : k));
}

const { width: _barWidth, ...appBar } = boardAppBar;
const { width: _keysWidth, ...keys } = boardKeys;
const { parts: _parts, ...display } = displayBoard;
const { parts: _stoppedParts, ...stoppedDisplay } = displayStopped;

/**
 * The board: Sunday Drive Pop, Am7 in Main B with Main C next after bar 4, running at 104; Right 1
 * Stage Grand 90, Right 2 Silk Strings 72 (soft takeover), Right 3 Brass Section 64 off, Left
 * Finger Bass 80, Style 100, Multi Pad 90, Master 100; the Style knob page, the Quick Racks pads;
 * split F#2 with the left hand's Am7 held.
 */
export const stageBoard = {
  appBar,
  display,
  songForm: songFormBoard,
  faders: {
    strips: panelStrips,
    pageTabs: faderPageTabs,
    page: 'panel',
    layerTabs,
    layer: 'volume',
    partLamps,
    functionLamps,
  },
  knobs: { knobs: withTempo(styleKnobs, display.nowPlaying.bpm), pages: knobPages, page: 0 },
  pads: { pads: quickRackPads, banks: padBanks, bank: 0, lit: true },
  keys,
  status: { text: null },
} satisfies StageProps;

/** Stopped on Main A with Coastal Highway queued, the faders on the Reverb layer, a message on the status line, no keys held. */
export const stageStopped = {
  ...stageBoard,
  display: stoppedDisplay,
  songForm: songFormStopped,
  faders: { ...stageBoard.faders, layer: 'reverb', strips: reverbStrips },
  knobs: { ...stageBoard.knobs, knobs: withTempo(styleKnobs, stoppedDisplay.nowPlaying.bpm) },
  status: { text: 'Style queued: it starts at the next Start', seq: 1 },
  keys: { ...keys, heldLeft: [], heldRight: [] },
} satisfies StageProps;

/** The knob pages' eight knobs, in `knobPages` order (Style, Rack, Pan, Reverb, Chorus, Delay). */
export const stageKnobPages = [styleKnobs, rackKnobs, panKnobs, reverbKnobs, chorusKnobs, delayKnobs];

/** Every pad bank's sixteen pads, in `padBanks` order. */
export const stagePadBanks = padsByBank;

/** The styles ‹ › step through in the Playground (ported from the original's `stageStyles`). */
export const stageStyles = [
  { name: 'Sunday Drive Pop', category: 'Pop & Rock', timeSignature: '4/4', beats: 4 },
  { name: 'Coastal Highway', category: 'Rock', timeSignature: '4/4', beats: 4 },
  { name: 'Ballad Night', category: 'Ballad', timeSignature: '4/4', beats: 4 },
  { name: 'Waltz for Two', category: 'Ballroom', timeSignature: '3/4', beats: 3 },
];

/** The style's own tempo, which Style tempo goes back to. */
export const stageStyleTempo = 104;
