import { describe, expect, it } from 'vitest';
import { clipWindow, conversions } from './layers/clipView';
import { project } from './project';
import { initialState } from './state';
import { hold, play, release, setOn, tap, twist } from './testing';
import type { PushState } from './types';

const onClip = (more: Partial<PushState> = {}): PushState => ({ ...initialState(), display: 'clip', ...more });
const firstClip = (id: string) => setOn(id).tracks.find((t) => t.id === id)!.clips.find(Boolean)!;

describe('Clip View', () => {
  it.each([
    ['t-drums', 4],
    ['t-bass', 8],
    ['t-vocals', 16],
    ['t-guitar', 8],
  ] as const)('%s: the whole clip is in view until it is zoomed (%i beats)', (id, beats) => {
    expect(clipWindow(onClip(), firstClip(id))).toEqual({ from: 0, to: beats });
  });

  it.each([
    ['t-drums', []],
    ['t-bass', ['Drum Rack']],
    ['t-sampler', ['Drum Rack']],
    ['t-vocals', []],
    ['t-guitar', ['Simpler', 'Drum Pad', 'Harmony-MIDI', 'Melody-MIDI', 'Drums-MIDI']],
    ['t-empty', []],
  ] as const)('%s: what Convert offers', (id, offers) => {
    expect(conversions(onClip(), setOn(id)).map((c) => c.label)).toEqual(offers);
  });

  it('the Intro edition is offered no audio-to-MIDI conversion', () => {
    const intro = setOn('t-guitar', (s) => void (s.unit.edition = 'intro'));
    expect(conversions(onClip(), intro).map((c) => c.label)).not.toContain('Melody-MIDI');
  });

  it.each([
    ['the Loop Position encoder moves the loop by a bar', [twist('encoder-2', 4)], { action: 'set-loop', start: 4, end: 12 }],
    ['the Loop button switches the loop', tap('upper-2'), { action: 'set-loop', on: false }],
    ['Double Loop', tap('double-loop'), { action: 'double-loop' }],
    ['Quantize, pressed briefly', tap('quantize'), { action: 'quantize' }],
  ] as const)('%s', (_name, inputs, asked) => {
    const { intents } = play([...inputs], { set: setOn('t-bass'), state: onClip(), host: false });
    expect(intents).toEqual([{ kind: 'edit', track: 't-bass', scene: 0, ...asked }]);
  });

  it('Shift makes the loop encoders move finely', () => {
    const coarse = play([twist('encoder-2', 4)], { set: setOn('t-bass'), state: onClip(), host: false }).intents[0];
    const fine = play([hold('shift'), twist('encoder-2', 4), release('shift')], { set: setOn('t-bass'), state: onClip(), host: false }).intents[0];
    expect(coarse).toMatchObject({ start: 4, end: 12 });
    expect(fine).toMatchObject({ start: 1, end: 9 });
  });

  it('Zoom is the display\'s own: it asks nothing and narrows the view', () => {
    const zoomed = play([twist('encoder-1', 8)], { set: setOn('t-bass'), state: onClip(), host: false });
    expect(zoomed.intents).toEqual([]);
    const view = clipWindow(zoomed.state, firstClip('t-bass'));
    expect(view.to - view.from).toBeLessThan(8);
  });

  it('Convert asks for the one offer at once', () => {
    const { intents } = play(tap('convert'), { set: setOn('t-bass'), state: onClip(), host: false });
    expect(intents).toEqual([{ kind: 'edit', action: 'convert', track: 't-bass', to: 'devices-to-drum-rack', device: 'd-bass' }]);
  });

  it('a MIDI clip is drawn as a roll and an audio clip as its wave', () => {
    const kinds = (id: string) => project(onClip(), setOn(id)).screen.body.map((c) => c.type);
    expect(kinds('t-bass')).toContain('roll');
    expect(kinds('t-bass')).not.toContain('wave');
    expect(kinds('t-guitar')).toContain('wave');
    expect(kinds('t-guitar')).not.toContain('roll');
  });

  it('an empty slot has nothing to edit', () => {
    const set = setOn('t-empty');
    expect(play([twist('encoder-2', 4), ...tap('upper-2'), ...tap('double-loop')], { set, state: onClip(), host: false }).intents.filter((i) => i.action === 'set-loop' || i.action === 'double-loop')).toEqual([]);
  });
});
