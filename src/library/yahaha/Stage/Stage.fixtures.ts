import { boardAppBar } from '../AppBar/AppBar.fixtures';
import { displayBoard, displayStopped } from '../Display/Display.fixtures';
import { faderPageTabs, functionLamps, layerTabs, panelStrips, partLamps, reverbStrips } from '../FaderBank/FaderBank.fixtures';
import { boardKeys } from '../../components/music/Keys/Keys.fixtures';
import { chorusKnobs, delayKnobs, knobPages, panKnobs, rackKnobs, reverbKnobs, styleKnobs } from '../KnobBank/KnobBank.fixtures';
import { allPadBanks, allPadsByBank, quickRackPads } from '../PadBank/PadBank.fixtures';
import { songFormBoard, songFormStopped } from '../SongForm/SongForm.fixtures';
import { defineFixtures } from '../../fixtures';
import { component, h, type Node } from '../../view/Tree.model';
import type { KnobItem } from '../KnobBank/KnobBank.model';
import { TEMPO_MAX, TEMPO_MIN, type StageModelProps } from './Stage.model';

type StageProps = StageModelProps;

// Composed from the regions' own fixtures, as the original's Stage.fixtures.ts composes its
// regions'. Each region's board is the Stage board's; nothing here restates a region's data,
// except the Tempo knob, which always reads the hero's tempo.

/** A knob page with its Tempo knob set to `bpm`, so the knob and the hero agree. */
export function withTempo(knobs: KnobItem[], bpm: number): KnobItem[] {
  return knobs.map((k) => (k.label === 'Tempo' ? { ...k, value: `${bpm}`, fraction: (bpm - TEMPO_MIN) / (TEMPO_MAX - TEMPO_MIN) } : k));
}

/** The style's own tempo, which Style tempo goes back to. */
export const stageStyleTempo = 104;

/** The pad banks' tabs: Sections first, as the Launchkey pages them. */
export const stagePadBankNames = allPadBanks;
/** The Quick Racks bank's index in `stagePadBankNames`. */
export const QUICK_RACKS = allPadBanks.indexOf('Quick Racks');
/** The Sections bank's index: the Pads region's default view, where the song's sections live. */
export const SECTIONS = allPadBanks.indexOf('Sections');

const { width: _barWidth, ...appBar } = boardAppBar;
const { width: _keysWidth, ...keys } = boardKeys;
const { parts: _parts, ...heroBoard } = displayBoard;
const { parts: _stoppedParts, ...heroStopped } = displayStopped;
const display = { ...heroBoard, nowPlaying: { ...heroBoard.nowPlaying, styleTempo: stageStyleTempo } };
const stoppedDisplay = { ...heroStopped, nowPlaying: { ...heroStopped.nowPlaying, styleTempo: stageStyleTempo } };

/**
 * The board: Sunday Drive Pop, Am7 in Main B with Main C next after bar 4, running at 104; Right 1
 * Stage Grand 90, Right 2 Silk Strings 72 (soft takeover), Right 3 Brass Section 64 off, Left
 * Finger Bass 80, Style 100, Multi Pad 90, Master 100; the Style knob page, the pads on the
 * Sections bank (drawn from the song form; `pads.pads` is what Quick Racks shows); split F#2 with the
 * left hand's Am7 held. At the style's own tempo, so Style tempo has nothing to do.
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
  pads: { pads: quickRackPads, banks: stagePadBankNames, bank: SECTIONS, lit: true },
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

/** The board on the Quick Racks bank: the pads' own items (`pads.pads`), not the song's sections. */
export const stageQuickRacks = {
  ...stageBoard,
  pads: { ...stageBoard.pads, bank: QUICK_RACKS },
} satisfies StageProps;

/**
 * Every story's args, by the story names of `Stage.stories.tsx` (the Playground is React's alone). Scaled by default: the 1920 × 1080 board drawn to fit.
 */
