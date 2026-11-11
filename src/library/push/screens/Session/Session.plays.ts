// What each push-session scenario does and checks. The words are in Session.stories.tsx. The
// sample Set has twelve tracks and eight scenes; the drum track's clips are in scenes 1, 2 and 4.
import { initialState } from '../../model/state';
import type { PushSet, PushState } from '../../model/types';
import { all, app, cell, click, display, down, expect, GREEN, given, hit, holdDown, holding, intent, lamp, lampState, onTrack, overlay, padColour, press, RED, rowTexts, screenKind, tab, tableLamp, turn, wait, waitFor, whiteLamp, HOLD } from '../play';
import type { Play } from '../scenario';

const none = async () => {};
const onScreen = (more: Partial<PushState> = {}) => ({ args: { initialState: { ...initialState(), display: 'session' as const, ...more } } });
const onPads = (more: Partial<PushState> = {}) => ({ args: { initialState: { ...initialState(), pads: 'session' as const, ...more } } });
/** Give a Set `n` scenes. */
const scenes = (n: number, more: (set: PushSet) => void = () => {}) => (set: PushSet) => {
  set.scenes = Array.from({ length: n }, (_, i) => set.scenes[i] ?? { name: `Scene ${i + 1}` });
  for (const t of set.tracks) t.clips = Array.from({ length: n }, (_, i) => t.clips[i] ?? null);
  more(set);
};
const slot = (c: HTMLElement, row: number, col: number) => display(c).querySelector<HTMLElement>(`.push-display__grid-row[data-row="${row}"] [data-col="${col}"]`)!;
const sceneLabel = (c: HTMLElement, row: number) => display(c).querySelector(`.push-display__grid-row[data-row="${row}"] [data-part="scene"]`)!.textContent ?? '';
const playing = (track: number, scene: number) => (set: PushSet) => {
  set.tracks[track].clips[scene]!.state = 'playing';
  set.tracks[track].playing = scene;
  set.transport.playing = true;
};

