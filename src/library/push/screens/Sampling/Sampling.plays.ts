// What each push-sampling scenario does and checks. The words are in Sampling.stories.tsx. The
// sample Set's fourth track holds a Simpler in Slicing mode with seven slices.
import { lampVar } from '../../../foundation/themes/lamps';
import { param as makeParam, simplerBanks } from '../../model/sample';
import type { Device, PushSet, Sampler } from '../../model/types';
import { all, app, cell, display, expect, hit, holding, intent, lamp, lampState, onTrack, press, rowTexts, screenText, tab, turn, wait , paramText } from '../play';
import type { Play } from '../scenario';

const none = async () => {};
/** The sampler track, with its Simpler changed and its banks made again for the change. */
const simpler = (change: (sampler: Sampler, device: Device, set: PushSet) => void = () => {}) => onTrack('t-sampler', (set) => {
  const device = set.tracks[3].devices[0];
  change(device.sampler!, device, set);
  device.banks = simplerBanks(device.id, device.sampler!);
});
const mode = (name: Sampler['mode'], more: (sampler: Sampler) => void = () => {}) => simpler((sampler) => {
  sampler.mode = name;
  more(sampler);
});
const param = paramText;
const marker = (c: HTMLElement, name: string) => [...display(c).querySelectorAll<SVGLineElement>(`[data-part="marker"][data-name="${name}"]`)];
const at = (el: Element) => Number(el.getAttribute('x1'));
const sampler = (c: HTMLElement) => app(c).getSet().tracks[3].devices[0].sampler!;

