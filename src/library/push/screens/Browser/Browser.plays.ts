// What each push-browser scenario does and checks. The words are in Browser.stories.tsx. The
// sample Set's Add menu is Device, MIDI Track, Audio Track and Return Track; under Device are
// Sounds (Bass, Piano & Keys, Pad, and Synth Lead, which the app has not listed), Drums and more.
import { initialState } from '../../model/state';
import type { PushSet, PushState } from '../../model/types';
import { all, app, cell, click, display, expect, go, holding, intent, lampState, lists, nudge, onTrack, overlay, press, rowTexts, screenKind, screenText, tab, turn, waitFor } from '../play';
import type { Play } from '../scenario';

const at = (path: string[], highlight = 0, more: Partial<PushState['browse']> = {}) => ({ args: { initialState: { ...initialState(), display: 'browse' as const, browse: { path, highlight, places: {}, ...more } } } });
const inSets = (more: Partial<PushState['sets']> = {}) => ({ args: { initialState: { ...initialState(), display: 'sets' as const, sets: { highlight: 0, sort: 'date' as const, ...more } } } });
const packs = (group?: number, highlight = 0) => at([], 0, { packs: { ...(group === undefined ? {} : { group }), highlight } });
const BASS = ['device', 'sounds', 'sounds.bass'];
/** The bass track with a preset from the Bass folder loaded: the Set says where it came from. */
const bassPreset = (set: PushSet) => {
  onTrack('t-bass')(set);
  set.browser.hotSwapPath = BASS;
  set.browser.hotSwapItem = 'sounds.bass.acid';
};
const last = (c: HTMLElement) => lists(c).at(-1)!;

