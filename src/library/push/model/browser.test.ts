import { describe, expect, it } from 'vitest';
import { sortedSets } from './layers/browser';
import { project } from './project';
import { sampleSet } from './sample';
import { initialState } from './state';
import { play, setOn, tap } from './testing';
import type { PushState } from './types';

const at = (path: string[], highlight = 0, more: Partial<PushState['browse']> = {}): PushState => ({ ...initialState(), display: 'browse', browse: { path, highlight, places: {}, ...more } });
const inSets = (more: Partial<PushState['sets']> = {}): PushState => ({ ...initialState(), display: 'sets', sets: { highlight: 0, sort: 'date', ...more } });
const lists = (state: PushState, set = sampleSet()) => project(state, set).screen.body.flatMap((c) => (c.type === 'list' ? [c.items.map((i) => i.label)] : []));

describe('Browse Mode', () => {
  it('Add opens the Add menu, and Add again leaves', () => {
    const opened = play(tap('add'), { host: false });
    expect(opened.state.display).toBe('browse');
    expect(opened.intents).toEqual([]);
    expect(lists(opened.state)).toEqual([['Device', 'MIDI Track', 'Audio Track', 'Return Track']]);
    expect(play(tap('add'), { state: opened.state, host: false }).state.display).not.toBe('browse');
  });

  it.each([
    [[], 0, ['device']],
    [[], 2, ['audio-track']],
    [['device'], 1, ['device', 'drums']],
    [['device', 'sounds'], 0, ['device', 'sounds', 'sounds.bass']],
  ] as const)('from %j, choosing row %i asks for the folder %j', (path, highlight, opened) => {
    const { intents, state } = play(tap('jog'), { state: at([...path], highlight), host: false });
    expect(intents).toEqual([{ kind: 'navigate', action: 'browse', path: opened }]);
    expect(state.browse.path).toEqual(opened);
  });

  it('each menu it came through stays in its column', () => {
    const shown = lists(at(['device', 'drums']));
    expect(shown).toHaveLength(3);
    expect(shown[0]).toEqual(['Device', 'MIDI Track', 'Audio Track', 'Return Track']);
    expect(shown[2]).toEqual(['808 Core Kit', '909 Core Kit', 'Studio Kit', 'Drum Hits']);
  });

  it('the D-pad moves the highlight within the list, and left goes back a menu', () => {
    const down = play([...tap('dpad-down'), ...tap('dpad-down'), ...tap('dpad-up')], { state: at(['device']), host: false });
    expect(down.state.browse.highlight).toBe(1);
    expect(play([...tap('dpad-up')], { state: at(['device']), host: false }).state.browse.highlight).toBe(0);
    expect(play(tap('dpad-left'), { state: at(['device', 'drums']), host: false }).state.browse.path).toEqual(['device']);
  });

  it('choosing something loadable asks to load it on the selected track', () => {
    const { intents } = play(tap('jog'), { set: setOn('t-bass'), state: at(['device', 'drums'], 1), host: false });
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({ action: 'load', track: 't-bass' });
  });
});

describe('the Set Library', () => {
  it.each([
    ['date', ['Night Drive', 'Sketch 14', 'Ambient Study']],
    ['name', ['Ambient Study', 'Night Drive', 'Sketch 14']],
  ] as const)('sorted by %s', (sort, names) => {
    expect(sortedSets(inSets({ sort }), sampleSet()).map((f) => f.name)).toEqual(names);
  });

  it('choosing a Set asks to open it', () => {
    const { intents } = play(tap('jog'), { state: inSets({ highlight: 1 }), host: false });
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({ action: 'open-set', set: 'set-2' });
  });
});
