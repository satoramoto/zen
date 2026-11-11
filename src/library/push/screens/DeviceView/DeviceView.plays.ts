// What each push-device-view scenario does and checks. The words are in DeviceView.stories.tsx.
// In the sample Set the bass track holds a synth and an EQ, the keys an Instrument Rack of two
// chains and a delay, the drums a Drum Rack, the guitar a Tuner, the vocals two effects.
import { param } from '../../model/sample';
import { initialState } from '../../model/state';
import type { PushSet, PushState } from '../../model/types';
import { all, app, bodyTexts, cell, click, column, columns, display, down, expect, given, holdDown, holding, intent, lampState, nudge, onTrack, press, rowTexts, screenKind, screenText, tab, turn, wait, waitFor, HOLD } from '../play';
import type { Play } from '../scenario';

const none = async () => {};
const state = (device: Partial<PushState['device']>, more: Partial<PushState> = {}) => ({ args: { initialState: { ...initialState(), ...more, device: { ...initialState().device, ...device } } } });
const bass = (more: (set: PushSet) => void = () => {}) => onTrack('t-bass', more);
const keys = (more: (set: PushSet) => void = () => {}) => onTrack('t-keys', more);
const names = (c: HTMLElement) => rowTexts(c, 'top').map((t) => t.replace(/^[^A-Za-z0-9●]+\s*/, ''));
/** A parameter cell's words, by column (a drawing may share the column). */
const params = (c: HTMLElement): Record<number, string> => Object.fromEntries([...display(c).querySelectorAll<HTMLElement>('[data-type="param"]')].map((el) => [Number(el.dataset.col), (el.textContent ?? '').replace(/\s+/g, ' ').trim()]));
const cutoff = (set: PushSet) => set.tracks[1].devices[0].banks[1].parameters[1]!;