export const stageStories = defineFixtures<StageProps>()({
  Board: { args: { ...stageBoard, fit: 'scale' } },
  QuickRacks: { args: { ...stageQuickRacks, fit: 'scale' } },
  Stopped: { args: { ...stageStopped, fit: 'scale' } },
  Letterboxed: { args: { ...stageBoard, fit: 'contain', width: 1440, height: 900 } },
  Pillarboxed: { args: { ...stageBoard, fit: 'contain', width: 2560, height: 1080 } },
  Small: { args: { ...stageBoard, fit: 'contain', width: 1217, height: 752 } },
  Narrow: { args: { ...stageBoard, fit: 'contain', width: 900, height: 700 } },
  NarrowScaled: { args: { ...stageBoard, fit: 'scale', width: 900, height: 700 } },
  SplitBoard: { args: { ...stageBoard, fit: 'scale', layout: 'split' } },
  SplitSmall: { args: { ...stageBoard, layout: 'split', fit: 'contain', width: 1217, height: 752 } },
  Transparent: { args: { ...stageBoard, fit: 'contain', width: 1440, height: 900, backdrop: 'transparent' } },
});

/** A slot story's args: the Stage's, and which of its slots the sample fills. */
export interface StageSampleArgs extends StageProps {
  slot: 'page' | 'side';
}

/**
 * The slot stories (`WithPage`, `WithSide`), drawn as view trees (`stageSample`). WithPage: the
 * board split (the hero across the top, as the app's pages want), a sound list in the Display's
 * place at the 1440 × 900 window it is designed for. WithSide: the board with a help card in the
 * hero's right third, scaled.
 */
export const stageSlotStories = defineFixtures<StageSampleArgs>()({
  WithPage: { args: { ...stageBoard, layout: 'split', fit: 'contain', width: 1440, height: 900, slot: 'page' } },
  WithSide: { args: { ...stageBoard, fit: 'scale', slot: 'side' } },
});

/** Fixture content for the `page` slot: Right 1's sound list, a page the app shows in the Display's place. */
export const stagePageSample: Node = h(
  'div',
  { class: 'yh-stage-sample', 'data-part': 'sample-page' },
  component('Text', { role: 'heading', weight: 'strong' }, { slots: { children: ['Right 1 · Sounds'] } }),
  h(
    'div',
    { class: 'yh-stage-sample__grid' },
    ...['Stage Grand', 'Bright Grand', 'Mellow Grand', 'Upright', 'Rhodes', 'Wurli', 'Clav', 'Organ'].map((sound, i) =>
      component('Button', { label: sound, name: `${sound} (sound ${i + 1})`, chosen: i === 0, pressed: i === 0 }, { key: sound }),
    ),
  ),
);

/** Fixture content for the `side` slot: a help card, as the app's help, swap panel and first run use it. */
export const stageSideSample: Node = h(
  'div',
  { class: 'yh-stage-sample', 'data-part': 'sample-side' },
  component('Text', { role: 'heading', weight: 'strong' }, { slots: { children: ['Help · Sections'] } }),
  component('Text', { role: 'body', tone: 'muted' }, { slots: { children: ['Press a section pad to queue it; it lands at the end of the phrase.'] } }),
  component('Button', { label: 'Got it' }),
);

/** A slot story's tree: the Stage with that slot filled by its sample (the tooltip action by key, when the story has one), in a plain block. */
export const stageSample = ({ slot: name, tipAction, ...props }: StageSampleArgs): Node =>
  h(
    'div',
    {},
    component('Stage', props, {
      on: tipAction ? { tipAction: 'tipAction' } : {},
      slots: { [name]: [name === 'page' ? stagePageSample : stageSideSample] },
    }),
  );

/** The knob pages' eight knobs, in `knobPages` order (Style, Rack, Pan, Reverb, Chorus, Delay). */
export const stageKnobPages = [styleKnobs, rackKnobs, panKnobs, reverbKnobs, chorusKnobs, delayKnobs];

/**
 * Every pad bank's sixteen pads, in `stagePadBankNames` order. The Sections entry is PadBank's
 * board fixture; the Stage never shows it, since it draws that bank from the song form.
 */
export const stagePadBanks = allPadsByBank;

/** The styles ‹ › step through in the Playground (ported from the original's `stageStyles`). */
export const stageStyles = [
  { name: 'Sunday Drive Pop', category: 'Pop & Rock', timeSignature: '4/4', beats: 4 },
  { name: 'Coastal Highway', category: 'Rock', timeSignature: '4/4', beats: 4 },
  { name: 'Ballad Night', category: 'Ballad', timeSignature: '4/4', beats: 4 },
  { name: 'Waltz for Two', category: 'Ballroom', timeSignature: '3/4', beats: 3 },
];
