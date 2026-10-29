// Show's model: five tabs over the seven-song set, and the tree both renderers draw. No
// framework: `Show.tsx` (React) and `Show.svelte` (Svelte) both pass `showView` and
// `showHandlers` to their `Tree`, the open tab held by the binding. The show holds the dataset
// (`Show.data.ts`) and the tab specs (`Show.spec.ts`); the widgets are drawn by name, never
// re-drawn. A tab switch asks for `onTab`; every widget asks for its own callback and changes
// nothing itself.
import { textView } from '../../primitives/Text.model';
import { component, h, slot, type Handlers, type Node } from '../../view/Tree.model';
import type { ArpState, LiveCellRef, LiveLoop } from '../../components/music/live.model';
import type { ScreenSpec } from '../../layout/assembly/types';
import { SHOW_START, SHOW_TABS } from './Show.spec';
import { LIVE_SHOW, type ShowData } from './Show.data';

/** Every Show prop (region contents are the show's own widgets, never app slots). */
export interface ShowModelProps {
  /** The dataset; default the sample set. */
  data?: ShowData;
  /** The open tab's id; default the stage. */
  active?: string;
  /** A tab was chosen. */
  onTab?: (id: string) => void;
  /** Jamming: the grid stays live past the arrangement. Controlled; default the dataset's. */
  jam?: boolean;
  /** JAM was flipped. */
  onJam?: (on: boolean) => void;
  /** A loop cell was launched. */
  onLaunch?: (cell: LiveCellRef) => void;
  /** All clips were stopped. */
  onStop?: () => void;
  /** A track was stopped from the stop row. */
  onStopTrack?: (trackId: string) => void;
  /** A track head was selected. */
  onSelectTrack?: (id: string) => void;
  /** A song header was folded or unfolded. */
  onToggleSong?: (id: string) => void;
  /** A fader was ridden, 0–1. */
  onLevel?: (id: string, value: number) => void;
  /** A send was set, 0–1. */
  onSend?: (id: string, which: 0 | 1, value: number) => void;
  /** A return was ridden, 0–1. */
  onReturn?: (id: string, value: number) => void;
  /** A lamp was pressed. */
  onArm?: (id: string) => void;
  /** A mute lamp was pressed. */
  onMute?: (id: string) => void;
  /** A solo lamp was pressed. */
  onSolo?: (id: string) => void;
  /** A track name was pressed. */
  onSelect?: (id: string) => void;
  /** A chord block was followed. */
  onFollow?: (id: string) => void;
  /** The progression asked to mutate, keep or revert. */
  onMutate?: () => void;
  /** @see onMutate. */
  onKeep?: () => void;
  /** @see onMutate. */
  onRevert?: () => void;
  /** An arp step or the arp state was set. */
  onStep?: (index: number, step: { on: boolean; degree: number; velocity?: number; tie?: boolean }) => void;
  /** @see onStep. */
  onArpState?: (state: ArpState) => void;
  /** A macro pad was thrown. */
  onMove?: (id: string, x: number, y: number) => void;
  /** A transition pad was fired. */
  onFire?: (id: string) => void;
  /** A hot cue was jumped to. */
  onCue?: (id: string) => void;
  /** A stem lamp was pressed. */
  onToggleStem?: (id: string) => void;
  /** Shown, dimmed, deaf: the set is read, not played. */
  disabled?: boolean;
  /** Classes added to the root, after the show's own. */
  className?: string;
}

/** The tab the show holds open: `active`, else the start. */
export function showTab(active: string | undefined): (typeof SHOW_TABS)[number] {
  return SHOW_TABS.find((t) => t.id === active) ?? SHOW_TABS[0];
}

const jamLabel = (jam: boolean): string => (jam ? 'JAM on: the grid stays live past the arrangement' : 'JAM off: songs play their arrangement');

/**
 * The tree Show draws: the tab strip with the JAM lamp beside it, then the open tab's Screen —
 * each region holding the dataset's widget. `tab` is the binding's (`showTab(active)`).
 */
