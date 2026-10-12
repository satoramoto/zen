import type { ChordReadoutProps } from '../../components/music/ChordReadout/ChordReadout';
import type { DisplayPart, DisplayProps } from './Display';

/** The display's data: its props without the callbacks. */
export type DisplayData = Pick<DisplayProps, 'style' | 'nowPlaying' | 'parts'>;

// Ported from yahaha/src/ui/NowPlaying, StyleLine and SoundRow fixtures: the same sample data.

/** The board's chord: Am7 (A C E G), as the board's left hand holds it, Fingered On Bass. */
export const chordBoard: ChordReadoutProps = {
  chord: 'Am',
  extension: '7',
  notes: [
    { note: 'A', interval: 'R' },
    { note: 'C', interval: 'm3' },
    { note: 'E', interval: '5' },
    { note: 'G', interval: 'm7' },
  ],
  fingering: 'Fingered On Bass',
  held: false,
};

/** The last chord (Cmaj7) held while stopped. */
export const chordStopped: ChordReadoutProps = {
  chord: 'C',
  extension: 'maj7',
  notes: [
    { note: 'C', interval: 'R' },
    { note: 'E', interval: '3' },
    { note: 'G', interval: '5' },
    { note: 'B', interval: '7' },
  ],
  fingering: 'Fingered',
  held: true,
};

/** A long chord name: it steps down the hero sizes to fit its column. */
export const chordLong: ChordReadoutProps = {
  chord: 'C♯m',
  extension: 'maj9(♯11)/G♯',
  notes: [
    { note: 'C♯', interval: 'R' },
    { note: 'E', interval: 'm3' },
    { note: 'G♯', interval: '5' },
    { note: 'C', interval: 'M7' },
    { note: 'D♯', interval: '9' },
    { note: 'G', interval: '♯11' },
  ],
  fingering: 'AI Full Keyboard',
  held: false,
};

/** A long fingering with Keyboard transpose: the small line wraps, nothing is cut off. */
export const chordLongFingering: ChordReadoutProps = {
  ...chordBoard,
  notes: [
    { note: 'A', interval: 'R' },
    { note: 'C', interval: 'm3' },
    { note: 'E', interval: '5' },
    { note: 'G', interval: 'm7' },
    { note: 'B', interval: '9' },
    { note: 'D', interval: '4' },
  ],
  fingering: 'AI Full Keyboard · played Cm7 (Keyboard transpose −3)',
};

/**
 * The board's parts: Right 1 Stage Grand, Right 2 Silk Strings (edited), Right 3 Brass Section
 * (off, plugin missing), Left Finger Bass.
 */
export const partsBoard: DisplayPart[] = [
  { id: 'r1', name: 'Right 1', number: '1', sound: 'Stage Grand' },
  { id: 'r2', name: 'Right 2', number: '41', sound: 'Silk Strings', edited: true },
  { id: 'r3', name: 'Right 3', number: '57', sound: 'Brass Section', off: true, missing: true },
  { id: 'l', name: 'Left', number: '33', sound: 'Finger Bass' },
];

/** Every part on, R2's plugin failed, Left playing the Style's bass, a long sound name. */
export const partsClean: DisplayPart[] = [
  { id: 'r1', name: 'Right 1', number: '3', sound: 'Warm Rhodes' },
  { id: 'r2', name: 'Right 2', number: '12', sound: 'Sampler Deluxe', failed: true },
  { id: 'r3', name: 'Right 3', number: '88', sound: 'Soft Pad with Slow Attack and Long Release' },
  { id: 'l', name: 'Left', number: '33', sound: 'Finger Bass', bass: true, off: true },
];

/** The board: Sunday Drive Pop, Am7 in Main B → Main C at 104 on beat 2 of 4, One Touch 2. */
export const displayBoard: DisplayData = {
  style: { name: 'Sunday Drive Pop', category: 'Pop & Rock', timeSignature: '4/4', queued: '', oneTouch: 2, oneTouchCount: 4 },
  nowPlaying: {
    playing: 'Main B',
    next: 'Main C',
    fill: 'fill after bar 4',
    bar: 3,
    bars: 4,
    bpm: 104,
    running: true,
    syncStart: false,
    chord: chordBoard,
    beat: 2,
    beats: 4,
  },
  parts: partsBoard,
};

/** Stopped with the last chord held, Coastal Highway queued, a clean rack, three One Touch settings. */
export const displayStopped: DisplayData = {
  style: { ...displayBoard.style, queued: 'Coastal Highway', oneTouch: 0, oneTouchCount: 3 },
  nowPlaying: {
    playing: 'Main A',
    next: '',
    fill: '',
    bar: 1,
    bars: 4,
    bpm: 92,
    running: false,
    syncStart: false,
    chord: chordStopped,
    beat: 0,
    beats: 4,
  },
  parts: partsClean,
};

/** Stopped with Sync Start armed and Intro II armed: the band starts on the first chord. */
export const displaySyncStart: DisplayData = {
  ...displayBoard,
  nowPlaying: { ...displayStopped.nowPlaying, next: 'Intro II', syncStart: true, chord: chordBoard },
};

/** A long chord name, stepped down to fit its column. */
export const displayLongChord: DisplayData = {
  ...displayBoard,
  nowPlaying: { ...displayBoard.nowPlaying, chord: chordLong },
};

/** A style name longer than its room: it ends in an ellipsis. */
export const displayLongStyle: DisplayData = {
  ...displayBoard,
  style: { ...displayBoard.style, name: 'Saturday Night Seventies Disco Funk Extended Mix', category: 'Dance' },
};

/** A long fingering: the small line wraps, never cut off. */
export const displayLongFingering: DisplayData = {
  ...displayBoard,
  nowPlaying: { ...displayBoard.nowPlaying, chord: chordLongFingering },
};

/** Right 1 off as well as Right 3. */
export const displayPartOff: DisplayData = {
  ...displayBoard,
  parts: partsBoard.map((p) => (p.id === 'r1' ? { ...p, off: true } : p)),
};

/** A waltz in 3/4: Moonlight Waltz, Ballroom, three beat segments, on beat 3. */
export const displayThreeFour: DisplayData = {
  ...displayBoard,
  style: { ...displayBoard.style, name: 'Moonlight Waltz', category: 'Ballroom', timeSignature: '3/4' },
  nowPlaying: { ...displayBoard.nowPlaying, bpm: 88, beat: 3, beats: 3 },
};

/** Main D looping with nothing queued: "bar 2 of 8" in place of what's next. */
export const displayLooping: DisplayData = {
  ...displayBoard,
  nowPlaying: { ...displayBoard.nowPlaying, playing: 'Main D', next: '', fill: '', bar: 2, bars: 8 },
};

/** A fill with Ending II waiting. */
export const displayFillToEnding: DisplayData = {
  ...displayBoard,
  nowPlaying: { ...displayBoard.nowPlaying, playing: 'Fill', next: 'Ending II', fill: 'after bar 1', bar: 1, bars: 1, bpm: 84 },
};

/** No parts given: the Stage shows sounds on the mixer, so the hero drops its parts column. */
export const displayNoParts: DisplayData = { ...displayBoard, parts: undefined };
