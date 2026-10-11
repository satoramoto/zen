import type { SystemPageData } from '../Settings/types'

/** The board: the synth running at 128 frames, CPU 74 % (trouble red), All inputs, the Launchkey connected. */
export const systemBoard: SystemPageData = {
  synthRunning: true,
  synthOn: true,
  outputPairs: [
    { first: 1, label: '1–2' },
    { first: 3, label: '3–4' },
  ],
  outputFirst: 1,
  buffers: [64, 128, 256, 512, 1024],
  buffer: 128,
  latencyMs: '2.7',
  sampleRateKhz: '48',
  master: 100,
  cpu: 74,
  dropouts: 0,
  allInputs: true,
  inputsFixed: false,
  inputs: [
    { name: 'Launchkey MK4 61 DAW', listening: true, pads: true },
    { name: 'Launchkey MK4 61 MIDI', listening: true, pads: false },
    { name: 'IAC Driver Bus 1', listening: true, pads: false },
    { name: 'Roland UM-ONE', listening: true, pads: false },
  ],
  outputPort: 'yahaha Out',
  launchkeyConnected: true,
  launchkeyName: 'MK4 61',
  paletteLeds: false,
  ledsFixed: false,
  styleFolders: ['~/Music/yahaha/Styles', '~/Documents/Genos Styles'],
  styleCount: 1284,
  scanning: false,
  rescanFixed: false,
  soundFonts: ['GeneralUser GS.sf2'],
  soundFontMain: 'GeneralUser GS',
  theme: 'dark',
}

/** Only these inputs: IAC Driver Bus 1 is off; a calm CPU, two dropouts lately. */
export const systemOnlyThese: SystemPageData = {
  ...systemBoard,
  cpu: 31,
  dropouts: 2,
  allInputs: false,
  inputs: systemBoard.inputs.map((input) =>
    input.name === 'IAC Driver Bus 1' ? { ...input, listening: false } : input,
  ),
}

/** Started without the built-in synth: its controls are shown, not pressable; no master, no CPU reading; no Launchkey. */
export const systemNoSynth: SystemPageData = {
  ...systemBoard,
  synthRunning: false,
  synthOn: false,
  outputFirst: null,
  buffer: null,
  latencyMs: null,
  sampleRateKhz: null,
  master: null,
  cpu: null,
  inputs: systemBoard.inputs.filter((input) => !input.name.startsWith('Launchkey')),
  launchkeyConnected: false,
  launchkeyName: '',
  paletteLeds: null,
  theme: 'light',
}

/** Rescanning the style folders: the Rescan button waits. */
export const systemScanning: SystemPageData = {
  ...systemBoard,
  cpu: 52,
  scanning: true,
}

/** Nothing found: no inputs, no folders, no SoundFonts, no virtual output; the engine fixes every choice. */
export const systemEmpty: SystemPageData = {
  ...systemBoard,
  cpu: 12,
  allInputs: null,
  inputsFixed: true,
  inputs: [],
  outputPort: '',
  launchkeyConnected: false,
  launchkeyName: '',
  ledsFixed: true,
  styleFolders: [],
  styleCount: 0,
  rescanFixed: true,
  soundFonts: [],
  soundFontMain: null,
}
