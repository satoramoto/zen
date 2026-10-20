// AppBar's and MetronomePopover's stories as plain props: their `.stories.tsx` (React) and
// `.stories.svelte.ts` (Svelte) both draw them, and parity.test.tsx renders every instance in both.
import { defineFixtures } from '../../fixtures';
import type { TabItemModel } from '../../layout/Tabs.model';
import type { AppBarModelProps } from './AppBar.model';
import type { MetronomePopoverModelProps } from './MetronomePopover.model';

/** The app bar's display-page tabs, Stage … Harm/Arp. */
export const displayPageTabs: TabItemModel[] = [
  { id: 'stage', label: 'Stage', tip: 'view.stage' },
  { id: 'channel', label: 'Channel', tip: 'nav.channel' },
  { id: 'effects', label: 'Effects', tip: 'nav.effects' },
  { id: 'quickRacks', label: 'Quick Racks', tip: 'nav.quick' },
  { id: 'multiPads', label: 'Multi Pads', tip: 'nav.multipad' },
  { id: 'looper', label: 'Looper', tip: 'nav.looper' },
  { id: 'harmArp', label: 'Harm/Arp', tip: 'nav.harmony' },
];

/** The app bar's full-page tabs, after the separator. */
export const fullPageTabs: TabItemModel[] = [
  { id: 'library', label: 'Library', tip: 'view.library' },
  { id: 'settings', label: 'Settings', tip: 'nav.settings' },
];

/**
 * The Stage board's app bar, ported from `yahaha/src/ui/AppBar/AppBar.fixtures.ts`: Stage chosen,
 * the Launchkey connected, the audio calm, 1392 wide. The global switches come from the section
 * row's board (`SectionRow.fixtures.ts`): Metronome, Unison and help off, the settings closed.
 */
export const boardAppBar = {
  displayTabs: displayPageTabs,
  fullTabs: fullPageTabs,
  chosen: 'stage',
  launchkey: true,
  failedPart: null,
  synthOn: true,
  dropouts: 0,
  bufferFrames: 256,
  cpu: 0.2,
  width: 1392,
  metronome: false,
  metronomeOpen: false,
  unison: false,
  help: false,
} as const;

/** The metronome popover's board (`MetronomePopover.stories.ts`): on, volume 90, the bell on. */
export const boardMetronome = {
  id: 'metronome-settings',
  on: true,
  volume: 90,
  bell: true,
  audible: true,
} as const;

const PAGE_IDS = [...displayPageTabs, ...fullPageTabs].map((tab) => tab.id);

/** AppBar's controls, the same in both Storybooks. */
export const appBarArgTypes = {
  width: { control: { type: 'number', min: 0, step: 1 } },
  chosen: { control: 'select', options: [null, ...PAGE_IDS], table: { category: 'Tabs' } },
  displayTabs: { control: 'object', table: { category: 'Tabs' } },
  fullTabs: { control: 'object', table: { category: 'Tabs' } },
  launchkey: { control: 'boolean', table: { category: 'StatusDot' } },
  failedPart: { control: 'select', options: [null, 0, 1, 2, 3], table: { category: 'HealthSlot' } },
  synthOn: { control: 'boolean', table: { category: 'HealthSlot' } },
  dropouts: { control: { type: 'number', min: 0, step: 1 }, table: { category: 'HealthSlot' } },
  bufferFrames: { control: 'select', options: [null, 64, 128, 256, 512, 1024], table: { category: 'HealthSlot' } },
  cpu: { control: { type: 'range', min: 0, max: 1.2, step: 0.01 }, table: { category: 'HealthSlot' } },
  metronome: { control: 'boolean', table: { category: 'Switches' } },
  metronomeOpen: { control: 'boolean', table: { category: 'Switches' } },
  metronomeVolume: { control: { type: 'number', min: 0, max: 127, step: 1 }, table: { category: 'Switches' } },
  metronomeBell: { control: 'boolean', table: { category: 'Switches' } },
  metronomeAudible: { control: 'boolean', table: { category: 'Switches' } },
  unison: { control: 'boolean', table: { category: 'Switches' } },
  help: { control: 'boolean', table: { category: 'Switches' } },
  nowPlaying: { control: 'object' },
  end: { control: false },
} as const;

const offStage = { chosen: 'settings', nowPlaying: { style: 'Sunday Drive Pop', tempo: 104 } };

export const appBarStories = defineFixtures<AppBarModelProps>()({
  Board: { args: boardAppBar },
  Library: { args: { ...boardAppBar, chosen: 'library' } },
  OffStage: { args: { ...boardAppBar, ...offStage } },
  NoLaunchkey: { args: { ...boardAppBar, launchkey: false } },
  Trouble: { args: { ...boardAppBar, failedPart: 2 } },
  Helpers: { args: { ...boardAppBar, metronome: true } },
  AllOn: {
    args: {
      ...boardAppBar,
      metronome: true,
      metronomeOpen: true,
      metronomeVolume: boardMetronome.volume,
      metronomeBell: boardMetronome.bell,
      unison: true,
      help: true,
    },
  },
  MetronomeNotAudible: { args: { ...boardAppBar, metronome: true, metronomeOpen: true, metronomeAudible: false, synthOn: false } },
  Narrow: { args: { ...boardAppBar, ...offStage, width: 1217, dropouts: 4 } },
  Wide: { args: { ...boardAppBar, width: 1440 } },
  Live: { args: boardAppBar },
});

/** MetronomePopover's controls, the same in both Storybooks. */
export const metronomePopoverArgTypes = {
  id: { control: 'text' },
  on: { control: 'boolean' },
  volume: { control: { type: 'number', min: 0, max: 127, step: 1 } },
  bell: { control: 'boolean' },
  audible: { control: 'boolean' },
} as const;

export const metronomePopoverStories = defineFixtures<MetronomePopoverModelProps>()({
  Board: { args: boardMetronome },
  Off: { args: { ...boardMetronome, on: false, volume: 20, bell: false } },
  NotAudible: { args: { ...boardMetronome, audible: false } },
});
