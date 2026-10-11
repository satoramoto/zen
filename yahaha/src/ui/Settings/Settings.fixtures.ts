import { boardAppBar } from '../AppBar/AppBar.fixtures'
import { boardKeys } from '../Keys/Keys.fixtures'
import { chordBoard } from '../SettingsChord/SettingsChord.fixtures'
import { keyboardBoard } from '../SettingsKeyboard/SettingsKeyboard.fixtures'
import { launchkeyBoard } from '../SettingsLaunchkey/SettingsLaunchkey.fixtures'
import { pedalsBoard } from '../SettingsPedals/SettingsPedals.fixtures'
import { styleBoard } from '../SettingsStyle/SettingsStyle.fixtures'
import { systemBoard } from '../SettingsSystem/SettingsSystem.fixtures'
import type { SettingsPageItem } from './types'

/** The six pages as the left column lists them: names only. */
export const settingsPageItems: SettingsPageItem[] = [
  { id: 'chord', label: 'Chord & Split', tip: 'settings.tab.chord' },
  { id: 'style', label: 'Style', tip: 'settings.tab.style' },
  { id: 'keyboard', label: 'Keyboard', tip: 'settings.tab.keyboard' },
  { id: 'pedals', label: 'Pedals', tip: 'settings.tab.controllers' },
  { id: 'system', label: 'System', tip: 'settings.tab.system' },
  { id: 'launchkey', label: 'Controller', tip: 'settings.tab.launchkey' },
]

/** The dark boards: the Settings tab chosen, running, the Chord & Split page open. */
export const settingsBoard = {
  appBar: { ...boardAppBar, chosen: 'settings' },
  help: false,
  pages: settingsPageItems,
  page: 'chord' as const,
  chord: chordBoard,
  style: styleBoard,
  keyboard: keyboardBoard,
  pedals: pedalsBoard,
  system: systemBoard,
  launchkey: launchkeyBoard,
  status: { text: null },
  keys: boardKeys,
}
