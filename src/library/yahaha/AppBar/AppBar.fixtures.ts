import { displayPageTabs, fullPageTabs } from '../ChosenTabs/ChosenTabs.fixtures';

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
