// What each push-step-sequencing scenario does and checks. The words are in
// StepSequencing.stories.tsx. On the drum track the first clip is a one-bar beat: kick on the
// beats (steps 1, 5, 9, 13 at sixteenths), snare on two and four, hats on the eighths. Steps read
// left to right, top to bottom, on the upper four rows.
import { initialState } from '../../model/state';
import type { Clip, PushSet, PushState } from '../../model/types';
import { all, cell, down, expect, fillOf, face, GREEN, GREY, given, hit, holdDown, holding, intent, lampState, latch, onTrack, overlay, padColour, press, RED, tableLamp, turn, wait, whiteLamp, HOLD } from '../play';
import type { Play, PlayContext } from '../scenario';

const none = async () => {};
const start = (more: Partial<PushState> = {}, layout?: Record<string, string>) => ({ args: { initialState: { ...initialState(), ...more, notes: { ...initialState().notes, layout: layout ?? {} } } } });
const beat = (set: PushSet): Clip => set.tracks[0].clips[0]!;
/** The bass track on an empty slot, in a melodic layout. */
const bass = (layout: 'melodic' | 'melodic-32', more: (set: PushSet) => void = () => {}, state: Partial<PushState> = {}) => ({
  set: onTrack('t-bass', (set) => {
    set.selection.scene = 1;
    more(set);
  }),
  ...start(state, { 't-bass': layout }),
});
const added = (context: PlayContext) => all(context, 'add-note').map(({ pitch, start: at, length }) => ({ pitch, start: at, length }));
const brightness = (c: HTMLElement, row: number, col: number) => fillOf(face(c, `pad-${row}-${col}`)).reduce((a, b) => a + b, 0);
/** A two-page loop that is playing on its second page. */
const twoPages = (playing: boolean) => (set: PushSet) => {
  const clip = beat(set);
  clip.loop.end = 16;
  clip.length = 16;
  if (!playing) return;
  clip.state = 'playing';
  clip.position = 9;
  set.tracks[0].playing = 0;
  set.transport.playing = true;
};

