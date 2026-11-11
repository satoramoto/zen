// What each push-note-mode scenario does and checks. The words are in NoteMode.stories.tsx. The
// bass track holds a synth: on it the pads are the 64 Notes layout.
import { noteName, padPitch } from '../../model/scales';
import type { PushSet, ScaleSettings } from '../../model/types';
import { all, app, cell, column, down, expect, given, intent, lamp, lampState, onTrack, overlay, pads, press, screenKind, tab, turn, wait } from '../play';
import type { Play, PlayContext } from '../scenario';

const bass = (more: (set: PushSet) => void = () => {}) => onTrack('t-bass', more);
const none = async () => {};
const BOTTOM_LEFT = 'pad-8-1';
/** Press pads in turn and read the notes asked, by name. */
const played = (context: PlayContext) => all(context, 'note-on').map((i) => noteName(i.pitch as number));
const strike = async (c: HTMLElement, ...ids: string[]) => {
  for (const id of ids) await press(c, id);
};
const pitchOf = (el: HTMLElement, scale: ScaleSettings) => padPitch(Number(el.dataset.row), Number(el.dataset.col), scale);
const BLUE = 'var(--push-lamp-22)'; // the bass track's colour in the sample Set

export const plays = {
  TheDefaultGrid: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await strike(c, BOTTOM_LEFT, 'pad-8-2', 'pad-7-1');
    },
    check: (context) => {
      expect(played(context)).toEqual(['C1', 'D1', 'F1']);
    },
  },

  ATriadShape: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await strike(c, BOTTOM_LEFT, 'pad-8-3', 'pad-7-2');
    },
    check: (context) => {
      expect(played(context)).toEqual(['C1', 'E1', 'G1']);
    },
  },

  RootsStandOut: {
    set: bass(),
    act: none,
    check: ({ canvasElement: c }) => {
      const scale = app(c).getSet().scale;
      for (const el of pads(c)) {
        const isC = pitchOf(el, scale) % 12 === 0;
        expect(el.style.getPropertyValue('--push-lamp').includes(BLUE), el.dataset.control).toBe(isC);
        if (!isC) expect(el.style.getPropertyValue('--push-lamp'), el.dataset.control).toContain('var(--push-white)');
        expect(el.dataset.lamp).toBe('lit');
      }
    },
  },

  ASoundingNote: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      // E2 is on three pads in fourths: hold one of them.
      const touch = await down(c, 'pad-7-7');
      const scale = app(c).getSet().scale;
      const held = pitchOf(cell(c, 'pad-7-7'), scale);
      for (const el of pads(c)) el.dataset.green = String(el.style.getPropertyValue('--push-lamp') === 'var(--success)') + (pitchOf(el, scale) === held ? ' same' : ' other');
      await touch.up();
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(noteName(intent(context, 'note-on').pitch as number)).toBe('E2');
      const same = pads(c).filter((el) => el.dataset.green!.endsWith('same'));
      expect(same.length).toBeGreaterThan(1);
      for (const el of pads(c)) expect(el.dataset.green, el.dataset.control).toBe(el.dataset.green!.endsWith('same') ? 'true same' : 'false other');
      // Released, they are white again.
      for (const el of same) expect(el.style.getPropertyValue('--push-lamp')).not.toBe('var(--success)');
    },
  },

  ChoosingAKey: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'scale');
      await press(c, 'upper-3');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'set-scale')).toEqual({ kind: 'edit', action: 'set-scale', root: 7 });
      expect(screenKind(c)).toBe('scale');
      expect(tab(c, 'top', 3)).toHaveTextContent('G');
      expect(tab(c, 'top', 3)).toHaveAttribute('data-selected', 'true');
      expect(tab(c, 'top', 2)).not.toHaveAttribute('data-selected');
      expect(lampState(c, 'upper-3')).toBe('lit');
    },
  },

  ChoosingAScale: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'scale');
      // Dorian is two below Major in the list; an encoder moves one choice every four steps.
      await turn(c, 'encoder-4', 8);
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'set-scale').map((i) => i.scale)).toEqual(['Minor', 'Dorian']);
      expect(app(c).getSet().scale.scale).toBe('Dorian');
      expect(column(c, 2)).toHaveTextContent('Dorian');
      // The pads are relit: in C Dorian the third pad plays E flat, and it is in the scale.
      await press(c, 'pad-8-3');
      expect(noteName(all(context, 'note-on').at(-1)!.pitch as number)).toBe('E♭1');
      expect(lampState(c, 'pad-8-3')).toBe('lit');
    },
  },

  Thirds: {
    set: bass((set) => void (set.scale.layout = '3rds')),
    act: async ({ canvasElement: c }) => {
      await strike(c, 'pad-7-1');
    },
    check: (context) => {
      expect(played(context)).toEqual(['E1']);
    },
  },

  Sequential: {
    set: bass((set) => void (set.scale.layout = 'sequential')),
    act: async ({ canvasElement: c }) => {
      await strike(c, 'pad-8-8', 'pad-7-1');
    },
    check: (context) => {
      // The first row ends on C2; the second begins on the next note of the scale.
      expect(played(context)).toEqual(['C2', 'D2']);
    },
  },

  Chromatic: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'scale');
      await press(c, 'lower-1');
      await press(c, 'scale');
      await strike(c, 'pad-8-2');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'set-scale')).toEqual({ kind: 'edit', action: 'set-scale', inKey: false });
      expect(played(context)).toEqual(['C♯1']);
      expect(lampState(c, 'pad-8-2')).toBe('off');
      expect(lampState(c, BOTTOM_LEFT)).toBe('lit');
    },
  },

  FixedOff: {
    set: bass((set) => void (set.scale.fixed = false)),
    act: async ({ canvasElement: c }) => {
      await given(c, (set) => void (set.scale.root = 2));
      await strike(c, BOTTOM_LEFT);
    },
    check: (context) => {
      expect(played(context)).toEqual(['D1']);
    },
  },

  FixedOn: {
    set: bass((set) => void (set.scale.fixed = true)),
    act: async ({ canvasElement: c }) => {
      await given(c, (set) => void (set.scale.root = 7));
      await strike(c, BOTTOM_LEFT);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(played(context)).toEqual(['C1']);
      // C is no longer the root: G is, four pads along, in the track's colour.
      expect(lamp(c, 'pad-8-5').colour).toContain(BLUE);
      expect(lamp(c, BOTTOM_LEFT).colour).not.toContain(BLUE);
    },
  },

  OpeningASet: {
    set: bass((set) => void (set.scale = { ...set.scale, root: 5, scale: 'Minor' })),
    act: async ({ canvasElement: c }) => {
      await strike(c, BOTTOM_LEFT, 'pad-8-3');
    },
    check: (context) => {
      expect(played(context)).toEqual(['F1', 'A♭1']);
      expect(screenKind(context.canvasElement)).not.toBe('scale');
    },
  },

  UpAnOctave: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'octave-up');
      cell(c, 'octave-up').dataset.notice = overlay(c, 'notice')?.textContent ?? '';
      await strike(c, BOTTOM_LEFT);
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(played(context)).toEqual(['C2']);
      expect(cell(c, 'octave-up').dataset.notice).toContain('C2 to C6');
      // The range goes away by itself.
      await wait(1700);
      expect(overlay(c, 'notice')).toBeNull();
    },
  },

  BendWhileHoldingAChord: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      const chord = [];
      for (const id of [BOTTOM_LEFT, 'pad-8-3', 'pad-7-2']) chord.push(await down(c, id, { pointerType: 'touch', pressure: 0.4 }));
      const strip = await down(c, 'strip', { y: 0.5 });
      await strip.move(0.5, 0.9);
      for (const id of [BOTTOM_LEFT, 'pad-8-3', 'pad-7-2']) cell(c, id).dataset.was = String(cell(c, id).hasAttribute('data-held'));
      await strip.up();
      for (const touch of chord) await touch.up();
    },
    check: (context) => {
      const c = context.canvasElement;
      const bends = all(context, 'pitch-bend');
      expect(bends.length).toBeGreaterThanOrEqual(2);
      expect(bends.every((b) => b.pitch === undefined && b.track === 't-bass')).toBe(true);
      expect(Math.max(...bends.map((b) => b.value as number))).toBeGreaterThan(0.6);
      expect(bends.at(-1)!.value).toBe(0);
      // No note ended while the strip moved: the three note-offs all come after the last bend up.
      const order = (context.args.onIntent as unknown as { mock: { calls: [{ action: string }][] } }).mock.calls.map((x) => x[0].action);
      expect(order.indexOf('note-off')).toBeGreaterThan(order.lastIndexOf('pitch-bend') - 1);
      for (const id of [BOTTOM_LEFT, 'pad-8-3', 'pad-7-2']) expect(cell(c, id).dataset.was).toBe('true');
    },
  },

  ThreePresses: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      const seen: string[] = [];
      for (let i = 0; i < 3; i++) {
        await press(c, 'layout');
        seen.push(overlay(c, 'notice')?.textContent ?? '');
      }
      cell(c, 'layout').dataset.seen = seen.join('|');
    },
    check: ({ canvasElement: c }) => {
      const [first, second, third] = cell(c, 'layout').dataset.seen!.split('|');
      expect(first).toContain('Melodic Sequencer');
      expect(first).not.toContain('32');
      expect(second).toContain('Melodic Sequencer + 32 Notes');
      expect(third).toContain('64 Notes');
    },
  },

  ComingBackToATrack: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'layout');
      await given(c, (set) => void (set.selection.track = 't-keys'));
      cell(c, 'layout').dataset.other = lampState(c, BOTTOM_LEFT);
      await given(c, (set) => void (set.selection.track = 't-bass'));
      await press(c, 'layout');
    },
    check: ({ canvasElement: c }) => {
      // Back on the bass, one more press moved on from the Melodic Sequencer, so that is where it had been left.
      expect(overlay(c, 'notice')).toHaveTextContent('Melodic Sequencer + 32 Notes');
    },
  },

  AnAudioTrack: {
    set: onTrack('t-vocals'),
    act: async ({ canvasElement: c }) => {
      await strike(c, BOTTOM_LEFT, 'pad-4-4');
    },
    check: (context) => {
      for (const el of pads(context.canvasElement)) expect(el.dataset.lamp, el.dataset.control).toBe('off');
      expect(all(context, 'note-on')).toEqual([]);
    },
  },
} satisfies Record<string, Play>;