export const plays = {
  ALoadedInstrument: {
    set: onTrack('t-pad'),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('device');
      expect(names(c)).toEqual(['Glass Pad', '', '', '', '', '', '', '']);
      expect(tab(c, 'top', 1)).toHaveAttribute('data-selected', 'true');
      expect([...new Set(columns(c))]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      const texts = Object.fromEntries([...display(c).querySelectorAll<HTMLElement>('[data-type="param"]')].map((el) => [Number(el.dataset.col), el.textContent ?? '']));
      expect(texts[1]).toContain('Shape');
      expect(texts[8]).toContain('Level');
      expect(texts[8]).toContain('-3.0 dB');
    },
  },

  ChoosingAnotherDevice: {
    // The pad track's synth, with the vocals' reverb moved on to it.
    set: onTrack('t-pad', (set) => void set.tracks[7].devices.push(set.tracks[4].devices.pop()!)),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-2');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'select-device')).toMatchObject({ track: 't-pad', device: 'd-vox-rev' });
      await waitFor(() => expect(tab(c, 'top', 2)).toHaveAttribute('data-selected', 'true'));
      expect(tab(c, 'top', 1)).not.toHaveAttribute('data-selected');
      expect(params(c)[1]).toContain('Decay');
      expect(params(c)[8]).toContain('Dry/Wet');
    },
  },

  AFilterSweep: {
    set: bass(),
    ...state({ banks: { 'd-bass': 1 } }),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-2').dataset.before = params(c)[2];
      await turn(c, 'encoder-2', 5);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'encoder-2').dataset.before).toContain('1.20 kHz');
      const asked = all(context, 'set-parameter');
      expect(asked).toHaveLength(5);
      for (const i of asked) {
        expect(i).toMatchObject({ parameter: 'd-bass.cutoff', track: 't-bass', device: 'd-bass' });
        expect(i.delta as number).toBeGreaterThan(0);
      }
      // The display reads what the app gives back, in the app's words.
      const now = cutoff(app(c).getSet());
      expect(now.value).toBeGreaterThan(0.62);
      expect(params(c)[2]).toContain(now.display);
    },
  },

  AChoice: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-1', 1);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'set-parameter')).toHaveLength(1);
      expect(intent(context, 'set-parameter')).toMatchObject({ parameter: 'd-bass.wave', choice: 1 });
      // Saw was the third of four: the next is Square.
      expect(app(c).getSet().tracks[1].devices[0].banks[0].parameters[0]!.display).toBe('Square');
    },
  },

  OpeningTheBanks: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-1');
    },
    check: ({ canvasElement: c }) => {
      expect(rowTexts(c, 'bottom')).toEqual(['Oscillator', 'Filter', 'Envelope', 'LFO', '', '', '', '']);
      expect(tab(c, 'bottom', 1)).toHaveAttribute('data-selected', 'true');
      expect(lampState(c, 'lower-5')).toBe('off');
    },
  },

  AnotherBank: {
    set: bass(),
    ...state({ bankList: true }),
    act: async ({ canvasElement: c }) => {
      await press(c, 'lower-2');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(tab(c, 'bottom', 2)).toHaveAttribute('data-selected', 'true');
      const texts = params(c);
      expect(texts[1]).toContain('Type');
      expect(texts[2]).toContain('Frequency');
      expect(texts[3]).toContain('Resonance');
      expect(all(context, 'select-track')).toEqual([]);
      // The device's button again gives the bottom row back to the tracks.
      await press(c, 'upper-1');
      expect(rowTexts(c, 'bottom')[0]).toContain('Drums');
    },
  },

  AnUnknownDeviceWithTwentyParameters: {
    set: onTrack('t-empty', (set) => {
      set.tracks[10].devices = [{ id: 'd-plug', name: 'Plug-in', kind: 'instrument', on: true, banks: [], parameters: Array.from({ length: 20 }, (_, i) => param(`d-plug.p${i + 1}`, `Param ${i + 1}`, i / 20)) }];
      set.selection.device = 'd-plug';
    }),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-1');
      const seen: string[] = [`${rowTexts(c, 'bottom').filter(Boolean).join(',')}:${columns(c).length}:${params(c)[1]}`];
      for (const lower of ['lower-2', 'lower-3']) {
        await press(c, lower);
        seen.push(`${columns(c).length}:${params(c)[1]}`);
      }
      cell(c, 'upper-1').dataset.seen = seen.join('|');
    },
    check: ({ canvasElement: c }) => {
      const [first, second, third] = cell(c, 'upper-1').dataset.seen!.split('|');
      expect(first).toContain('Bank 1,Bank 2,Bank 3:8:Param 1');
      expect(second).toContain('8:Param 9');
      expect(third).toContain('4:Param 17');
    },
  },

  ATuner: {
    // Ten cents flat of A.
    set: onTrack('t-guitar', (set) => void (set.tracks[5].devices[0].banks[0].drawing = { kind: 'tuner', col: 1, span: 7, value: -0.1, label: 'A' })),
    act: none,
    check: ({ canvasElement: c }) => {
      const tuner = column(c, 1)!;
      expect(tuner).toHaveAttribute('data-span', '7');
      expect(tuner).toHaveTextContent('A');
      const knob = tuner.querySelector('[data-part="root"]')!;
      expect(knob).toHaveAttribute('data-origin', 'center');
      // The mark is left of the top of the ring: the flat side.
      expect(Number(knob.querySelector('[data-part="pointer"]')!.getAttribute('x1'))).toBeLessThan(24);
      expect(knob.querySelector('[data-part="arc"]')).not.toBeNull();
    },
  },

  AnEnvelopeFollowsItsParameters: {
    set: bass(),
    ...state({ banks: { 'd-bass': 2 } }),
    act: async ({ canvasElement: c }) => {
      const line = () => display(c).querySelector('[data-part="line"]')!.getAttribute('d')!;
      cell(c, 'encoder-1').dataset.before = line();
      // The app gives a longer attack: the envelope's peak comes later.
      await given(c, (set) => void (set.tracks[1].devices[0].banks[2].drawing!.points = [[0, 0], [0.3, 1], [0.5, 0.7], [0.7, 0.7], [1, 0]]));
      cell(c, 'encoder-1').dataset.after = line();
    },
    check: ({ canvasElement: c }) => {
      const peakAt = (d: string) => Number(d.split(' L ')[1].split(' ')[0]);
      const { before, after } = cell(c, 'encoder-1').dataset;
      expect(peakAt(before!)).toBe(5);
      expect(peakAt(after!)).toBe(30);
      // The drawing spans four columns, and the parameters over it keep their own.
      expect(display(c).querySelector('[data-type="trace"]')).toHaveAttribute('data-span', '4');
      expect(params(c)[2]).toContain('Decay');
    },
  },

  MutingAnEffect: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'mute', async () => {
        await press(c, 'upper-2');
      });
      await press(c, 'upper-2');
      await wait(50);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'toggle-device')).toEqual([{ kind: 'edit', action: 'toggle-device', track: 't-bass', device: 'd-bass-eq', on: false }]);
      // Mute was a modifier here: the track was not muted.
      expect(all(context, 'mute')).toEqual([]);
      expect(tab(c, 'top', 2)).toHaveAttribute('data-dim', 'true');
      for (const col of columns(c)) expect(column(c, col)).toHaveAttribute('data-disabled', 'true');
    },
  },

  MovingAnEffect: {
    set: onTrack('t-vocals', (set) => set.tracks[4].devices.unshift(set.tracks[5].devices.pop()!)),
    act: async ({ canvasElement: c }) => {
      // Three effects: the EQ, the compressor, the reverb. Hold the second, turn an encoder one step.
      await holdDown(c, 'upper-2', async () => {
        await turn(c, 'encoder-5', 1);
      });
    },
    check: (context) => {
      expect(names(context.canvasElement).slice(0, 3)).toEqual(['EQ Eight', 'Compressor', 'Reverb']);
      expect(all(context, 'move-device')).toEqual([{ kind: 'edit', action: 'move-device', track: 't-vocals', device: 'd-vox-comp', by: 1 }]);
      expect(all(context, 'set-parameter')).toEqual([]);
      expect(all(context, 'select-device')).toEqual([]);
    },
  },

  ADrumRack: {
    act: none,
    check: ({ canvasElement: c }) => {
      expect(tab(c, 'top', 1)).toHaveTextContent('808 Core Kit');
      expect(tab(c, 'top', 1).querySelector('[role="img"]')).toHaveAccessibleName('Drum Rack');
      expect(tab(c, 'top', 2).querySelector('[role="img"]')).toBeNull();
    },
  },

  Unfolding: {
    set: keys(),
    act: async ({ canvasElement: c }) => {
      cell(c, 'upper-1').dataset.before = names(c).filter(Boolean).join('|');
      await press(c, 'upper-1');
    },
    check: async ({ canvasElement: c }) => {
      expect(cell(c, 'upper-1').dataset.before).toBe('● Layered Keys|Delay');
      expect(names(c).slice(0, 4)).toEqual(['● Layered Keys', 'Wavetable', 'Reverb', 'Delay']);
      expect(tab(c, 'top', 1).querySelector('[role="img"]')).toHaveAccessibleName('Rack');
      expect([1, 2, 3, 4].map((col) => tab(c, 'top', col).dataset.fold)).toEqual(['open', 'child', 'end', undefined]);
      await press(c, 'upper-1');
      expect(names(c).filter(Boolean)).toEqual(['● Layered Keys', 'Delay']);
    },
  },

  TheSecondChain: {
    set: keys(),
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'upper-1', async () => {
        cell(c, 'upper-1').dataset.chains = rowTexts(c, 'bottom').filter(Boolean).join('|');
        await press(c, 'lower-2');
      }, HOLD);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'upper-1').dataset.chains).toBe('Wavetable|Operator');
      expect(intent(context, 'select-chain')).toMatchObject({ device: 'd-keys', chain: 'd-keys.chain2' });
      expect(names(c).slice(0, 3)).toEqual(['● Layered Keys', 'Operator', 'Delay']);
      // Let go, the bottom row is the tracks again.
      expect(rowTexts(c, 'bottom')[0]).toContain('Drums');
      expect(all(context, 'select-track')).toEqual([]);
    },
  },

  EditingTheSnare: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'lower-1');
      cell(c, 'lower-1').dataset.row = rowTexts(c, 'bottom').join('|');
      await press(c, 'lower-4');
      await wait(60);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'lower-1').dataset.row).toContain('Kick');
      expect(cell(c, 'lower-1').dataset.row!.split('|')[3]).toContain('Snare');
      expect(intent(context, 'select-drum-pad')).toMatchObject({ track: 't-drums', device: 'd-kit', note: 38 });
      expect(names(c).slice(0, 3)).toEqual(['808 Core Kit', 'Snare', 'Compressor']);
      expect(tab(c, 'top', 2)).toHaveAttribute('data-selected', 'true');
      expect(tab(c, 'top', 2).querySelector('[role="img"]')).toHaveAccessibleName('Drum Rack');
      expect(params(c)[2]).toContain('Start');
    },
  },

  ChokeGroup: {
    set: (set) => {
      set.tracks[0].devices[0].selectedPad = 38;
      set.selection.device = 'd-kit.pad38';
    },
    ...state({ unfolded: ['d-kit'] }),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-2');
      cell(c, 'upper-2').dataset.settings = `${params(c)[1]}|${params(c)[2]}`;
      await turn(c, 'encoder-1', 1);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'upper-2').dataset.settings).toContain('Choke');
      expect(cell(c, 'upper-2').dataset.settings).toContain('Transpose');
      expect(intent(context, 'set-drum-pad')).toEqual({ kind: 'edit', action: 'set-drum-pad', track: 't-drums', device: 'd-kit', note: 38, choke: 1 });
      expect(app(c).getSet().tracks[0].devices[0].pads![2].choke).toBe(1);
    },
  },

  GroupingTwoEffects: {
    set: onTrack('t-vocals'),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'upper-1');
        await press(c, 'upper-2');
      });
      cell(c, 'upper-8').dataset.offer = rowTexts(c, 'top')[7];
      await press(c, 'upper-8');
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'upper-8').dataset.offer).toBe('Group');
      expect(all(context, 'group-devices')).toEqual([{ kind: 'edit', action: 'group-devices', track: 't-vocals', devices: ['d-vox-comp', 'd-vox-rev'] }]);
      expect(rowTexts(context.canvasElement, 'top')[7]).toBe('');
    },
  },

  TheSecondEight: {
    set: keys((set) => {
      const rack = set.tracks[2].devices[0];
      rack.macroCount = 12;
      rack.macros = Array.from({ length: 12 }, (_, i) => param(`d-keys.macro${i + 1}`, `Macro ${i + 1}`, 0.5, undefined, { mappings: 1 }));
    }),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-1');
    },
    check: ({ canvasElement: c }) => {
      expect(tab(c, 'top', 1)).toHaveTextContent('●● Layered Keys');
      expect(columns(c)).toEqual([1, 2, 3, 4]);
      const texts = params(c);
      expect(texts[1]).toContain('Macro 9');
      expect(texts[4]).toContain('Macro 12');
    },
  },

  MappingACutoff: {
    set: keys((set) => void (set.selection.device = 'd-keys.a')),
    ...state({ unfolded: ['d-keys'], banks: { 'd-keys.a': 1 } }),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, 'encoder-2');
      cell(c, 'upper-8').dataset.offer = rowTexts(c, 'top')[7];
      await press(c, 'upper-8');
      await touch.up();
      cell(c, 'upper-8').dataset.mode = `${rowTexts(c, 'top')[7]}|${params(c)[3]}`;
      const macro = await down(c, 'encoder-3');
      await macro.up();
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'upper-8').dataset.offer).toBe('Map');
      expect(cell(c, 'upper-8').dataset.mode).toContain('Done');
      expect(cell(c, 'upper-8').dataset.mode).toContain('Attack');
      expect(all(context, 'map-macro')).toEqual([{ kind: 'edit', action: 'map-macro', track: 't-keys', device: 'd-keys', parameter: 'd-keys.a.cutoff', macro: 3 }]);
    },
  },

  ASecondParameterOnOneMacro: {
    set: keys((set) => {
      set.selection.device = 'd-keys.a';
      set.tracks[2].devices[0].macros![2]!.mappings = 1;
    }),
    ...state({ unfolded: ['d-keys'], banks: { 'd-keys.a': 1 }, macroMap: { parameter: 'd-keys.a.drive', page: 0 } }),
    act: async ({ canvasElement: c }) => {
      const macro = await down(c, 'encoder-3');
      await macro.up();
      await wait(40);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'map-macro')).toMatchObject({ parameter: 'd-keys.a.drive', macro: 3 });
      const macro = app(c).getSet().tracks[2].devices[0].macros![2]!;
      expect(macro.mappings).toBe(2);
      expect(params(c)[3]).toContain('Macro 3');
    },
  },

  NarrowingARange: {
    set: keys(),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, 'encoder-1');
      cell(c, 'upper-7').dataset.offers = rowTexts(c, 'top').slice(6).join('|');
      await press(c, 'upper-7');
      await touch.up();
      cell(c, 'upper-7').dataset.edit = `${rowTexts(c, 'top').filter(Boolean).join('|')}::${[1, 2, 3, 4].map((col) => params(c)[col]).join('|')}`;
      await turn(c, 'encoder-4', -3);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'upper-7').dataset.offers).toBe('Edit|Unmap');
      const [top, body] = cell(c, 'upper-7').dataset.edit!.split('::');
      expect(top).toContain('Rename|Delete Map|Done');
      expect(body).toContain('Brightness');
      expect(body).toContain('Min');
      expect(body).toContain('Max');
      const asked = all(context, 'set-macro');
      expect(asked).toHaveLength(3);
      for (const i of asked) expect(i).toMatchObject({ device: 'd-keys', macro: 1 });
      expect(asked[0].max as number).toBeLessThan(1);
    },
  },

  Unmapping: {
    set: keys(),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, 'encoder-1');
      await press(c, 'upper-8');
      await touch.up();
    },
    check: (context) => {
      expect(all(context, 'unmap-macro')).toEqual([{ kind: 'edit', action: 'unmap-macro', device: 'd-keys', macro: 1 }]);
    },
  },

  RecallingAVariation: {
    set: keys(),
    act: async ({ canvasElement: c }) => {
      // The first turn reaches the list; three more reach the second variation.
      await turn(c, 'jog', 4);
      cell(c, 'jog').dataset.list = screenText(c);
      await click(c, 'jog');
    },
    check: (context) => {
      const list = cell(context.canvasElement, 'jog').dataset.list!;
      for (const word of ['Randomize Macros', 'Add Variation', 'Soft', 'Bright', 'Wide']) expect(list).toContain(word);
      expect(all(context, 'macro-variation')).toEqual([{ kind: 'edit', action: 'macro-variation', device: 'd-keys', variation: 1, recall: true }]);
    },
  },

  Overwriting: {
    set: keys(),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'jog', 3);
      await nudge(c, 1);
      cell(c, 'jog').dataset.menu = bodyTexts(c)[5];
      await click(c, 'jog');
    },
    check: (context) => {
      const menu = cell(context.canvasElement, 'jog').dataset.menu!;
      for (const word of ['Overwrite', 'Rename', 'Delete']) expect(menu).toContain(word);
      expect(all(context, 'macro-variation')).toEqual([{ kind: 'edit', action: 'macro-variation', device: 'd-keys', variation: 0, overwrite: true }]);
    },
  },

  SavingARack: {
    set: keys(),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'save', async () => {
        await press(c, 'upper-1');
      });
    },
    check: (context) => {
      expect(all(context, 'save-preset')).toEqual([{ kind: 'file', action: 'save-preset', track: 't-keys', device: 'd-keys' }]);
      expect(all(context, 'save-set')).toEqual([]);
    },
  },

  Overridden: {
    set: bass(),
    ...state({ banks: { 'd-bass': 1 } }),
    act: async ({ canvasElement: c }) => {
      const dot = () => display(c).querySelector('[data-type="param"][data-col="2"] [data-part="automation"] [aria-label]');
      cell(c, 'encoder-2').dataset.before = dot()?.getAttribute('aria-label') ?? 'none';
      await turn(c, 'encoder-2', 1);
      // The app reports the automation overridden.
      await given(c, (set) => void (cutoff(set).overridden = true));
      cell(c, 'encoder-2').dataset.after = dot()?.getAttribute('aria-label') ?? 'none';
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-2').dataset.before).toBe('automated');
      expect(cell(c, 'encoder-2').dataset.after).toBe('automation overridden');
      // Only the automated parameter carries a dot.
      expect(display(c).querySelector('[data-type="param"][data-col="3"] [data-part="automation"]')).toBeNull();
    },
  },

  Resetting: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'delete', async () => {
        const touch = await down(c, 'encoder-5');
        await touch.up();
      });
    },
    check: (context) => {
      expect(all(context, 'reset-parameter')).toEqual([{ kind: 'edit', action: 'reset-parameter', parameter: 'd-bass.sub', track: 't-bass' }]);
      expect(all(context, 'delete-automation')).toEqual([]);
      expect(all(context, 'delete-clip')).toEqual([]);
    },
  },

  ANewMIDITrack: {
    set: onTrack('t-empty'),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('device');
      expect(screenText(c)).toContain('No devices');
      expect(screenText(c)).toContain('Add');
      expect(rowTexts(c, 'top').every((t) => t === '')).toBe(true);
    },
  },

  AnotherTrack: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'lower-6');
      await wait(50);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'select-track')).toMatchObject({ track: 't-guitar' });
      expect(tab(c, 'bottom', 6)).toHaveAttribute('data-selected', 'true');
      expect(names(c).slice(0, 2)).toEqual(['Tuner', 'EQ Eight']);
    },
  },
} satisfies Record<string, Play>;
