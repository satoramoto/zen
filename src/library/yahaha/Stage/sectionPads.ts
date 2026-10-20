import type { PadItem } from '../PadBank/PadBank.model';
import type { PadFamily } from '../../components/music/Pad/Pad.model';
import { SECTION_LABEL, type SectionId, type SongFormProps } from '../SongForm/SongForm.model';

/** The Sections bank's name, as PadBank's tabs and the Launchkey call it. */
export const SECTIONS_BANK = 'Sections';

/** What a Sections pad does: play a section, or one of the transport keys the hardware puts here. */
export type SectionPadAction = { section: SectionId } | { key: 'syncStart' | 'autoFill' | 'tap' | 'syncStop' | 'startStop' };

/** The Launchkey's Sections bank, pad 1 to 16: two rows of eight (PadBank's `sectionPads` order). */
export const SECTION_PAD_LAYOUT: readonly SectionPadAction[] = [
  { section: 'intro1' },
  { section: 'intro2' },
  { section: 'intro3' },
  { key: 'syncStart' },
  { section: 'ending1' },
  { section: 'ending2' },
  { section: 'ending3' },
  { key: 'autoFill' },
  { section: 'mainA' },
  { section: 'mainB' },
  { section: 'mainC' },
  { section: 'mainD' },
  { section: 'break' },
  { key: 'tap' },
  { key: 'syncStop' },
  { key: 'startStop' },
];

const FAMILY: Record<SectionId, PadFamily> = {
  intro1: 'intro',
  intro2: 'intro',
  intro3: 'intro',
  mainA: 'main',
  mainB: 'main',
  mainC: 'main',
  mainD: 'main',
  ending1: 'ending',
  ending2: 'ending',
  ending3: 'ending',
  break: 'brk',
};

const TIP: Record<SectionId, string> = {
  intro1: 'section.intro1',
  intro2: 'section.intro2',
  intro3: 'section.intro3',
  mainA: 'section.main_a',
  mainB: 'section.main_b',
  mainC: 'section.main_c',
  mainD: 'section.main_d',
  ending1: 'section.ending1',
  ending2: 'section.ending2',
  ending3: 'section.ending3',
  break: 'section.break',
};

/**
 * The Sections bank's sixteen pads, drawn from the song form's own props, so the pads and the strip
 * can never disagree: the same section plays (filled only while running; stopped, the section the
 * band starts from is idle and spoken "starts here", as on the strip), the same one is next (the
 * accent ring), the same ones are absent (dark), and Sync Start, Sync Stop, Auto Fill and Start /
 * Stop wear the transport's state. Each name says the state as the strip does, plus the pad's number.
 */
export function sectionPads(form: Pick<SongFormProps, 'running' | 'playing' | 'next' | 'nextAt' | 'absent' | 'syncStart' | 'syncStop' | 'autoFill'>): PadItem[] {
  const { running = false, playing, next, nextAt, absent = [], syncStart = false, syncStop = false, autoFill = false } = form;
  const missing = new Set(absent);
  return SECTION_PAD_LAYOUT.map((action, i) => {
    const n = `pad ${i + 1}`;
    if ('section' in action) {
      const id = action.section;
      const label = SECTION_LABEL[id];
      const spoken = label.replace(/ /g, ' ');
      const base = { label, family: FAMILY[id], tip: TIP[id] };
      if (missing.has(id)) return { ...base, state: 'dark', name: `${spoken}, not in this style (${n})` };
      if (id === playing) return { ...base, state: running ? 'playing' : 'idle', name: `${spoken}, ${running ? 'playing' : 'starts here'} (${n})` };
      if (id === next) return { ...base, state: 'next', name: `${spoken}, next${nextAt ? `, ${nextAt}` : ''} (${n})` };
      return { ...base, state: 'idle', name: `${spoken} (${n})` };
    }
    switch (action.key) {
      case 'syncStart':
        return { label: 'Sync Start', family: 'util', transport: true, tip: 'transport.sync_start', state: syncStart ? 'armed' : 'idle', name: `Sync Start${syncStart ? ', armed' : ''} (${n})` };
      case 'autoFill':
        return { label: 'Auto Fill', family: 'util', transport: true, tip: 'transport.auto_fill', state: autoFill ? 'playing' : 'idle', name: `Auto Fill, ${autoFill ? 'on' : 'off'} (${n})` };
      case 'tap':
        return { label: 'Tap', family: 'util', transport: true, tip: 'tempo.tap', state: 'idle', name: `Tap tempo (${n})` };
      case 'syncStop':
        return { label: 'Sync Stop', family: 'util', transport: true, tip: 'transport.sync_stop', state: syncStop ? 'armed' : 'idle', name: `Sync Stop${syncStop ? ', on' : ''} (${n})` };
      case 'startStop':
        return { label: 'Start / Stop', family: 'start', transport: true, tip: 'transport.start_stop', state: running ? 'running' : 'idle', name: `Start / Stop, ${running ? 'running' : 'stopped'} (${n})` };
    }
  });
}

/** The song form's callbacks a Sections pad presses, and the hero's Tap. */
export interface SectionPadHandlers extends Pick<SongFormProps, 'running' | 'absent' | 'syncStart' | 'syncStop' | 'autoFill' | 'onSection' | 'onSyncStart' | 'onSyncStop' | 'onAutoFill' | 'onStartStop'> {
  onTap?: () => void;
}

/** Presses Sections pad `index` (0–15): exactly what pressing that step or key does on the strip and in the transport. */
export function pressSectionPad(index: number, form: SectionPadHandlers) {
  const action = SECTION_PAD_LAYOUT[index];
  if (!action) return;
  if ('section' in action) {
    if (form.absent?.includes(action.section)) return;
    form.onSection?.(action.section);
    return;
  }
  switch (action.key) {
    case 'syncStart':
      return form.onSyncStart?.(!form.syncStart);
    case 'autoFill':
      return form.onAutoFill?.(!form.autoFill);
    case 'tap':
      return form.onTap?.();
    case 'syncStop':
      return form.onSyncStop?.(!form.syncStop);
    case 'startStop':
      return form.onStartStop?.();
  }
}