export const plays = {
  AddingAKick: {
    set: (set) => void (beat(set).notes = beat(set).notes!.filter((n) => !(n.pitch === 36 && n.start === 0))),
    act: async ({ canvasElement: c }) => {
      cell(c, 'pad-1-1').dataset.before = padColour(c, 1, 1);
      await hit(c, 1, 1);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-1-1').dataset.before).toBe(GREY);
      expect(all(context, 'add-note')).toEqual([{ kind: 'edit', action: 'add-note', track: 't-drums', scene: 0, pitch: 36, start: 0, length: 0.25, velocity: 100 }]);
      // Adding a step to a stopped Set starts it.
      expect(all(context, 'play')).toHaveLength(1);
      expect(padColour(c, 1, 1)).not.toBe(GREY);
    },
  },

  RemovingIt: {
    act: async ({ canvasElement: c }) => {
      await hit(c, 1, 5);
    },
    check: (context) => {
      const c = context.canvasElement;
      const removed = intent(context, 'remove-note');
      expect(removed).toMatchObject({ track: 't-drums', scene: 0 });
      expect(removed.notes).toHaveLength(1);
      expect(all(context, 'add-note')).toEqual([]);
      expect(padColour(c, 1, 5)).toBe(GREY);
    },
  },

  VelocityAsBrightness: {
    set: (set) => {
      const kicks = beat(set).notes!.filter((n) => n.pitch === 36);
      kicks[0].velocity = 40;
      kicks[1].velocity = 120;
    },
    act: none,
    check: ({ canvasElement: c }) => {
      expect(padColour(c, 1, 1)).toBe(tableLamp(14, 'dim'));
      expect(padColour(c, 1, 5)).toBe(tableLamp(14, 'bright'));
      expect(brightness(c, 1, 5)).toBeGreaterThan(brightness(c, 1, 1) * 1.3);
    },
  },

  Triplets: {
    act: async (context) => {
      const c = context.canvasElement;
      await press(c, 'scene-3');
      await hit(c, 1, 7);
      await hit(c, 3, 8);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(lampState(c, 'scene-3')).toBe('lit');
      for (const row of [1, 2, 3, 4]) {
        for (const col of [7, 8]) expect(lampState(c, `pad-${row}-${col}`)).toBe('off');
        for (const col of [1, 2, 3, 4, 5, 6]) expect(lampState(c, `pad-${row}-${col}`)).toBe('lit');
      }
      expect(all(context, 'add-note')).toEqual([]);
      expect(all(context, 'remove-note')).toEqual([]);
    },
  },

  Recording: {
    set: (set) => {
      const clip = beat(set);
      clip.state = 'recording';
      clip.position = 1;
      set.tracks[0].playing = 0;
      set.transport.playing = true;
      set.transport.recording = 'session';
    },
    act: async ({ canvasElement: c }) => {
      cell(c, 'pad-1-5').dataset.at = padColour(c, 1, 5);
      await given(c, (set) => void (beat(set).position = 1.25));
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'pad-1-5').dataset.at).toBe(RED);
      // It moves from step to step.
      expect(padColour(c, 1, 6)).toBe(RED);
      expect(padColour(c, 1, 5)).not.toBe(RED);
    },
  },

  EighthNotes: {
    act: async ({ canvasElement: c }) => {
      cell(c, 'scene-6').dataset.before = `${lampState(c, 'scene-4')} ${lampState(c, 'scene-6')}`;
      await press(c, 'scene-6');
      await hit(c, 1, 2);
    },
    check: (context) => {
      const c = context.canvasElement;
      // Sixteenths are the default.
      expect(cell(c, 'scene-6').dataset.before).toBe('lit dim');
      expect(lampState(c, 'scene-6')).toBe('lit');
      expect(lampState(c, 'scene-4')).toBe('dim');
      // Each pad is an eighth: the second starts half a beat in and lasts half a beat.
      expect(added(context)).toEqual([{ pitch: 36, start: 0.5, length: 0.5 }]);
    },
  },

  MutingAStep: {
    act: async ({ canvasElement: c }) => {
      cell(c, 'pad-1-1').dataset.before = padColour(c, 1, 1);
      await holding(c, 'mute', async () => {
        await hit(c, 1, 1);
      });
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'mute-notes')).toMatchObject({ track: 't-drums', scene: 0, muted: true });
      expect(all(context, 'remove-note')).toEqual([]);
      expect(all(context, 'mute')).toEqual([]);
      expect(cell(c, 'pad-1-1').dataset.before).not.toBe(tableLamp(14, 'light'));
      expect(padColour(c, 1, 1)).toBe(tableLamp(14, 'light'));
    },
  },

  SilentSelection: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'select', async () => {
        await hit(c, 8, 4);
      });
      await hit(c, 1, 2);
    },
    check: (context) => {
      expect(all(context, 'note-on')).toEqual([]);
      expect(added(context)).toEqual([{ pitch: 39, start: 0.25, length: 0.25 }]);
    },
  },

  ChangingAStep: {
    ...start({}, { 't-drums': '16-velocities' }),
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'pad-1-1', async () => {
        await hit(c, 8, 5);
      });
    },
    check: (context) => {
      const set = intent(context, 'set-note');
      expect(set).toMatchObject({ track: 't-drums', scene: 0, velocity: 7 });
      expect(set.notes).toHaveLength(1);
      // The step was held, not tapped: its note stays, and the velocity pad did not sound.
      expect(all(context, 'remove-note')).toEqual([]);
      expect(all(context, 'note-on')).toEqual([]);
    },
  },

  FourPages: {
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'pad-5-5', async () => {
        await hit(c, 5, 8);
      });
    },
    check: (context) => {
      // A page is 32 sixteenths: eight beats.
      expect(all(context, 'set-loop')).toEqual([{ kind: 'edit', action: 'set-loop', track: 't-drums', scene: 0, start: 0, end: 32 }]);
      for (const col of [5, 6, 7, 8]) expect(lampState(context.canvasElement, `pad-5-${col}`)).toBe('lit');
    },
  },

  OnePage: {
    act: async ({ canvasElement: c }) => {
      await hit(c, 5, 7);
      await hit(c, 5, 7);
    },
    check: (context) => {
      expect(all(context, 'set-loop').at(-1)).toEqual({ kind: 'edit', action: 'set-loop', track: 't-drums', scene: 0, start: 16, end: 24 });
    },
  },

  PlayingPageOutOfView: {
    set: twoPages(true),
    ...start({ seq: { ...initialState().seq, follow: false, page: 0 } }),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(padColour(c, 5, 5)).toBe(whiteLamp());
      expect(padColour(c, 5, 6)).toBe(GREEN);
      expect(lampState(c, 'pad-5-7')).toBe('off');
    },
  },

  LockingTheView: {
    set: twoPages(true),
    act: async ({ canvasElement: c }) => {
      // Following: the second page, where nothing is yet, is in view.
      cell(c, 'pad-5-5').dataset.before = `${padColour(c, 1, 1) === GREY} ${padColour(c, 5, 5) === GREY}`;
      await hit(c, 5, 5);
      await given(c, (set) => void (beat(set).position = 10));
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-5-5').dataset.before).toBe('true true');
      // The steps stay on the first page (its kick is there) while the second plays.
      expect(padColour(c, 1, 1)).toBe(tableLamp(14, 'bright'));
      expect(padColour(c, 5, 5)).toBe(whiteLamp());
      expect(padColour(c, 5, 6)).toBe(GREEN);
      expect(all(context, 'set-loop')).toEqual([]);
    },
  },

  ATapOutsideTheLoop: {
    act: async ({ canvasElement: c }) => {
      await hit(c, 5, 7);
    },
    check: (context) => {
      expect(all(context, 'set-loop')).toEqual([{ kind: 'edit', action: 'set-loop', track: 't-drums', scene: 0, start: 16, end: 24 }]);
    },
  },

  NextPage: {
    set: twoPages(false),
    act: async ({ canvasElement: c }) => {
      cell(c, 'page-right').dataset.before = `${lampState(c, 'page-left')} ${lampState(c, 'page-right')} ${padColour(c, 5, 5) === whiteLamp()}`;
      await press(c, 'page-right');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'page-right').dataset.before).toBe('off dim true');
      expect(padColour(c, 5, 6)).toBe(whiteLamp());
      expect(padColour(c, 5, 5)).toBe(GREY);
      expect(lampState(c, 'page-right')).toBe('off');
      expect(lampState(c, 'page-left')).toBe('dim');
      // The second page holds no notes.
      expect(padColour(c, 1, 1)).toBe(GREY);
    },
  },

  CopyingPageOneToPageTwo: {
    set: twoPages(false),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'duplicate', async () => {
        await hit(c, 5, 5);
        await hit(c, 5, 6);
      });
    },
    check: (context) => {
      expect(all(context, 'copy-steps')).toEqual([{ kind: 'edit', action: 'copy-steps', track: 't-drums', scene: 0, from: 0, to: 8, length: 8 }]);
      expect(all(context, 'set-loop')).toEqual([]);
    },
  },

  StartingOver: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'delete');
    },
    check: (context) => {
      expect(all(context, 'delete-clip')).toEqual([{ kind: 'edit', action: 'delete-clip', track: 't-drums', scene: 0 }]);
    },
  },

  AChordInOneStep: {
    ...bass('melodic'),
    act: async ({ canvasElement: c }) => {
      await hit(c, 8, 1);
      await hit(c, 6, 1);
      await hit(c, 4, 1);
    },
    check: (context) => {
      // The rows are the scale from the root: the first, third and fifth are C, E and G.
      expect(added(context)).toEqual([{ pitch: 36, start: 0, length: 0.25 }, { pitch: 40, start: 0, length: 0.25 }, { pitch: 43, start: 0, length: 0.25 }]);
      for (const row of [8, 6, 4]) expect(padColour(context.canvasElement, row, 1)).toBe(tableLamp(22, 'bright'));
    },
  },

  APlayingColumn: {
    set: onTrack('t-bass', (set) => {
      const clip = set.tracks[1].clips[0]!;
      clip.state = 'playing';
      clip.position = 0.5;
      set.tracks[1].playing = 0;
      set.transport.playing = true;
    }),
    ...start({}, { 't-bass': 'melodic' }),
    act: async ({ canvasElement: c }) => {
      cell(c, 'pad-1-3').dataset.at = [1, 2, 3, 4, 5, 6, 7, 8].map((row) => padColour(c, row, 3) === GREEN).join(',');
      await given(c, (set) => void (set.tracks[1].clips[0]!.position = 0.75));
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'pad-1-3').dataset.at).toBe(Array(8).fill('true').join(','));
      for (let row = 1; row <= 8; row++) {
        expect(padColour(c, row, 4)).toBe(GREEN);
        expect(padColour(c, row, 3)).not.toBe(GREEN);
      }
    },
  },

  OneNoteUp: {
    ...bass('melodic'),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'octave-up');
      });
      cell(c, 'octave-up').dataset.notice = overlay(c, 'notice')?.textContent ?? '';
      await hit(c, 8, 1);
      await hit(c, 7, 1);
    },
    check: (context) => {
      // Every row is one scale note higher: the lowest is D, the next E.
      expect(added(context).map((n) => n.pitch)).toEqual([38, 40]);
      expect(cell(context.canvasElement, 'octave-up').dataset.notice).toContain('D1 to D2');
    },
  },

  AMomentaryLook: {
    ...bass('melodic', (set) => void (set.selection.scene = 0)),
    act: async ({ canvasElement: c }) => {
      const top = () => [1, 2, 3, 4, 5, 6, 7, 8].map((col) => padColour(c, 1, col)).join('|');
      cell(c, 'layout').dataset.before = top();
      await holdDown(c, 'layout', async () => {
        cell(c, 'layout').dataset.during = top();
      }, HOLD);
      await wait(40);
      cell(c, 'layout').dataset.after = top();
    },
    check: ({ canvasElement: c }) => {
      const { before, during: held, after } = cell(c, 'layout').dataset;
      // The clip is eight beats; a page is eight sixteenths: four pages, the first in view.
      expect(held).toBe([whiteLamp(), GREY, GREY, GREY, '', '', '', ''].join('|'));
      expect(before).not.toBe(held);
      expect(after).toBe(before);
    },
  },

  SelectingAndPlacing: {
    ...bass('melodic-32'),
    act: async ({ canvasElement: c }) => {
      const first = await down(c, 'pad-8-1');
      const second = await down(c, 'pad-8-3');
      await first.up();
      await second.up();
      cell(c, 'pad-8-1').dataset.selected = `${padColour(c, 8, 1)}|${padColour(c, 8, 3)}`;
      await hit(c, 1, 1);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-8-1').dataset.selected).toBe(`${tableLamp(22, 'light')}|${tableLamp(22, 'light')}`);
      expect(added(context)).toEqual([{ pitch: 36, start: 0, length: 0.25 }, { pitch: 40, start: 0, length: 0.25 }]);
    },
  },

  SeveralStepsAtOnce: {
    ...bass('melodic-32'),
    act: async ({ canvasElement: c }) => {
      await hit(c, 8, 1);
      const steps = [];
      for (const col of [1, 2, 3]) steps.push(await down(c, `pad-1-${col}`));
      for (const step of steps) await step.up();
    },
    check: (context) => {
      expect(added(context)).toEqual([{ pitch: 36, start: 0, length: 0.25 }, { pitch: 36, start: 0.25, length: 0.25 }, { pitch: 36, start: 0.5, length: 0.25 }]);
    },
  },

  RemovingOneNoteOfAChord: {
    ...bass('melodic-32', (set) => {
      set.tracks[1].clips[1] = { name: 'Chord', colour: 22, kind: 'midi', state: 'stopped', length: 4, loop: { on: true, start: 0, end: 4 }, notes: [{ id: 'c', pitch: 36, start: 0, length: 0.25, velocity: 100 }, { id: 'e', pitch: 40, start: 0, length: 0.25, velocity: 100 }] };
    }),
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'pad-1-1', async () => {
        // The step's notes light on the lower half.
        cell(c, 'pad-1-1').dataset.lit = [1, 2, 3, 4, 5, 6, 7, 8].map((col) => padColour(c, 8, col) === tableLamp(22, 'bright')).join(',');
        await hit(c, 8, 3);
      });
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'pad-1-1').dataset.lit).toBe('true,false,true,false,false,false,false,false');
      expect(all(context, 'remove-note')).toEqual([{ kind: 'edit', action: 'remove-note', track: 't-bass', scene: 1, notes: ['e'] }]);
      expect(all(context, 'note-on')).toEqual([]);
      expect(all(context, 'add-note')).toEqual([]);
    },
  },

  CopyingAStep: {
    ...bass('melodic-32'),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'duplicate', async () => {
        await hit(c, 1, 1);
        await hit(c, 1, 5);
      });
    },
    check: (context) => {
      expect(all(context, 'copy-steps')).toEqual([{ kind: 'edit', action: 'copy-steps', track: 't-bass', scene: 1, from: 0, to: 1, length: 0.25 }]);
      expect(all(context, 'add-note')).toEqual([]);
    },
  },

  TheFifthRow: {
    ...bass('melodic-32', (set) => void (set.selection.scene = 0)),
    act: async ({ canvasElement: c }) => {
      const row = () => [1, 2, 3, 4, 5, 6, 7, 8].map((col) => padColour(c, 4, col)).join('|');
      cell(c, 'layout').dataset.before = row();
      await holdDown(c, 'layout', async () => {
        cell(c, 'layout').dataset.during = row();
      }, HOLD);
      await wait(40);
      cell(c, 'layout').dataset.after = row();
    },
    check: ({ canvasElement: c }) => {
      const { before, during: held, after } = cell(c, 'layout').dataset;
      // The lowest row of steps is the fifth row from the bottom. An eight-beat clip is one page of 32 sixteenths.
      expect(held).toBe([whiteLamp(), '', '', '', '', '', '', ''].join('|'));
      expect(before).not.toBe(held);
      expect(after).toBe(before);
    },
  },

  VelocityOfTwoSteps: {
    set: (set) => {
      const kicks = beat(set).notes!.filter((n) => n.pitch === 36);
      kicks[0].velocity = 90;
      kicks[1].velocity = 110;
    },
    ...start({ display: 'clip' }),
    act: async ({ canvasElement: c }) => {
      const first = await down(c, 'pad-1-1');
      const second = await down(c, 'pad-1-5');
      cell(c, 'encoder-5').dataset.shown = c.querySelector('.push-display')!.textContent ?? '';
      await turn(c, 'encoder-5', 2);
      await first.up();
      await second.up();
    },
    check: (context) => {
      const shown = cell(context.canvasElement, 'encoder-5').dataset.shown!;
      expect(shown).toContain('Velocity');
      expect(shown).toContain('90 to 110');
      const asked = all(context, 'set-note');
      expect(asked).toHaveLength(2);
      for (const i of asked) {
        expect(i.notes).toHaveLength(2);
        expect(i.velocity).toEqual({ delta: 1 });
      }
      // The steps were held, not tapped: their notes stay.
      expect(all(context, 'remove-note')).toEqual([]);
    },
  },

  AutomationOnAnEmptyStep: {
    ...bass('melodic', () => {}, { device: { ...initialState().device, banks: { 'd-bass': 1 } } }),
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'pad-3-5', async () => {
        await turn(c, 'encoder-2', 1);
      });
    },
    check: (context) => {
      expect(all(context, 'set-parameter')).toHaveLength(1);
      expect(intent(context, 'set-parameter')).toMatchObject({ parameter: 'd-bass.cutoff', track: 't-bass', automation: { start: 1, length: 0.25 } });
      expect(all(context, 'add-note')).toEqual([]);
    },
  },

  AllTheHatsQuieter: {
    ...start({ display: 'clip' }),
    act: async ({ canvasElement: c }) => {
      await latch(c, 'select');
      const hat = await down(c, 'pad-7-3');
      await latch(c, 'select');
      await turn(c, 'encoder-5', -3);
      await hat.up();
    },
    check: (context) => {
      const asked = all(context, 'set-note');
      expect(asked).toHaveLength(3);
      for (const i of asked) {
        // Every hat note in the clip: eight of them.
        expect(i.notes).toHaveLength(8);
        expect(i.velocity).toEqual({ delta: -1 });
      }
      expect(all(context, 'note-on')).toEqual([]);
    },
  },

  ASlideInTheSequencer: {
    ...bass('melodic'),
    act: async ({ canvasElement: c }) => {
      const strip = await down(c, 'strip', { y: 0.3 });
      await strip.move(0.5, 0.6);
      await strip.move(0.5, 0.9);
      await strip.up();
      await hit(c, 8, 1);
    },
    check: (context) => {
      expect(all(context, 'pitch-bend')).toEqual([]);
      expect(all(context, 'modulation')).toEqual([]);
      // The range moved up: the lowest row is no longer C1.
      expect(added(context)[0].pitch as number).toBeGreaterThan(36);
      expect(overlay(context.canvasElement, 'notice')).toHaveTextContent('Note Range');
    },
  },
} satisfies Record<string, Play>;
