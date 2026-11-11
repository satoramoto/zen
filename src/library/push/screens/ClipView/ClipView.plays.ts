// What each push-clip-view scenario does and checks. The words are in ClipView.stories.tsx.
import { initialState } from '../../model/state';
import type { Clip, Note, PushSet, PushState } from '../../model/types';
import { all, app, cell, click, display, expect, given, holding, intent, onTrack, press, rowTexts, screenKind, screenText, tab, tableLamp, turn, waitFor , paramText } from '../play';
import type { Play } from '../scenario';

const none = async () => {};
const inClip = (clip: Partial<PushState['clip']> = {}, more: Partial<PushState> = {}) => ({ args: { initialState: { ...initialState(), display: 'clip' as const, ...more, clip: { selected: [], ...clip } } } });
const note = (id: string, pitch: number, start: number, velocity = 100, length = 0.5): Note => ({ id, pitch, start, length, velocity });
/** A one-bar clip of eight eighth notes on the bass track's first slot. */
const eight = (set: PushSet): Clip => {
  const clip = set.tracks[1].clips[0]!;
  Object.assign(clip, { length: 4, loop: { on: true, start: 0, end: 4 }, notes: [48, 50, 52, 53, 55, 57, 59, 60].map((pitch, i) => note(`n${i + 1}`, pitch, i * 0.5)) });
  return clip;
};
const bass = (more: (set: PushSet, clip: Clip) => void = () => {}) => onTrack('t-bass', (set) => more(set, eight(set)));
const vocals = (more: (set: PushSet, clip: Clip) => void = () => {}) => onTrack('t-vocals', (set) => {
  set.selection.scene = 1;
  more(set, set.tracks[4].clips[1]!);
});
const roll = (c: HTMLElement) => display(c).querySelector<HTMLElement>('.yh-pianoroll')!;
const notes = (c: HTMLElement) => [...display(c).querySelectorAll<HTMLElement>('[data-part="note"]')];
const param = paramText;
/** The span of beats the roll shows, from its spoken name. */
const span = (c: HTMLElement) => (/bars ([\d.]+) to ([\d.]+)/.exec(roll(c).getAttribute('aria-label') ?? '') ?? []).slice(1).map(Number);

