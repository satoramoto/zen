import { describe, expect, it } from 'vitest';
import { banksOf, columns, deviceItems, sampleActions, sampleWindow, shownDevice } from './layers/deviceView';
import { project } from './project';
import { initialState } from './state';
import { simplerBanks } from './sample';
import { HOLD_MS } from './timing';
import { hold, play, release, setOn, t, tap, twist } from './testing';
import type { PushState } from './types';

const onDevice = (more: Partial<PushState> = {}): PushState => ({ ...initialState(), display: 'device', ...more });
const track = (id: string) => {
  const set = setOn(id);
  return { set, track: set.tracks.find((t) => t.id === id)! };
};

describe('Device View', () => {
  it.each([
    ['t-drums', ['Kick Tune', 'Snare Tune', 'Hat Decay', 'Drive', 'Reverb', 'Delay', 'Filter', 'Volume']],
    ['t-bass', ['Shape', 'Octave', 'Detune', 'Noise', 'Sub', 'Glide', 'Retrig', 'Level']],
    ['t-keys', ['Brightness', 'Bite', 'Attack', 'Release', 'Space', 'Echo', null, 'Volume']],
    ['t-sampler', ['Zoom', 'Start', 'End', 'Nudge', 'Playback', 'Slice By', 'Sensitivity', 'Mode']],
    ['t-vocals', ['Threshold', 'Ratio', 'Attack', 'Release', 'Knee', 'Makeup', null, 'Dry/Wet']],
    ['t-guitar', [null, null, null, null, null, null, null, 'Reference']],
    ['t-empty', []],
  ] as const)('%s: the encoders hold the selected device\'s first bank', (id, names) => {
    expect(columns(onDevice(), setOn(id)).map((p) => p?.name ?? null)).toEqual(names);
  });

  it.each([
    ['t-drums', [['808 Core Kit', ['Macros 1 to 8']], ['Compressor', ['Compressor']]]],
    ['t-bass', [['Analog Bass', ['Oscillator', 'Filter', 'Envelope', 'LFO']], ['EQ Eight', ['Bands']]]],
    ['t-sampler', [['Funk Break', ['Main', 'Global', 'Filter']]]],
    ['t-synths', []],
  ] as const)('%s: its devices and their banks', (id, devices) => {
    const { set, track: t } = track(id);
    expect(deviceItems(onDevice(), t).map((i) => [i.device.name, banksOf(i.device).map((b) => b.name)])).toEqual(devices);
    expect(shownDevice(onDevice(), set)?.device.name).toBe(devices[0]?.[0]);
  });

  it.each([
    ['a turn asks for the parameter under the encoder', [twist('encoder-1', 4)], [{ action: 'set-parameter', parameter: 'd-bass.wave', device: 'd-bass', choice: 4 }]],
    ['an upper button selects its device', tap('upper-2'), [{ action: 'select-device', device: 'd-bass-eq' }]],
    ['Delete with an upper button removes that device', [hold('delete'), ...tap('upper-1'), release('delete')], [{ action: 'delete-device', device: 'd-bass' }]],
  ] as const)('%s', (_name, inputs, asked) => {
    const { intents } = play([...inputs], { set: setOn('t-bass'), state: onDevice(), host: false });
    expect(intents).toHaveLength(asked.length);
    asked.forEach((a, i) => expect(intents[i]).toMatchObject({ track: 't-bass', ...a }));
  });

  it('the shown device\'s own button opens its banks on the lower buttons, and the encoders follow the bank', () => {
    const set = setOn('t-bass');
    // Until then the lower buttons are the tracks.
    expect(project(onDevice(), set).screen.bottom.slice(0, 2).map((c) => c?.label)).toEqual(['Drums', 'Bass']);
    const opened = play(tap('upper-1'), { set, state: onDevice(), host: false });
    expect(opened.intents).toEqual([]);
    expect(project(opened.state, set).screen.bottom.map((c) => c?.label ?? null)).toEqual(['Oscillator', 'Filter', 'Envelope', 'LFO', null, null, null, null]);
    const second = play(tap('lower-2'), { set, state: opened.state, host: false });
    expect(second.intents).toEqual([]);
    expect(columns(second.state, set).map((p) => p?.name ?? null)).not.toEqual(columns(onDevice(), set).map((p) => p?.name ?? null));
    expect(project(second.state, set).screen.bottom[1]).toMatchObject({ label: 'Filter', selected: true });
    // A lower button with no bank changes nothing.
    expect(play(tap('lower-7'), { set, state: second.state, host: false }).state.device.banks).toEqual(second.state.device.banks);
  });

  it.each(['classic', 'one-shot', 'slicing'] as const)('Simpler in %s mode: Zoom, Start and End first, Mode last, as on the unit', (mode) => {
    const set = setOn('t-sampler', (s) => {
      const device = s.tracks.find((t) => t.id === 't-sampler')!.devices[0];
      device.sampler!.mode = mode;
      device.banks = simplerBanks(device.id, device.sampler!);
    });
    const names = columns(onDevice(), set).map((p) => p?.name);
    expect(names.slice(0, 3)).toEqual(['Zoom', 'Start', 'End']);
    expect(names[7]).toBe('Mode');
    expect(names.slice(3, 7)).toEqual({ classic: ['S Start', 'Length', 'Loop Length', 'Loop Fade'], 'one-shot': ['Fade In', 'Fade Out', 'Transpose', 'Gain'], slicing: ['Nudge', 'Playback', 'Slice By', 'Sensitivity'] }[mode]);
    // Trigger and Gate are a pair at the second display button of Edit Mode, not an encoder's.
    const edit = project(onDevice({ device: { ...initialState().device, edit: true } }), set).screen.top;
    expect(edit[0]).toMatchObject({ label: 'Funk Break', icon: 'left', selected: true });
    if (mode === 'classic') expect(edit[1]).toMatchObject({ label: 'Loop Off' });
    else expect(edit[1]).toMatchObject({ options: ['Trigger', 'Gate'], chosen: 0 });
  });

  it('Simpler: Nudge moves the selected slice, finer with Shift; Trigger and Gate switch at their button', () => {
    const set = setOn('t-sampler', (s) => void (s.tracks.find((t) => t.id === 't-sampler')!.devices[0].sampler!.selectedSlice = 2));
    const nudged = play([twist('encoder-4', 4)], { set, state: onDevice(), host: false }).intents;
    expect(nudged).toHaveLength(1);
    expect(nudged[0]).toMatchObject({ action: 'slice', device: 'd-simpler', move: 2 });
    expect(nudged[0].by as number).toBeGreaterThan(0);
    const fine = play([hold('shift'), twist('encoder-4', 4), release('shift')], { set, state: onDevice(), host: false }).intents;
    expect(fine[0]).toMatchObject({ move: 2, fine: true });
    expect(fine[0].by as number).toBeLessThan(nudged[0].by as number);
    // With the host answering, the marker has moved later.
    const before = set.tracks.find((t) => t.id === 't-sampler')!.devices[0].sampler!.slices![2];
    const after = play([twist('encoder-4', 4)], { set, state: onDevice() }).set.tracks.find((t) => t.id === 't-sampler')!.devices[0].sampler!.slices![2];
    expect(after).toBeGreaterThan(before);
    const gate = play(tap('upper-2'), { set, state: onDevice({ device: { ...initialState().device, edit: true } }) });
    expect(gate.intents[0]).toMatchObject({ action: 'set-parameter', parameter: 'd-simpler.trigger', value: 1 });
    expect(gate.set.tracks.find((t) => t.id === 't-sampler')!.devices[0].sampler!.trigger).toBe('gate');
  });

  describe('switches over the upper display buttons', () => {
    // The Wavetable inside the Layered Keys Rack: unfold the Rack, select it, open its banks.
    const inRack = () => {
      const set = setOn('t-keys', (s) => void (s.selection.device = 'd-keys.a'));
      const state = onDevice({ device: { ...initialState().device, unfolded: ['d-keys'], bankList: true } });
      return { set, state };
    };
    const long = (control: string) => [hold(control), { control: '', kind: 'tick' as const, time: t(HOLD_MS + 50) }];

    it('with the banks shown the top row is the device, then the bank\'s switches', () => {
      const { set, state } = inRack();
      const top = project(state, set).screen.top;
      expect(top[0]).toMatchObject({ label: 'Wavetable', icon: 'left', selected: true });
      expect(top[1]).toMatchObject({ label: 'Osc', icon: 'switch-on' });
      expect(top.slice(2)).toEqual([null, null, null, null, null, null]);
    });

    it('a short press switches it and does not offer Map', () => {
      const { set, state } = inRack();
      const pressed = play(tap('upper-2'), { set, state, host: false });
      expect(pressed.intents).toHaveLength(1);
      expect(pressed.intents[0]).toMatchObject({ action: 'set-parameter', parameter: 'd-keys.a.oscon', value: 0 });
      expect(pressed.state.device.macroMap).toBeUndefined();
      expect(project(pressed.state, set).screen.bottom[7]?.label).not.toBe('Map');
    });

    it('held, it offers Map on the last lower button, and Map then a touched encoder maps it to that macro', () => {
      const { set, state } = inRack();
      const held = play(long('upper-2'), { set, state, host: false });
      expect(held.intents).toEqual([]);
      expect(project(held.state, set).screen.bottom[7]).toMatchObject({ label: 'Map', icon: 'map', selected: true });
      const mapping = play(tap('lower-8'), { set, state: held.state, host: false });
      expect(mapping.state.device.macroMap).toEqual({ parameter: 'd-keys.a.oscon', page: 0 });
      // Letting the switch's button go now does not switch it.
      const let_go = play([release('upper-2')], { set, state: mapping.state, host: false });
      expect(let_go.intents).toEqual([]);
      const mapped = play([{ control: 'encoder-2', kind: 'touch', time: t() }], { set, state: let_go.state, host: false });
      expect(mapped.intents[0]).toMatchObject({ action: 'map-macro', device: 'd-keys', parameter: 'd-keys.a.oscon', macro: 2 });
    });

    it('a device outside a Rack has no macro to map to: its held switch offers nothing', () => {
      const set = setOn('t-bass');
      const state = onDevice({ device: { ...initialState().device, bankList: true } });
      const held = play(long('upper-2'), { set, state, host: false });
      expect(project(held.state, set).screen.bottom[7]?.label).not.toBe('Map');
    });

    it('a Rack\'s held button still shows its chains, and the first button leaves the banks', () => {
      const set = setOn('t-keys');
      const held = play(long('upper-1'), { set, state: onDevice(), host: false });
      expect(project(held.state, set).screen.bottom.slice(0, 2).map((c) => c?.label)).toEqual(['Wavetable', 'Operator']);
      const { set: inner, state } = inRack();
      const left = play(tap('upper-1'), { set: inner, state, host: false });
      expect(left.state.device.bankList).toBeUndefined();
      expect(left.intents).toEqual([]);
    });

    it('a touched parameter in a Rack offers Map on the last lower button too', () => {
      const { set } = inRack();
      const state = onDevice({ device: { ...initialState().device, unfolded: ['d-keys'] }, touched: ['encoder-4'] });
      const screen = project(state, set).screen;
      expect(screen.bottom[7]).toMatchObject({ label: 'Map' });
      expect(screen.top[7]?.label).not.toBe('Map');
      expect(play(tap('lower-8'), { set, state, host: false }).state.device.macroMap).toEqual({ parameter: 'd-keys.a.noise', page: 0 });
    });
  });

  it('a track with no device shows nothing to turn and asks nothing', () => {
    const set = setOn('t-empty');
    expect(shownDevice(onDevice(), set)).toBeUndefined();
    expect(play([twist('encoder-1', 4), ...tap('upper-1')], { set, state: onDevice(), host: false }).intents).toEqual([]);
  });

  it('Simpler: what the sample can be asked, and how much of it is in view', () => {
    const simpler = track('t-sampler').track.devices[0];
    // Each action at the display button the unit has it at; the second is the bank's Trigger and Gate.
    expect(sampleActions(simpler).map((a) => [a.col, a.label])).toEqual([[3, 'Warp as 2 Bars'], [4, ':2'], [5, 'x2'], [6, 'Reset Slices'], [7, 'Split Slice'], [8, 'Reverse']]);
    expect(sampleWindow(simpler)).toEqual({ from: 0, to: 1 });
    // Zoomed in, less of it is in view, and still inside the sample.
    const zoomed = play([twist('encoder-1', 12)], { set: setOn('t-sampler'), state: onDevice() });
    const view = sampleWindow(zoomed.set.tracks.find((t) => t.id === 't-sampler')!.devices[0]);
    expect(view.to - view.from).toBeLessThan(1);
    expect(view.from).toBeGreaterThanOrEqual(0);
    expect(view.to).toBeLessThanOrEqual(1);
  });
});
