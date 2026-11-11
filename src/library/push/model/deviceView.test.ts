import { describe, expect, it } from 'vitest';
import { banksOf, columns, deviceItems, sampleActions, sampleWindow, shownDevice } from './layers/deviceView';
import { project } from './project';
import { initialState } from './state';
import { hold, play, release, setOn, tap, twist } from './testing';
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
    ['t-sampler', ['Zoom', 'Start', 'End', 'Mode', 'Slice By', 'Sensitivity', 'Playback', 'Trigger']],
    ['t-vocals', ['Threshold', 'Ratio', 'Attack', 'Release', 'Knee', 'Makeup', null, 'Dry/Wet']],
    ['t-guitar', [null, null, null, null, null, null, null, 'Reference']],
    ['t-empty', []],
  ] as const)('%s: the encoders hold the selected device\'s first bank', (id, names) => {
    expect(columns(onDevice(), setOn(id)).map((p) => p?.name ?? null)).toEqual(names);
  });

  it.each([
    ['t-drums', [['808 Core Kit', ['Macros 1 to 8']], ['Compressor', ['Compressor']]]],
    ['t-bass', [['Analog Bass', ['Oscillator', 'Filter', 'Envelope', 'LFO']], ['EQ Eight', ['Bands']]]],
    ['t-sampler', [['Funk Break', ['Sample', 'Global', 'Filter']]]],
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

  it('a track with no device shows nothing to turn and asks nothing', () => {
    const set = setOn('t-empty');
    expect(shownDevice(onDevice(), set)).toBeUndefined();
    expect(play([twist('encoder-1', 4), ...tap('upper-1')], { set, state: onDevice(), host: false }).intents).toEqual([]);
  });

  it('Simpler: what the sample can be asked, and how much of it is in view', () => {
    const simpler = track('t-sampler').track.devices[0];
    expect(sampleActions(simpler).map((a) => a.label)).toEqual(['Warp as 2 Bars', ':2', 'x2', 'Split Slice', 'Reverse']);
    expect(sampleWindow(simpler)).toEqual({ from: 0, to: 1 });
    // Zoomed in, less of it is in view, and still inside the sample.
    const zoomed = play([twist('encoder-1', 12)], { set: setOn('t-sampler'), state: onDevice() });
    const view = sampleWindow(zoomed.set.tracks.find((t) => t.id === 't-sampler')!.devices[0]);
    expect(view.to - view.from).toBeLessThan(1);
    expect(view.from).toBeGreaterThanOrEqual(0);
    expect(view.to).toBeLessThanOrEqual(1);
  });
});
