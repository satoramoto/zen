// LampButton's stories as plain props: LampButton.stories.tsx (React) and LampButton.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every instance in both.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { LampButtonModelProps, LampHue } from './LampButton.model';

/** The controls, the same in both Storybooks. */
export const lampButtonArgTypes = {
  label: { control: 'text' },
  code: { control: 'text' },
  name: { control: 'text' },
  tip: { control: 'text' },
  on: { control: 'boolean' },
  disabled: { control: 'boolean' },
  rec: { control: 'boolean' },
  waiting: { control: 'boolean' },
  size: { control: 'select', options: ['md', 'sm', 'cell'] },
  hue: { control: 'select', options: ['t', 1, 2, 3, 4, 5, 'ok', 'lamp', 'role-2'] },
  join: { control: 'select', options: ['none', 'start', 'end'], mapping: { none: undefined } },
  width: { control: 'number' },
} as const;

type P = FixtureProps<LampButtonModelProps>;

/** The AllFaces story's columns (plus the record lamp) and rows. */
export const LAMP_HUES: LampHue[] = ['t', 1, 2, 3, 4, 5, 'ok', 'lamp', 'role-2'];
export const LAMP_FACES = [
  { face: 'Off', props: {} },
  { face: 'Armed', props: { waiting: true } },
  { face: 'On', props: { on: true } },
  { face: 'Armed on', props: { on: true, armed: true } },
  { face: 'Disabled', props: { disabled: true } },
] as const satisfies { face: string; props: P }[];

/** One AllFaces cell: a face in a hue, or the record lamp (`rec`). */
export const faceCell = (face: (typeof LAMP_FACES)[number], hue: LampHue | 'rec'): P => ({
  label: face.face,
  size: 'cell',
  ...(hue === 'rec' ? { rec: true } : { hue }),
  name: `${hue} ${face.face}`,
  ...face.props,
});

/** The JoinStart story's rows: Metronome (over the story's args), off and lit, joined to its ▾ caret. */
const JOIN_CARET = { label: '▾', join: 'end', name: 'Metronome settings', width: 32 } as const satisfies P;
export const joinRows = [
  [{ on: false }, JOIN_CARET],
  [{ on: true }, JOIN_CARET],
] as const satisfies [P, P][];

export const lampButtonStories = defineFixtures<LampButtonModelProps>()({
  Board: { args: { label: 'Accomp', code: 'ACMP', on: true, tip: 'transport.acmp' } },
  On: { args: { label: 'Accomp', code: 'ACMP', on: true } },
  Toggles: { args: { label: 'Unison' } },
  Disabled: { args: { label: 'Off', size: 'sm', width: 64, disabled: true, name: 'Manual Bass, works with Upper on' } },
  Off: { args: { label: 'Metronome' } },
  HueOn: { args: { label: 'On', size: 'cell', on: true, hue: 1, name: 'Channel 1 on' } },
  HueOn2: { args: { label: 'On', size: 'cell', on: true, hue: 2, name: 'Channel 2 on' } },
  HueOff: { args: { label: 'Off', size: 'cell', hue: 3, name: 'Channel 3 off' } },
  HueOn4: { args: { label: 'On', size: 'cell', on: true, hue: 4, name: 'Channel 4 on' } },
  HueDisabled: { args: { label: 'On', size: 'cell', hue: 1, disabled: true, name: 'Channel 1 on (no sound loaded)' } },
  FunctionOff: { args: { label: 'Harm/Arp', size: 'cell' } },
  FunctionOn: { args: { label: 'Sound', size: 'cell', on: true } },
  Running: { args: { label: 'Start / Stop', on: true, hue: 'ok' } },
  Role2On: { args: { label: 'Metronome', on: true, hue: 'role-2' } },
  Role2Off: { args: { label: 'Metronome', hue: 'role-2' } },
  Role2Waiting: { args: { label: 'Auto Fill', size: 'cell', waiting: true, hue: 'role-2', name: 'Auto Fill, armed' } },
  Recording: { args: { label: 'Looper', size: 'cell', on: true, rec: true, name: 'Looper, recording' } },
  Looping: { args: { label: 'Looper', size: 'cell', on: true, hue: 'lamp', name: 'Looper, looping' } },
  ArmedLoop: { args: { label: 'Looper', size: 'cell', waiting: true, hue: 'lamp', name: 'Looper, loop armed' } },
  Armed: {
    args: { label: 'Looper', size: 'cell', waiting: true, rec: true, name: 'Looper, rec armed. Long press: loop rec', tip: 'looper.rec' },
  },
  ArmedPressed: { args: { label: 'Sync Start', on: true, armed: true, name: 'Sync Start, waiting for a chord' } },
  MinWidth: {
    args: { label: 'Off' },
    items: [
      { label: 'Off', size: 'sm', width: 64 },
      { label: 'Manual Bass', size: 'sm', width: 64 },
    ],
  },
  JoinStart: { args: { label: 'Metronome', join: 'start' }, items: joinRows.flat() },
  AllFaces: {
    args: { label: 'On' },
    items: LAMP_FACES.flatMap((face) => [...LAMP_HUES, 'rec' as const].map((hue) => faceCell(face, hue))),
  },
});