export const plays = {
  AMIDIClip: {
    ...inClip(),
    set: bass(),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('clip');
      expect(tab(c, 'top', 1)).toHaveTextContent('Bassline');
      expect(tab(c, 'top', 1)).toHaveAttribute('data-selected', 'true');
      expect(notes(c)).toHaveLength(8);
      // One bar of four beats: three beat marks inside it, at 1.2, 1.3 and 1.4.
      expect(display(c).querySelectorAll('[data-part="beatline"]')).toHaveLength(3);
      expect(display(c).querySelector<HTMLElement>('.push-display__roll')!.style.getPropertyValue('--hue-1')).toBe(tableLamp(22));
      expect(notes(c).every((n) => n.dataset.hue === '1')).toBe(true);
    },
  },

  AnUnnamedAudioClip: {
    ...inClip(),
    set: vocals((_set, clip) => void (clip.name = '')),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(tab(c, 'top', 1)).toHaveTextContent('Audio Clip');
      expect(display(c).querySelector('[data-type="wave"] [data-part="band"]')).not.toBeNull();
      expect(display(c).querySelector('.yh-pianoroll')).toBeNull();
    },
  },

  ASoftNote: {
    ...inClip(),
    set: bass((_set, clip) => void (clip.notes = [note('soft', 48, 0, 30), note('loud', 50, 1, 127)])),
    act: none,
    check: ({ canvasElement: c }) => {
      const [soft, loud] = notes(c).map((n) => Number(getComputedStyle(n).opacity));
      expect(loud - soft).toBeGreaterThan(0.3);
      expect(soft).toBeGreaterThan(0.2);
    },
  },

  ALongClip: {
    // Four bars, zoomed in until one bar is in view.
    ...inClip({ zoom: 0.2 }),
    set: bass((set, clip) => {
      Object.assign(clip, { length: 16, loop: { on: true, start: 0, end: 16 }, state: 'playing', position: 1 });
      set.tracks[1].playing = 0;
      set.transport.playing = true;
    }),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-1').dataset.before = span(c).join(' to ');
      await given(c, (set) => void (set.tracks[1].clips[0]!.position = 9.5));
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-1').dataset.before).toBe('0 to 4');
      // The view has moved to the bar that holds the playhead.
      expect(span(c)).toEqual([8, 12]);
      expect(display(c).querySelector('[data-part="playhead"]')).not.toBeNull();
    },
  },

  ALongerLoop: {
    ...inClip(),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-3', 1);
    },
    check: (context) => {
      expect(all(context, 'set-loop')).toEqual([{ kind: 'edit', action: 'set-loop', track: 't-bass', scene: 0, end: 5 }]);
      expect(param(context.canvasElement, 3)).toContain('5 beats');
    },
  },

  Fine: {
    ...inClip(),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await turn(c, 'encoder-2', 1);
      });
    },
    check: (context) => {
      // A sixteenth is a quarter of a beat: the loop keeps its length and starts a sixteenth later.
      expect(all(context, 'set-loop')).toEqual([{ kind: 'edit', action: 'set-loop', track: 't-bass', scene: 0, start: 0.25, end: 4.25 }]);
    },
  },

  LoopOff: {
    ...inClip(),
    set: bass((_set, clip) => void (clip.loop.on = false)),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(param(c, 2)).toContain('Start');
      expect(param(c, 3)).toContain('End');
      expect(screenText(c)).not.toContain('Loop Length');
      expect(tab(c, 'top', 2)).toHaveTextContent('Loop: Off');
    },
  },

  Cropping: {
    ...inClip(),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      cell(c, 'upper-3').dataset.label = rowTexts(c, 'top')[2];
      await press(c, 'upper-3');
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'upper-3').dataset.label).toBe('Crop');
      expect(all(context, 'crop-clip')).toEqual([{ kind: 'edit', action: 'crop-clip', track: 't-bass', scene: 0 }]);
    },
  },

  ZoomingInOnTheLoopStart: {
    ...inClip(),
    set: bass((_set, clip) => Object.assign(clip, { length: 16, loop: { on: true, start: 4, end: 12 } })),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-1').dataset.before = `${span(c).join(' to ')}|${param(c, 1)}`;
      await turn(c, 'encoder-2', 2);
      await turn(c, 'encoder-1', 12);
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-1').dataset.before).toBe('0 to 16|Zoom 0 to 100 %');
      // The loop now starts at beat 6: the view has narrowed around it.
      const [from, to] = span(c);
      expect(to - from).toBeLessThan(6);
      expect(from).toBeLessThan(6);
      expect(to).toBeGreaterThan(6);
      // The Zoom line's highlighted part has shrunk with it.
      const slider = display(c).querySelector('[data-type="param"][data-col="1"] [role="slider"]')!;
      expect(Number(slider.getAttribute('aria-valuenow'))).toBeLessThan(0.5);
    },
  },

  Recording: {
    ...inClip(),
    set: bass((set, clip) => {
      clip.state = 'recording';
      clip.position = 0;
      set.tracks[1].playing = 0;
      set.transport.recording = 'session';
    }),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-1').dataset.before = `${notes(c).length} ${display(c).querySelectorAll('[data-part="lane"]').length}`;
      // The app gives a note as it is played: an octave above anything in the clip.
      await given(c, (set) => void set.tracks[1].clips[0]!.notes!.push(note('new', 72, 1)));
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-1').dataset.before).toBe('8 13');
      expect(notes(c)).toHaveLength(9);
      // The pitch range has grown to fit it: C2 up to C4.
      expect(display(c).querySelectorAll('[data-part="lane"]')).toHaveLength(25);
    },
  },

  TheSequenceableArea: {
    ...inClip({}, { notes: { ...initialState().notes, layout: { 't-bass': 'melodic' } }, seq: { ...initialState().seq, follow: false, page: 1 } }),
    set: bass((_set, clip) => Object.assign(clip, { length: 8, loop: { on: true, start: 0, end: 8 } })),
    act: none,
    check: ({ canvasElement: c }) => {
      const box = display(c).querySelector<HTMLElement>('[data-part="box"]')!;
      // A page of the Melodic Sequencer is eight sixteenths: the second page is beats 3 and 4 of eight.
      expect(box.style.left).toBe('25%');
      expect(box.style.width).toBe('25%');
      // The pads reach the eight scale notes from C1 to C2: the lowest thirteen of the roll's rows.
      const rows = display(c).querySelectorAll('[data-part="lane"]').length;
      expect(parseFloat(box.style.height)).toBeCloseTo((13 / rows) * 100, 0);
      // The strip at the left marks the pitches that hold notes.
      const density = [...display(c).querySelectorAll<HTMLElement>('[data-part="density"] span')];
      expect(density).toHaveLength(rows);
      expect(density.filter((d) => d.dataset.count !== '0')).toHaveLength(8);
    },
  },

  ByTheJogWheel: {
    ...inClip(),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'jog', 1);
    },
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('clip-notes');
      expect(notes(c).filter((n) => n.hasAttribute('data-emphasis'))).toHaveLength(1);
      // The encoders are the note's parameters now, in place of the clip's.
      expect(param(c, 1)).toContain('Position');
      expect(param(c, 5)).toContain('Velocity');
      expect(screenText(c)).not.toContain('Loop Length');
    },
  },

  TheNextNote: {
    ...inClip({ noteEdit: true }),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      cell(c, 'jog').dataset.before = String(notes(c).findIndex((n) => n.hasAttribute('data-emphasis')));
      await turn(c, 'jog', 1);
    },
    check: ({ canvasElement: c }) => {
      const lit = notes(c).map((n, i) => (n.hasAttribute('data-emphasis') ? i : -1)).filter((i) => i >= 0);
      expect(cell(c, 'jog').dataset.before).toBe('0');
      expect(lit).toEqual([1]);
    },
  },

  PitchOnAnInstrumentTrack: {
    ...inClip({ noteEdit: true }),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-4', 1);
    },
    check: (context) => {
      expect(param(context.canvasElement, 4)).toContain('Pitch');
      expect(all(context, 'set-note')).toEqual([{ kind: 'edit', action: 'set-note', track: 't-bass', scene: 0, notes: ['n1'], pitch: { delta: 1 } }]);
    },
  },

  ADrumRackTrack: {
    ...inClip({ noteEdit: true }),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(param(c, 4)).toContain('Drum Pad');
      expect(screenText(c)).not.toContain('Pitch');
    },
  },

  Probability: {
    ...inClip({ noteEdit: true }),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-7', -3);
    },
    check: (context) => {
      const asked = all(context, 'set-note');
      expect(asked).toHaveLength(3);
      for (const i of asked) expect((i.probability as { delta: number }).delta).toBeLessThan(0);
      expect(param(context.canvasElement, 7)).toContain('97 %');
    },
  },

  AChordsVelocities: {
    ...inClip({ noteEdit: true, highlighted: 'a', selected: ['a', 'b', 'c'] }),
    set: bass((_set, clip) => void (clip.notes = [note('a', 48, 0, 60), note('b', 52, 0, 80), note('c', 55, 0, 100), note('d', 60, 2, 20)])),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-5').dataset.before = param(c, 5);
      await turn(c, 'encoder-5', 1);
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'encoder-5').dataset.before).toBe('Velocity 60 to 100');
      expect(all(context, 'set-note')).toEqual([{ kind: 'edit', action: 'set-note', track: 't-bass', scene: 0, notes: ['a', 'b', 'c'], velocity: { delta: 1 } }]);
      // The three moved together; the fourth note was left alone.
      expect(app(context.canvasElement).getSet().tracks[1].clips[0]!.notes!.map((n) => n.velocity)).toEqual([61, 81, 101, 20]);
    },
  },

  SelectAll: {
    ...inClip({ noteEdit: true }),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      cell(c, 'upper-2').dataset.before = `${rowTexts(c, 'top')[1]}|${rowTexts(c, 'top')[2]}|${notes(c).filter((n) => n.dataset.hue === '5').length}`;
      await press(c, 'upper-2');
    },
    check: async ({ canvasElement: c }) => {
      expect(cell(c, 'upper-2').dataset.before).toBe('Select All|Deselect All|0');
      // A selected note is drawn in white: every note is.
      expect(notes(c).filter((n) => n.dataset.hue === '5')).toHaveLength(8);
      await press(c, 'upper-3');
      expect(notes(c).filter((n) => n.dataset.hue === '5')).toHaveLength(0);
    },
  },

  DeletingTheHighlight: {
    ...inClip({ noteEdit: true }),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'delete');
    },
    check: (context) => {
      expect(all(context, 'delete-notes')).toEqual([{ kind: 'edit', action: 'delete-notes', track: 't-bass', scene: 0, notes: ['n1'] }]);
      expect(all(context, 'delete-clip')).toEqual([]);
      expect(notes(context.canvasElement)).toHaveLength(7);
    },
  },

  ChoosingAWarpMode: {
    ...inClip(),
    set: vocals(),
    act: async ({ canvasElement: c }) => {
      // Beats, Tones, Texture, Re-Pitch, Complex: four choices on, at four steps a choice.
      await turn(c, 'encoder-5', 16);
    },
    check: (context) => {
      expect(all(context, 'set-clip').at(-1)).toEqual({ kind: 'edit', action: 'set-clip', track: 't-vocals', scene: 1, warpMode: 'Complex' });
      expect(param(context.canvasElement, 5)).toContain('Complex');
    },
  },

  Cents: {
    ...inClip(),
    set: vocals(),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-6', 1);
      await holding(c, 'shift', async () => {
        await turn(c, 'encoder-6', 1);
      });
    },
    check: (context) => {
      expect(all(context, 'set-clip')).toEqual([
        { kind: 'edit', action: 'set-clip', track: 't-vocals', scene: 1, transpose: 1 },
        { kind: 'edit', action: 'set-clip', track: 't-vocals', scene: 1, detune: 1 },
      ]);
      expect(param(context.canvasElement, 6)).toContain('1 st 1 ct');
    },
  },

  SettingTheStart: {
    ...inClip(),
    set: vocals(),
    act: async ({ canvasElement: c }) => {
      // The first turn opens the edit options; four more move a beat along.
      await turn(c, 'jog', 5);
      cell(c, 'jog').dataset.options = rowTexts(c, 'top').filter(Boolean).join('|');
      await press(c, 'upper-2');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'jog').dataset.options).toContain('Set 1.1.1|Warp to Grid');
      expect(cell(c, 'jog').dataset.options).toContain('Done');
      expect(all(context, 'set-clip')).toEqual([{ kind: 'edit', action: 'set-clip', track: 't-vocals', scene: 1, startAt: 1 }]);
      expect(display(c).querySelector('[data-part="marker"][data-name="cursor"]')).not.toBeNull();
    },
  },

  LoadingASample: {
    ...inClip(),
    set: onTrack('t-audio'),
    act: async ({ canvasElement: c }) => {
      cell(c, 'swap').dataset.invite = screenText(c);
      await press(c, 'swap');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'swap').dataset.invite).toContain('No Clip');
      expect(cell(c, 'swap').dataset.invite).toContain('Swap');
      expect(screenKind(c)).toBe('browse');
      expect(screenText(c)).toContain('Samples');
      expect(screenText(c)).toContain('Funk Break 98');
    },
  },

  AudioToDrums: {
    ...inClip(),
    set: vocals(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'convert');
      cell(c, 'convert').dataset.offers = rowTexts(c, 'top').filter(Boolean).join('|');
      await press(c, 'upper-6');
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'convert').dataset.offers).toBe('✕|Simpler|Drum Pad|Harmony-MIDI|Melody-MIDI|Drums-MIDI');
      expect(all(context, 'convert')).toEqual([{ kind: 'edit', action: 'convert', track: 't-vocals', to: 'drums-midi', scene: 1 }]);
    },
  },

  SlicesToAKit: {
    set: onTrack('t-sampler'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'convert');
    },
    check: (context) => {
      expect(all(context, 'convert')).toEqual([{ kind: 'edit', action: 'convert', track: 't-sampler', to: 'slices-to-drum-rack', device: 'd-simpler' }]);
    },
  },

  DoubleLoop: {
    ...inClip(),
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'double-loop');
      await press(c, 'quantize');
    },
    check: (context) => {
      expect(all(context, 'double-loop')).toEqual([{ kind: 'edit', action: 'double-loop', track: 't-bass', scene: 0 }]);
      // A quick press of Quantize quantizes the clip: no notes are selected, so all of them.
      expect(all(context, 'quantize')).toEqual([{ kind: 'edit', action: 'quantize', track: 't-bass', scene: 0 }]);
    },
  },
} satisfies Record<string, Play>;

void click;
void intent;
void waitFor;
