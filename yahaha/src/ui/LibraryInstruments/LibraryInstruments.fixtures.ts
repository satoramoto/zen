import type { InstrumentDetail, InstrumentRow } from './types'

/** The board's list: Sampler Deluxe playing on three parts, Tiny Synth new, Orchestra Deluxe missing, one SoundFont. */
export const instrumentRows: InstrumentRow[] = [
  { id: 'au:aumu Smp7 Fake', kind: 'AU', name: 'Sampler Deluxe', status: 'In use on R1 R2 L', sounds: '38', racks: '6' },
  { id: 'au:aumu Tiny Demo', kind: 'AU', name: 'Tiny Synth', status: 'not opened yet', sounds: '0', racks: '0', fresh: true },
  { id: 'missing:aumu Orc1 Fake', kind: 'AU', name: 'Orchestra Deluxe', status: 'Missing', sounds: '4', racks: '3', missing: true },
  { id: 'font:Studio Basics.sf2', kind: 'SF', name: 'Studio Basics', status: '260 presets', sounds: '14', racks: '—' },
]

/** Sampler Deluxe chosen: in process, playing on Right 1, Right 2 and Left. */
export const samplerDetail: InstrumentDetail = {
  id: 'au:aumu Smp7 Fake',
  title: 'Sampler Deluxe',
  badge: 'AU',
  subtitle: 'Fake Instruments · version 2.4',
  fields: [
    { label: 'My Sounds', values: [{ text: '38' }] },
    { label: 'In racks', values: [{ text: '6' }] },
    {
      label: 'Playing on',
      values: [
        { text: 'Right 1', hue: 'r1' },
        { text: 'Right 2', hue: 'r2' },
        { text: 'Left', hue: 'l' },
      ],
    },
  ],
  inProcess: true,
  canBrowse: true,
  newSound: { part: 'Right 1' },
  edit: { enabled: true },
  replace: null,
  showRacks: false,
}

/** Orchestra Deluxe chosen: missing, used by 3 racks, no part playing it now. */
export const missingDetail: InstrumentDetail = {
  id: 'missing:aumu Orc1 Fake',
  title: 'Orchestra Deluxe',
  badge: 'AU',
  subtitle: 'Fake Instruments · not found by the last scan',
  fields: [
    { label: 'My Sounds', values: [{ text: '4' }] },
    { label: 'In racks', values: [{ text: '3' }] },
    { label: 'Status', values: [{ text: 'Missing: its parts are silent', hue: 'warn' }] },
  ],
  inProcess: null,
  canBrowse: false,
  newSound: null,
  edit: null,
  replace: { enabled: false },
  showRacks: true,
}

/** The header's counts and the folder line. */
export const instrumentsBoard = {
  summary: '3 plugins, 1 SoundFont',
  attention: 1,
  folder: 'Studio Basics.sf2',
  hint: 'Drop a .sf2 in the SoundFont folder; it shows here the next time yahaha starts. Audio Units come from Rescan.',
}