export const plays = {
  ALoadedSample: {
    set: simpler(),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(display(c).querySelector('[data-type="wave"] [data-part="band"]')).not.toBeNull();
      expect(marker(c, 'start')).toHaveLength(1);
      expect(marker(c, 'end')).toHaveLength(1);
      expect(at(marker(c, 'start')[0])).toBeCloseTo(2, 0);
      expect(at(marker(c, 'end')[0])).toBeCloseTo(90, 0);
      // The main bank sits over it, with Mode on its own encoder.
      expect([1, 2, 3, 4].map((col) => param(c, col).split(' ')[0])).toEqual(['Zoom', 'Start', 'End', 'Mode']);
    },
  },

  AnEmptySimpler: {
    set: simpler((s) => void delete s.sample),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(screenText(c)).toContain('No sample');
      expect(screenText(c)).toContain('Swap');
      expect(display(c).querySelector('[data-part="band"]')).toBeNull();
    },
  },

  ToSlicing: {
    set: mode('classic'),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-4').dataset.before = `${param(c, 4)}|${param(c, 5)}`;
      // Classic, One-Shot, Slicing: two choices on.
      await turn(c, 'encoder-4', 2);
      await wait(40);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'encoder-4').dataset.before).toBe('Mode Classic|S Start 0 %');
      expect(all(context, 'set-parameter').every((i) => i.parameter === 'd-simpler.mode')).toBe(true);
      expect(sampler(c).mode).toBe('slicing');
      expect(param(c, 4)).toBe('Mode Slicing');
      expect(param(c, 5)).toContain('Slice By');
      expect(param(c, 7)).toContain('Playback');
    },
  },

  TrimmingTheStart: {
    set: mode('classic'),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-2').dataset.before = String(at(marker(c, 'start')[0]));
      await turn(c, 'encoder-2', 12);
      await wait(40);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'set-parameter')).toMatchObject({ parameter: 'd-simpler.start', device: 'd-simpler' });
      expect(all(context, 'set-parameter').every((i) => (i.delta as number) > 0)).toBe(true);
      expect(at(marker(c, 'start')[0])).toBeGreaterThan(Number(cell(c, 'encoder-2').dataset.before) + 5);
    },
  },

  LoopOff: {
    set: mode('classic', (s) => void (s.loop = { start: 0.3, end: 0.7, on: false })),
    act: none,
    check: ({ canvasElement: c }) => {
      const greyed = (col: number) => display(c).querySelector(`[data-type="param"][data-col="${col}"]`)!.hasAttribute('data-disabled');
      expect([5, 6, 7, 8].map((col) => param(c, col).replace(/ \d.*$/, ''))).toEqual(['S Start', 'S Length', 'Loop Length', 'Loop Fade']);
      expect([5, 6, 7, 8].map(greyed)).toEqual([false, false, true, true]);
    },
  },

  Gate: {
    set: mode('one-shot'),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-5').dataset.bank = [5, 6, 7, 8].map((col) => param(c, col)).join('|');
      await turn(c, 'encoder-5', 1);
      await wait(40);
    },
    check: (context) => {
      const c = context.canvasElement;
      const bank = cell(c, 'encoder-5').dataset.bank!;
      for (const word of ['Trigger', 'Fade In', 'Fade Out', 'Transpose']) expect(bank).toContain(word);
      expect(intent(context, 'set-parameter')).toMatchObject({ parameter: 'd-simpler.trigger', choice: 1 });
      expect(sampler(c).trigger).toBe('gate');
      expect(param(c, 5)).toBe('Trigger Gate');
    },
  },

  ByBeat: {
    set: mode('slicing'),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-5').dataset.before = `${param(c, 6)}|${marker(c, 'slice').length + marker(c, 'selected').length}`;
      await turn(c, 'encoder-5', 1);
      await wait(40);
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-5').dataset.before).toBe('Sensitivity 50 %|7');
      expect(param(c, 5)).toBe('Slice By Beat');
      expect(param(c, 6)).toContain('Division');
      // A marker at each division: eight of them.
      expect(marker(c, 'slice').length + marker(c, 'selected').length).toBe(8);
    },
  },

  MoreSensitive: {
    set: mode('slicing'),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-6', 40);
      await wait(40);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'set-parameter').every((i) => i.parameter === 'd-simpler.sensitivity' && (i.delta as number) > 0)).toBe(true);
      const slices = sampler(c).slices!.length;
      expect(slices).toBeGreaterThan(40);
      expect(slices).toBeLessThanOrEqual(64);
      expect(marker(c, 'slice').length + marker(c, 'selected').length).toBe(slices);
    },
  },

  ASliceOnTheSnare: {
    set: simpler((s) => {
      s.sliceBy = 'manual';
      s.padSlicing = true;
      s.playing = 0.45;
    }),
    act: async ({ canvasElement: c }) => {
      // Seven slices fill the bottom row and three of the next: the pad after them is empty.
      cell(c, 'pad-7-4').dataset.before = lampState(c, 'pad-7-4');
      await hit(c, 7, 4);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-7-4').dataset.before).toBe('off');
      expect(all(context, 'slice')).toEqual([{ kind: 'edit', action: 'slice', track: 't-sampler', device: 'd-simpler', at: 0.45 }]);
      expect(all(context, 'note-on')).toEqual([]);
      // There are eight slices now, and the pad is lit.
      expect(sampler(c).slices).toHaveLength(8);
      expect(lampState(c, 'pad-7-4')).toBe('lit');
    },
  },

  DeletingASlice: {
    set: simpler(),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'delete', async () => {
        await hit(c, 8, 2);
      });
    },
    check: (context) => {
      expect(all(context, 'slice')).toEqual([{ kind: 'edit', action: 'slice', track: 't-sampler', device: 'd-simpler', delete: 1 }]);
      expect(all(context, 'note-on')).toEqual([]);
      expect(all(context, 'delete-clip')).toEqual([]);
      expect(sampler(context.canvasElement).slices).toHaveLength(6);
    },
  },

  ZoomingToASlice: {
    set: simpler(),
    act: async ({ canvasElement: c }) => {
      // The fifth slice, at just past the middle of the sample.
      await hit(c, 7, 1);
      await turn(c, 'encoder-1', 40);
      await wait(40);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'select-slice')).toMatchObject({ slice: 4 });
      expect(sampler(c).zoom).toBeGreaterThan(0.2);
      // Zoomed in, the selected slice is in the middle of what is shown, and fewer slices are in view.
      expect(at(marker(c, 'selected')[0])).toBeCloseTo(50, -1);
      expect(marker(c, 'slice').length).toBeLessThan(6);
      // The pad that plays it is the selected one.
      expect(lamp(c, 'pad-7-1').colour).toContain('--push-white');
    },
  },

  Through: {
    set: mode('slicing'),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-7', 2);
      await wait(40);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'set-parameter').every((i) => i.parameter === 'd-simpler.playback')).toBe(true);
      expect(sampler(c).playback).toBe('thru');
      expect(param(c, 7)).toBe('Playback Through');
    },
  },

  Reversing: {
    set: mode('classic'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-1');
      cell(c, 'upper-1').dataset.edit = `${rowTexts(c, 'top').join('|')}::${rowTexts(c, 'bottom').filter(Boolean).join('|')}`;
      await press(c, 'upper-7');
    },
    check: async (context) => {
      const c = context.canvasElement;
      const [top, bottom] = cell(c, 'upper-1').dataset.edit!.split('::');
      expect(top).toBe('Funk Break|Loop: Off|Warp as 2 Bars|:2|x2|Crop|Reverse|');
      expect(bottom).toBe('Sample|Global|Filter');
      expect(all(context, 'sample-action')).toEqual([{ kind: 'edit', action: 'sample-action', track: 't-sampler', device: 'd-simpler', what: 'reverse' }]);
      // The button again leaves Edit Mode.
      await press(c, 'upper-1');
      expect(rowTexts(c, 'top').slice(1).every((t) => t === '')).toBe(true);
      expect(rowTexts(c, 'bottom')[0]).toContain('Drums');
    },
  },

  CropInSlicing: {
    set: mode('slicing'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-1');
    },
    check: ({ canvasElement: c }) => {
      const top = rowTexts(c, 'top');
      expect(top).not.toContain('Crop');
      // Nor Loop, which is Classic's; the rest are there.
      expect(top.filter(Boolean)).toEqual(['Funk Break', 'Warp as 2 Bars', ':2', 'x2', 'Split Slice', 'Reverse']);
      expect(tab(c, 'top', 1)).toHaveAttribute('data-selected', 'true');
    },
  },

  Classic: {
    set: mode('classic'),
    act: async ({ canvasElement: c }) => {
      await hit(c, 8, 1);
      await hit(c, 7, 1);
    },
    check: (context) => {
      const c = context.canvasElement;
      // 64 Notes: the bottom left pad is C1 in the track's colour, and the pad above it a fourth higher.
      expect(all(context, 'note-on').map((i) => i.pitch)).toEqual([36, 41]);
      expect(lamp(c, 'pad-8-1').colour).toContain(lampVar(3));
      for (let col = 1; col <= 8; col++) expect(lampState(c, `pad-1-${col}`)).toBe('lit');
    },
  },

  APreset: {
    // A preset that holds its Simpler inside an Instrument Rack.
    set: onTrack('t-sampler', (set) => {
      const inner = set.tracks[3].devices[0];
      const rack: Device = { id: 'd-preset', name: 'Chopped Break', kind: 'instrument-rack', on: true, banks: [], macroCount: 8, macros: ['Start', 'Filter', 'Decay', 'Drive', 'Space', 'Echo', 'Width', 'Volume'].map((name, i) => makeParam(`d-preset.macro${i + 1}`, name, 0.5)), chains: [{ id: 'd-preset.chain', name: 'Simpler', devices: [inner] }] };
      set.tracks[3].devices = [rack];
      set.selection.device = rack.id;
    }),
    act: async ({ canvasElement: c }) => {
      cell(c, 'upper-1').dataset.first = `${param(c, 1)}|${display(c).querySelector('[data-part="band"]') === null}`;
      await press(c, 'upper-1');
      await press(c, 'upper-2');
      await wait(60);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'upper-1').dataset.first).toBe('Start 50 %|true');
      expect(intent(context, 'select-device')).toMatchObject({ device: 'd-simpler' });
      expect(display(c).querySelector('[data-type="wave"] [data-part="band"]')).not.toBeNull();
      expect(tab(c, 'top', 2)).toHaveAttribute('data-selected', 'true');
    },
  },
} satisfies Record<string, Play>;