export const plays = {
  ANamedClip: {
    ...onScreen(),
    set: (set) => void (set.tracks[0].clips[1]!.name = 'Distant Kicks'),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('session');
      // The drums are the first column; the clip is in the second scene's row, in its own colour.
      expect(slot(c, 2, 1)).toHaveTextContent('Distant Kicks');
      expect(slot(c, 2, 1).style.getPropertyValue('--push-lamp')).toBe(tableLamp(15));
      expect(slot(c, 3, 1)).toHaveAttribute('data-empty', 'true');
      expect(display(c).querySelectorAll('.push-display__grid-row')).toHaveLength(8);
      expect([1, 2, 3].map((r) => sceneLabel(c, r))).toEqual(['1', '2', '3']);
    },
  },

  ThePlayingScene: {
    ...onScreen(),
    set: playing(0, 1),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(sceneLabel(c, 2)).toBe('▶ 2');
      expect(sceneLabel(c, 1)).toBe('1');
      expect(slot(c, 2, 1)).toHaveAttribute('data-state', 'playing');
    },
  },

  DownAScene: {
    ...onScreen(),
    set: (set) => void (set.selection.scene = 1),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'jog', 1);
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'select-scene')).toEqual([{ kind: 'navigate', action: 'select-scene', scene: 2 }]);
      await waitFor(() => expect(slot(c, 3, 1)).toHaveAttribute('data-selected', 'true'));
    },
  },

  PastTheEighthTrack: {
    ...onScreen(),
    set: onTrack('t-pad'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'dpad-right');
      await wait(60);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'select-track')).toMatchObject({ track: 't-lead' });
      // The grid has scrolled one track: the Lead is the eighth column, and the drums have gone.
      expect(rowTexts(c, 'bottom')[7]).toContain('Lead');
      expect(slot(c, 4, 8)).toHaveTextContent('Lead Line');
      expect(slot(c, 1, 1)).toHaveTextContent('Bassline');
    },
  },

  LaunchingOneClip: {
    ...onScreen(),
    set: (set) => void (set.selection.scene = 1),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-3');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'launch-clip')).toEqual([{ kind: 'transport', action: 'launch-clip', track: 't-keys', scene: 1 }]);
      // The button wears the clip's colour, and pulses green once the app has it playing.
      await waitFor(() => expect(lamp(c, 'upper-3')).toEqual({ state: 'pulse', colour: GREEN }));
      expect(lamp(c, 'upper-1').colour).toBe(tableLamp(15));
    },
  },

  AnEmptySlotOnAnArmedTrack: {
    ...onScreen(),
    set: (set) => void (set.tracks[3].armed = true),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(lamp(c, 'upper-4').colour).toContain(RED);
      expect(lampState(c, 'upper-4')).toBe('lit');
      // An empty slot of a track that is not armed is unlit.
      expect(lampState(c, 'upper-3')).toBe('off');
    },
  },

  NamedScenes: {
    ...onScreen(),
    set: (set) => void (set.scenes[1].name = 'Chorus'),
    act: async ({ canvasElement: c }) => {
      cell(c, 'jog').dataset.before = sceneLabel(c, 2);
      const touch = await down(c, 'jog');
      cell(c, 'jog').dataset.during = sceneLabel(c, 2);
      await touch.up();
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'jog').dataset.before).toBe('2');
      expect(cell(c, 'jog').dataset.during).toBe('Chorus');
      expect(sceneLabel(c, 2)).toBe('2');
    },
  },

  DeletingAClip: {
    ...onScreen(),
    set: (set) => void (set.selection.scene = 1),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'delete', async () => {
        await press(c, 'upper-5');
      });
    },
    check: (context) => {
      expect(all(context, 'delete-clip')).toEqual([{ kind: 'edit', action: 'delete-clip', track: 't-vocals', scene: 1 }]);
      expect(all(context, 'launch-clip')).toEqual([]);
      expect(slot(context.canvasElement, 2, 5)).toHaveAttribute('data-empty', 'true');
    },
  },

  AQueuedClip: {
    ...onPads(),
    set: (set) => void (set.tracks[1].clips[0]!.state = 'queued'),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(lamp(c, 'pad-1-2')).toEqual({ state: 'blink', colour: GREEN });
      // A stopped clip is lit in its own colour, an empty slot is unlit.
      expect(lamp(c, 'pad-1-1')).toEqual({ state: 'lit', colour: tableLamp(14) });
      expect(lampState(c, 'pad-3-1')).toBe('off');
    },
  },

  AnArmedTracksEmptySlots: {
    ...onPads(),
    set: (set) => void (set.tracks[4].armed = true),
    act: none,
    check: ({ canvasElement: c }) => {
      // The vocals are the fifth column, with clips in scenes 2 and 4.
      for (const row of [1, 3, 5, 6, 7, 8]) expect(padColour(c, row, 5)).toContain(RED);
      for (const row of [2, 4]) expect(padColour(c, row, 5)).not.toContain(RED);
      expect(lampState(c, 'pad-3-4')).toBe('off');
    },
  },

  StoppingATrack: {
    ...onPads(),
    set: playing(1, 0),
    act: async ({ canvasElement: c }) => {
      cell(c, 'pad-1-2').dataset.before = `${lampState(c, 'pad-1-2')} ${padColour(c, 1, 2)}`;
      await hit(c, 2, 2);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-1-2').dataset.before).toBe(`pulse ${GREEN}`);
      expect(all(context, 'stop-clip')).toEqual([{ kind: 'transport', action: 'stop-clip', track: 't-bass' }]);
      expect(all(context, 'record-clip')).toEqual([]);
      expect(lamp(c, 'pad-1-2')).toEqual({ state: 'lit', colour: tableLamp(22) });
    },
  },

  RecordingANewClip: {
    ...onPads(),
    set: (set) => void (set.tracks[2].armed = true),
    act: async ({ canvasElement: c }) => {
      await hit(c, 1, 3);
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'record-clip')).toEqual([{ kind: 'transport', action: 'record-clip', track: 't-keys', scene: 0 }]);
      expect(all(context, 'stop-clip')).toEqual([]);
      await waitFor(() => expect(lamp(c, 'pad-1-3')).toEqual({ state: 'lit', colour: RED }));
    },
  },

  ASceneButton: {
    ...onPads(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'scene-3');
    },
    check: (context) => {
      expect(all(context, 'launch-scene')).toEqual([{ kind: 'transport', action: 'launch-scene', scene: 2 }]);
    },
  },

  APageOfTracks: {
    ...onPads(),
    act: async ({ canvasElement: c }) => {
      cell(c, 'page-right').dataset.before = `${padColour(c, 1, 1)}|${lampState(c, 'page-right')}`;
      await press(c, 'page-right');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'page-right').dataset.before).toBe(`${tableLamp(14)}|dim`);
      // The ninth track (Lead) is now the first column: its clip is in the fourth scene.
      expect(padColour(c, 4, 1)).toBe(tableLamp(11));
      expect(padColour(c, 3, 2)).toBe(tableLamp(20));
      expect(lampState(c, 'pad-1-1')).toBe('off');
      // The selection has not moved.
      expect(all(context, 'select-track')).toEqual([]);
      expect(all(context, 'select-clip')).toEqual([]);
      expect(app(c).getSet().selection).toMatchObject({ track: 't-drums', scene: 0 });
    },
  },

  OneWindow: {
    ...onScreen(),
    set: scenes(12, (set) => void (set.tracks[0].clips[8] = { ...set.tracks[0].clips[0]!, name: 'Ninth', colour: 5 })),
    act: async ({ canvasElement: c }) => {
      for (let i = 0; i < 8; i++) {
        await turn(c, 'jog', 1);
        await wait(25);
      }
      cell(c, 'jog').dataset.screen = `${sceneLabel(c, 8)}|${slot(c, 8, 1).textContent}`;
      await press(c, 'session');
    },
    check: ({ canvasElement: c }) => {
      // The screen scrolled to show scene 9 in its last row; the pads show the same window.
      expect(cell(c, 'jog').dataset.screen).toBe('9|Ninth');
      expect(padColour(c, 8, 1)).toBe(tableLamp(5));
      expect(app(c).getSet().selection.scene).toBe(8);
    },
  },

  LookingAtAClip: {
    ...onPads(),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'select', async () => {
        await hit(c, 2, 1);
      });
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'select-clip')).toEqual([{ kind: 'navigate', action: 'select-clip', track: 't-drums', scene: 1 }]);
      expect(all(context, 'launch-clip')).toEqual([]);
      expect(overlay(c, 'notice')).toHaveTextContent('Beat B');
      expect(app(c).getSet().selection.scene).toBe(1);
    },
  },

  CopyingToAnEmptySlot: {
    ...onPads(),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'duplicate', async () => {
        await hit(c, 1, 1);
        await hit(c, 3, 1);
      });
    },
    check: (context) => {
      expect(all(context, 'duplicate-clip')).toEqual([{ kind: 'edit', action: 'duplicate-clip', from: { track: 't-drums', scene: 0 }, to: { track: 't-drums', scene: 2 } }]);
      expect(all(context, 'launch-clip')).toEqual([]);
      expect(all(context, 'stop-clip')).toEqual([]);
      expect(all(context, 'duplicate-scene')).toEqual([]);
    },
  },

  AYellowClip: {
    ...onPads(),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await hit(c, 1, 1);
      });
      // The ring holds the table's colours clockwise from the top left: yellow is the fourth.
      cell(c, 'pad-1-4').dataset.ring = padColour(c, 1, 4);
      await hit(c, 1, 4);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-1-4').dataset.ring).toBe(tableLamp(3));
      expect(all(context, 'set-colour')).toEqual([{ kind: 'edit', action: 'set-colour', of: 'clip', track: 't-drums', scene: 0, colour: 3 }]);
      expect(all(context, 'launch-clip')).toEqual([]);
      // The grid is the clips again, and the clip is yellow.
      expect(padColour(c, 1, 1)).toBe(tableLamp(3));
    },
  },

  JumpingToABlock: {
    ...onPads(),
    set: scenes(24, (set) => void (set.tracks[0].clips[16] = { ...set.tracks[0].clips[0]!, colour: 5 })),
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'layout', async () => {
        cell(c, 'layout').dataset.overview = [1, 2, 3, 4].map((row) => padColour(c, row, 1)).join('|');
        await hit(c, 3, 1);
      }, HOLD);
      await wait(40);
    },
    check: ({ canvasElement: c }) => {
      // The overview: the block in view white, the other blocks that exist grey, none where there are no scenes.
      expect(cell(c, 'layout').dataset.overview).toBe([whiteLamp(), whiteLamp('dark'), whiteLamp('dark'), ''].join('|'));
      // Scenes 17 to 24 and tracks 1 to 8: the clip in scene 17 is the first pad.
      expect(padColour(c, 1, 1)).toBe(tableLamp(5));
      expect(lampState(c, 'dpad-down')).toBe('off');
      expect(lampState(c, 'dpad-up')).toBe('dim');
    },
  },

  BlocksOf64Scenes: {
    ...onPads({ session: { track: 0, scene: 0, overviewLocked: true } }),
    set: scenes(130, (set) => void (set.tracks[0].clips[64] = { ...set.tracks[0].clips[0]!, colour: 5 })),
    act: async ({ canvasElement: c }) => {
      cell(c, 'scene-2').dataset.before = [1, 2, 3, 4].map((n) => lampState(c, `scene-${n}`)).join(' ');
      await press(c, 'scene-2');
      await hit(c, 1, 1);
      await press(c, 'layout');
    },
    check: ({ canvasElement: c }) => {
      // 130 scenes are three blocks of 64: the first in view, the fourth button has none.
      expect(cell(c, 'scene-2').dataset.before).toBe('lit dim dim off');
      // The second block's first pad is scenes 65 to 72.
      expect(padColour(c, 1, 1)).toBe(tableLamp(5));
    },
  },

  StopEverything: {
    set: playing(1, 0),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'stop-clip');
      });
    },
    check: (context) => {
      expect(all(context, 'stop-all-clips')).toEqual([{ kind: 'transport', action: 'stop-all-clips' }]);
      expect(all(context, 'stop-clip')).toEqual([]);
    },
  },

  WhichTracksAreStopped: {
    set: playing(1, 0),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, 'stop-clip');
      cell(c, 'stop-clip').dataset.during = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => lampState(c, `lower-${n}`)).join(' ');
      await press(c, 'lower-3');
      await touch.up();
    },
    check: (context) => {
      // Only the bass is playing.
      expect(cell(context.canvasElement, 'stop-clip').dataset.during).toBe('off lit off off off off off off');
      expect(all(context, 'stop-clip')).toEqual([{ kind: 'transport', action: 'stop-clip', track: 't-keys' }]);
    },
  },

  NewInSceneWorkflow: {
    set: playing(1, 0),
    act: async ({ canvasElement: c }) => {
      await press(c, 'new');
    },
    check: (context) => {
      expect(all(context, 'new-scene')).toEqual([{ kind: 'edit', action: 'new-scene', keep: 'playing', empty: 't-drums' }]);
      expect(all(context, 'new-clip')).toEqual([]);
    },
  },

  NewInClipWorkflow: {
    set: (set) => void (set.unit.preferences.Workflow.value = 'Clip'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'new');
    },
    check: (context) => {
      expect((context.args.onIntent as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(1);
      expect(all(context, 'new-clip')).toEqual([{ kind: 'edit', action: 'new-clip', track: 't-drums' }]);
    },
  },

  TheClipBelow: {
    args: { initialState: { ...initialState(), display: 'clip' } },
    act: async ({ canvasElement: c }) => {
      await press(c, 'dpad-down');
      cell(c, 'dpad-down').dataset.shown = `${screenKind(c)}`;
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'dpad-down').dataset.shown).toBe('session');
      expect(all(context, 'select-scene')).toEqual([{ kind: 'navigate', action: 'select-scene', scene: 1 }]);
      await waitFor(() => expect(slot(c, 2, 1)).toHaveAttribute('data-selected', 'true'));
      // A moment later Clip View is back, on the clip below.
      await wait(1700);
      expect(screenKind(c)).not.toBe('session');
      expect(app(c).getSet().selection.scene).toBe(1);
    },
  },
} satisfies Record<string, Play>;

void click;
void given;
void tab;