export const plays = {
  TheAddMenu: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'add');
    },
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('browse');
      expect(lists(c)).toHaveLength(1);
      expect(last(c).rows).toEqual(['Device', 'MIDI Track', 'Audio Track', 'Return Track']);
      expect(last(c).chosen).toBe('Device');
      // An X to leave, then the unit's places: Preview at the second button, Favorites at the fourth, Packs at the seventh.
      expect(tab(c, 'top', 1).querySelector('[role="img"]')).toHaveAccessibleName('close');
      expect(rowTexts(c, 'top').slice(1)).toEqual(['□Preview', '', '□Favorites', '', '', 'Packs', '']);
      expect(lampState(c, 'add')).toBe('lit');
    },
  },

  OpeningACategory: {
    ...at(['device'], 0),
    act: async ({ canvasElement: c }) => {
      await go(c, 'down');
      await click(c, 'jog');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'browse')).toEqual([{ kind: 'navigate', action: 'browse', path: ['device', 'drums'] }]);
      expect(lists(c)).toHaveLength(3);
      expect(last(c).rows).toEqual(['808 Core Kit', '909 Core Kit', 'Studio Kit', 'Drum Hits']);
      // The menus it came through stay in their columns, each with what is open marked.
      expect(lists(c).map((l) => [l.chosen, l.enclosing])).toEqual([['Device', true], ['Drums', true], ['808 Core Kit', false]]);
    },
  },

  Waiting: {
    ...at(['device', 'sounds'], 3),
    act: async ({ canvasElement: c }) => {
      await go(c, 'centre');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'browse')).toEqual({ kind: 'navigate', action: 'browse', path: ['device', 'sounds', 'sounds.lead'] });
      // The app has not listed Synth Lead: its column says so.
      expect(last(c).rows).toEqual(['Loading…']);
      expect(lists(c).at(-2)!.chosen).toBe('Synth Lead');
    },
  },

  LoadingAPreset: {
    ...at(BASS, 0),
    set: onTrack('t-pad'),
    act: async ({ canvasElement: c }) => {
      await click(c, 'jog');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'load')).toEqual([{ kind: 'edit', action: 'load', item: 'sounds.bass.sub', content: 'preset', track: 't-pad' }]);
      expect(screenKind(c)).toBe('device');
      expect(lampState(c, 'add')).toBe('dim');
    },
  },

  ADefaultMIDITrack: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'add');
      await go(c, 'down', 'centre');
      cell(c, 'add').dataset.offer = last(c).rows.join('|');
      await go(c, 'centre');
    },
    check: (context) => {
      // The default track, and the sounds and devices that suit a MIDI track.
      expect(cell(context.canvasElement, 'add').dataset.offer).toBe('Default MIDI Track|Sounds|Drums|Instruments');
      expect(all(context, 'add-track')).toEqual([{ kind: 'edit', action: 'add-track', type: 'midi' }]);
      expect(all(context, 'load')).toEqual([]);
    },
  },

  BackTwoLevels: {
    ...at(['device', 'sounds'], 1),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-1').dataset.before = String(lists(c).length);
      await turn(c, 'encoder-1', -2);
    },
    check: async ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-1').dataset.before).toBe('3');
      expect(lists(c)).toHaveLength(1);
      expect(last(c)).toMatchObject({ chosen: 'Device', enclosing: false });
      // A nudge to the left also goes back one; here there is nowhere further to go.
      await go(c, 'centre', 'centre');
      expect(lists(c)).toHaveLength(3);
      await nudge(c, -1);
      expect(lists(c)).toHaveLength(2);
      expect(last(c).chosen).toBe('Sounds');
    },
  },

  PreviewOn: {
    ...at(BASS, 0),
    set: (set) => void (set.browser.preview = true),
    act: async ({ canvasElement: c }) => {
      await go(c, 'down');
    },
    check: (context) => {
      expect(rowTexts(context.canvasElement, 'top')[1]).toBe('■Preview');
      expect(all(context, 'preview')).toEqual([{ kind: 'navigate', action: 'preview', item: 'sounds.bass.acid' }]);
    },
  },

  MarkingAFavourite: {
    ...at(BASS, 1),
    act: async ({ canvasElement: c }) => {
      // The label's box is at the fourth display button, as on the unit, and Preview's at the second.
      cell(c, 'upper-6').dataset.before = rowTexts(c, 'top')[3];
      await press(c, 'upper-4');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'upper-6').dataset.before).toBe('□Favorites');
      expect(all(context, 'favourite')).toEqual([{ kind: 'file', action: 'favourite', item: 'sounds.bass.acid', label: 'Favorites', on: true }]);
      await waitFor(() => expect(rowTexts(c, 'top')[3]).toBe('■Favorites'));
      // Preview is off by default, and its button switches it.
      expect(rowTexts(c, 'top')[1]).toBe('□Preview');
      await press(c, 'upper-2');
      expect(intent(context, 'preview')).toEqual({ kind: 'navigate', action: 'preview', on: true });
    },
  },

  SwappingABassPreset: {
    set: bassPreset,
    act: async ({ canvasElement: c }) => {
      await press(c, 'swap');
    },
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('browse');
      expect(last(c).rows).toEqual(['Sub Bass', 'Acid Bass', 'Reese Bass']);
      expect(last(c).chosen).toBe('Acid Bass');
      expect(tab(c, 'top', 1)).toHaveTextContent('Analog Bass');
      expect(rowTexts(c, 'top').slice(5, 7)).toEqual(['Load Previous', 'Load Next']);
      expect(lampState(c, 'swap')).toBe('lit');
    },
  },

  StayingIn: {
    set: bassPreset,
    act: async ({ canvasElement: c }) => {
      await press(c, 'swap');
      await go(c, 'down', 'centre');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'load')).toEqual([{ kind: 'edit', action: 'load', item: 'sounds.bass.reese', content: 'preset', track: 't-bass', replace: 'd-bass' }]);
      expect(screenKind(c)).toBe('browse');
      expect(last(c).chosen).toBe('Reese Bass');
      // Swap again leaves.
      await press(c, 'swap');
      expect(screenKind(c)).toBe('device');
    },
  },

  TheNextPreset: {
    set: bassPreset,
    act: async ({ canvasElement: c }) => {
      await press(c, 'swap');
      await press(c, 'upper-7');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'load')).toEqual([{ kind: 'edit', action: 'load', item: 'sounds.bass.reese', content: 'preset', track: 't-bass', replace: 'd-bass' }]);
      expect(last(c).chosen).toBe('Reese Bass');
      await press(c, 'upper-6');
      expect(all(context, 'load').at(-1)).toMatchObject({ item: 'sounds.bass.acid' });
      // The display button over the device's name leaves.
      await press(c, 'upper-1');
      expect(screenKind(c)).toBe('device');
    },
  },

  AKick: {
    // The Kick pad is selected; the Set says its sound came from the drum hits.
    set: (set) => {
      set.browser.hotSwapPath = ['device', 'drums', 'drums.hits'];
      set.browser.hotSwapItem = 'drums.hits.kick';
    },
    act: async ({ canvasElement: c }) => {
      await press(c, 'swap');
    },
    check: ({ canvasElement: c }) => {
      expect(lists(c).at(-2)!.chosen).toBe('Drum Hits');
      expect(last(c).chosen).toBe('Kick 808');
      expect(lampState(c, 'pad-8-1')).toBe('blink');
      expect(lampState(c, 'pad-8-2')).toBe('lit');
    },
  },

  TryingASound: {
    set: bassPreset,
    act: async ({ canvasElement: c }) => {
      await press(c, 'swap');
      await press(c, 'pad-8-1');
    },
    check: (context) => {
      expect(all(context, 'note-on').map((i) => i.pitch)).toEqual([36]);
      expect(screenKind(context.canvasElement)).toBe('browse');
    },
  },

  Downloading: {
    ...packs(1, 0),
    act: async ({ canvasElement: c }) => {
      cell(c, 'jog').dataset.before = last(c).rows.join('|');
      await click(c, 'jog');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'jog').dataset.before).toBe('Synth Essentials|Grand Piano|Chop and Swing');
      expect(all(context, 'download-pack')).toEqual([{ kind: 'file', action: 'download-pack', pack: 'pack-2' }]);
      // The row shows the progress the app reports.
      await waitFor(() => expect(screenText(c)).toContain('Downloading 10 %'));
      expect(screenText(c)).toContain('Downloading 40 %');
    },
  },

  Pausing: {
    ...packs(1, 1),
    act: async ({ canvasElement: c }) => {
      await click(c, 'jog');
    },
    check: (context) => {
      expect(all(context, 'pause-pack')).toEqual([{ kind: 'file', action: 'pause-pack', pack: 'pack-3' }]);
      expect(screenText(context.canvasElement)).toContain('Paused');
    },
  },

  Offline: {
    ...packs(undefined, 1),
    set: (set) => void (set.unit.wifi.on = false),
    act: async ({ canvasElement: c }) => {
      await click(c, 'jog');
      await click(c, 'jog');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(screenText(c)).toContain('A Wi-Fi connection is needed');
      expect(lists(c)).toHaveLength(1);
      expect(all(context, 'download-pack')).toEqual([]);
    },
  },

  Uninstalling: {
    ...packs(0, 0),
    act: async ({ canvasElement: c }) => {
      await nudge(c, 1);
      cell(c, 'jog').dataset.asked = overlay(c, 'confirm')?.textContent ?? '';
      await click(c, 'jog');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'jog').dataset.asked).toContain('Uninstall Drum Essentials?');
      expect(all(context, 'uninstall-pack')).toEqual([{ kind: 'file', action: 'uninstall-pack', pack: 'pack-1', label: 'Uninstall' }]);
      expect(overlay(c, 'confirm')).toBeNull();
    },
  },

  OpeningASet: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'sets');
      cell(c, 'sets').dataset.list = last(c).rows.join('|');
      await go(c, 'down');
      await click(c, 'jog');
    },
    check: (context) => {
      // The most recently changed first.
      expect(cell(context.canvasElement, 'sets').dataset.list).toBe('Night Drive|Sketch 14|Ambient Study');
      expect(all(context, 'open-set')).toEqual([{ kind: 'file', action: 'open-set', set: 'set-2' }]);
    },
  },

  ANewSet: {
    ...inSets(),
    act: async ({ canvasElement: c }) => {
      cell(c, 'upper-8').dataset.label = rowTexts(c, 'top')[7];
      await press(c, 'upper-8');
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'upper-8').dataset.label).toContain('New Set');
      expect(all(context, 'new-set')).toEqual([{ kind: 'file', action: 'new-set' }]);
    },
  },

  SessionAndNew: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'session', async () => {
        await press(c, 'new');
      });
    },
    check: (context) => {
      expect(all(context, 'new-set')).toEqual([{ kind: 'file', action: 'new-set' }]);
      expect(all(context, 'new-scene')).toEqual([]);
      expect(all(context, 'new-clip')).toEqual([]);
      // Session was a modifier: the pads are still in Note Mode.
      expect(lampState(context.canvasElement, 'note')).toBe('lit');
    },
  },

  ByName: {
    ...inSets(),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-3', 4);
      cell(c, 'encoder-3').dataset.byName = last(c).rows.join('|');
      await press(c, 'lower-3');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-3').dataset.byName).toBe('Ambient Study|Night Drive|Sketch 14');
      // The button under the encoder turns the order round.
      expect(last(c).rows).toEqual(['Sketch 14', 'Night Drive', 'Ambient Study']);
      expect(rowTexts(c, 'bottom')[2]).toBe('Descending');
    },
  },

  CloudOn: {
    ...inSets(),
    set: (set) => void set.sets.push({ id: 'set-5', name: 'Shared Jam', modified: '2025-09-11', cloud: true }),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-1').dataset.label = display(c).querySelector('[data-type="param"][data-col="1"]')?.textContent ?? '';
      await turn(c, 'encoder-1', 4);
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-1').dataset.label).toContain('Cloud');
      expect(last(c).label).toBe('Cloud');
      expect(last(c).rows).toEqual(['Shared Jam', 'Live Set Berlin']);
    },
  },

  ANewVersion: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'save');
      });
    },
    check: (context) => {
      expect(all(context, 'save-version')).toEqual([{ kind: 'file', action: 'save-version' }]);
      expect(all(context, 'save-set')).toEqual([]);
    },
  },

  ANewProject: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'duplicate', async () => {
        await press(c, 'save');
      });
      await press(c, 'save');
    },
    check: (context) => {
      expect(all(context, 'save-set-as')).toEqual([{ kind: 'file', action: 'save-set-as' }]);
      // Duplicate was a modifier: nothing was duplicated. Save alone saves the Set.
      expect(all(context, 'duplicate-scene')).toEqual([]);
      expect(all(context, 'save-set')).toEqual([{ kind: 'file', action: 'save-set' }]);
    },
  },

  RenamingASet: {
    ...inSets(),
    act: async ({ canvasElement: c }) => {
      await nudge(c, 1);
      cell(c, 'jog').dataset.menu = last(c).rows.join('|');
      await go(c, 'down');
      await click(c, 'jog');
      cell(c, 'jog').dataset.entry = overlay(c, 'text-entry')?.querySelector('[data-part="entry"]')?.getAttribute('aria-label') ?? '';
      // Type the highlighted character, then Done.
      await click(c, 'jog');
      await press(c, 'upper-8');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'jog').dataset.menu).toBe('Delete|Rename');
      expect(cell(c, 'jog').dataset.entry).toBe('Text: Night Drive');
      expect(all(context, 'rename-file')).toEqual([{ kind: 'file', action: 'rename-file', set: 'set-1', text: 'Night DriveA' }]);
      expect(last(c).rows[0]).toBe('Night DriveA');
    },
  },

  ContentThatCannotBeChanged: {
    ...at(BASS, 0),
    act: async ({ canvasElement: c }) => {
      await nudge(c, 1);
    },
    check: async (context) => {
      const c = context.canvasElement;
      // A factory preset has no menu.
      expect(lists(c)).toHaveLength(4);
      expect(screenText(c)).not.toContain('Rename');
      expect(lampState(c, 'dpad-right')).toBe('off');
      // The person's own preset has one.
      await nudge(c, -1);
      await nudge(c, -1);
      await go(c, 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'centre');
      expect(last(c).chosen).toBe('My Bass');
      await nudge(c, 1);
      expect(last(c).rows).toEqual(['Delete', 'Rename']);
      expect(app(c).getSet().browser.roots.length).toBe(4);
    },
  },

  ComingBack: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'add');
      await go(c, 'centre', 'down', 'centre', 'down');
      cell(c, 'add').dataset.inside = `${lists(c).at(-2)!.chosen}|${last(c).chosen}`;
      await press(c, 'add');
      cell(c, 'add').dataset.left = screenKind(c) ?? '';
      await press(c, 'add');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'add').dataset.inside).toBe('Drums|909 Core Kit');
      expect(cell(c, 'add').dataset.left).toBe('device');
      expect(screenKind(c)).toBe('browse');
      expect(lists(c).at(-2)!.chosen).toBe('Drums');
      expect(last(c).chosen).toBe('909 Core Kit');
    },
  },
} satisfies Record<string, Play>;