export function showView({ data = LIVE_SHOW, jam, disabled, className }: ShowModelProps, tab: (typeof SHOW_TABS)[number]): Node {
  const set = data;
  const jamming = jam ?? set.jam;
  const inert = disabled === true;
  const regions: Record<string, (ReturnType<typeof component> | ReturnType<typeof slot>)[]> = {
    loop: [
      component(
        'LoopGrid',
        { songs: [...set.songs], tracks: set.tracks.map((t) => ({ ...t })), loop: { ...set.loop } satisfies LiveLoop, selected: 'keys' },
        { on: { onLaunch: 'launch', onStop: 'stop', onStopTrack: 'stopTrack', onSelectTrack: 'selectTrack', onToggleSong: 'toggleSong' } },
      ),
    ],
    mix: [
      component(
        'MixBand',
        { tracks: set.tracks.map((t) => ({ ...t })), sends: set.returns.map((r) => ({ ...r })), selected: 'keys' },
        { on: { onLevel: 'level', onSend: 'send', onReturn: 'return', onArm: 'arm', onMute: 'mute', onSolo: 'solo', onSelect: 'select' } },
      ),
    ],
    follow: [
      component(
        'ChordStrip',
        { chords: set.chords.map((c) => ({ ...c })), index: set.chordIndex, selected: set.chords[set.chordIndex]?.id },
        { on: { onFollow: 'follow', onMutate: 'mutate', onKeep: 'keep', onRevert: 'revert' } },
      ),
    ],
    keys: [
      component(
        'ArpSequencer',
        { state: { ...set.arp, steps: set.arp.steps.map((s) => ({ ...s })) }, chords: set.chords.map((c) => ({ ...c })), index: Math.min(set.chordIndex, set.chords.length - 1) },
        { on: { onStep: 'step', onState: 'arpState' } },
      ),
    ],
    pads: [component('MacroPads', { pads: set.macros.map((m) => ({ ...m })) }, { on: { onMove: 'move' } })],
    cuts: [component('TransitionRow', { pads: set.transitions.map((t) => ({ ...t })), selected: 'drop' }, { on: { onFire: 'fire' } })],
    stems: [
      component(
        'StemLanes',
        { stems: set.stems.map((s) => ({ ...s })), cues: set.cues.map((c) => ({ ...c })), window: { ...set.window }, position: 0.52 },
        { on: { onCue: 'cue', onToggle: 'toggleStem' } },
      ),
    ],
  };
  const slots: Record<string, (ReturnType<typeof component> | ReturnType<typeof slot>)[]> = {};
  for (const id of tab.spec.rows.flatMap((row) => row.flatMap((item) => ('rows' in item ? [] : [item.id])))) {
    if (regions[id]) slots[`region:${id}`] = regions[id];
  }
  const tag = textView({ role: 'label', leading: 'tight', className: 'yh-show__name' });
  return h(
    'div',
    {
      class: `yh-show${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-tab': tab.id,
      'data-jam': jamming ? 'true' : undefined,
      'data-disabled': inert ? 'true' : undefined,
    },
    h(
      'div',
      { class: 'yh-show__bar', 'data-part': 'bar' },
      component(
        'Tabs',
        { name: 'Show tabs', items: SHOW_TABS.map((t) => ({ id: t.id, label: t.title })) },
        { on: { onChange: 'tab' } },
      ),
      h('span', { class: tag.className, ...tag.attrs, 'data-part': 'setname' }, 'Hidden Signals · 112 · 17.3'),
      component(
        'LampButton',
        { label: 'JAM', on: jamming, rec: true, name: jamLabel(jamming) },
        { on: { onToggle: 'jam' } },
      ),
    ),
    component('Screen', { name: tab.title, spec: tab.spec }, { slots }),
  );
}

/** The callbacks `showView`'s tree names: the tab, JAM and every widget's asks. */
export function showHandlers({ data = LIVE_SHOW, jam, onTab, onJam, onLaunch, onStop, onStopTrack, onSelectTrack, onToggleSong, onLevel, onSend, onReturn, onArm, onMute, onSolo, onSelect, onFollow, onMutate, onKeep, onRevert, onStep, onArpState, onMove, onFire, onCue, onToggleStem }: ShowModelProps): Handlers {
  const jamming = jam ?? data.jam;
  return {
    tab: (id: string) => onTab?.(id),
    jam: () => onJam?.(!jamming),
    launch: (cell: LiveCellRef) => onLaunch?.(cell),
    stop: () => onStop?.(),
    stopTrack: (trackId: string) => onStopTrack?.(trackId),
    selectTrack: (id: string) => onSelectTrack?.(id),
    toggleSong: (id: string) => onToggleSong?.(id),
    level: (id: string, value: number) => onLevel?.(id, value),
    send: (id: string, which: 0 | 1, value: number) => onSend?.(id, which, value),
    return: (id: string, value: number) => onReturn?.(id, value),
    arm: (id: string) => onArm?.(id),
    mute: (id: string) => onMute?.(id),
    solo: (id: string) => onSolo?.(id),
    select: (id: string) => onSelect?.(id),
    follow: (id: string) => onFollow?.(id),
    mutate: () => onMutate?.(),
    keep: () => onKeep?.(),
    revert: () => onRevert?.(),
    step: (index: number, step: { on: boolean; degree: number; velocity?: number; tie?: boolean }) => onStep?.(index, step),
    arpState: (state: ArpState) => onArpState?.(state),
    move: (id: string, x: number, y: number) => onMove?.(id, x, y),
    fire: (id: string) => onFire?.(id),
    cue: (id: string) => onCue?.(id),
    toggleStem: (id: string) => onToggleStem?.(id),
  };
}
