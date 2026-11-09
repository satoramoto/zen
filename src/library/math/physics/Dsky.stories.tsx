import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { ApolloDescentSimulator } from './ApolloDescentSimulator';
import { key, press } from './stories/play';

/** The DSKY during the descent, in the descent simulator: what the crew read and keyed. */
const meta = {
  title: 'Math/Physics/DSKY',
  component: ApolloDescentSimulator,
  decorators: [withLibraryTheme],
  parameters: { spec: { capability: 'physics-dsky', purpose: 'The display and keyboard the crew read and keyed during descent.', requirement: 'The DSKY shows what the crew saw', shall: 'The DSKY SHALL show the current program, verb and noun, and the three five-digit registers with the values the descent programs display for that noun, in the units and scaling Luminary 099 defines, with its status and caution lamps.' } },
  args: { load: 'none' },
} satisfies Meta<typeof ApolloDescentSimulator>;
export default meta;
type Story = StoryObj<typeof meta>;

async function raise1202(el: HTMLElement) {
  await key(el, 'PRO');
  await press(el, 'Advance 10 s', 6);
  await key(el, 'VERB 1 6 NOUN 6 8 ENTR');
  await press(el, 'Advance 10 s', 2);
}

export const BrakingDisplaysItsNoun = scenario(
  {
    name: 'Braking displays its noun',
    when: 'P63 is running and displaying its monitor noun',
    then: 'the PROG, VERB and NOUN windows show those numbers and the registers show the noun’s quantities in the source’s units',
    requirement: 'The DSKY shows what the crew saw',
    shall: 'The DSKY SHALL show the current program, verb and noun, and the three five-digit registers with the values the descent programs display for that noun, in the units and scaling Luminary 099 defines, with its status and caution lamps.',
    act: async ({ canvasElement }) => {
      await key(canvasElement, 'PRO');
      await press(canvasElement, 'Advance 10 s', 3);
    },
    check: async ({ canvasElement }) => {
      const c = within(canvasElement);
      expect(c.getByLabelText('Program 63')).toBeInTheDocument();
      expect(c.getByLabelText('Verb 06')).toBeInTheDocument();
      expect(c.getByLabelText('Noun 63')).toBeInTheDocument();
      // N63: speed and altitude rate in ft/s (VEL3), altitude in ft (COMP ALT).
      expect(c.getByLabelText(/^R1, Speed: [\d.]+ ft\/s$/)).toHaveTextContent(/^\+\d{5}$/);
      expect(c.getByLabelText(/^R2, Altitude rate: -?[\d.]+ ft\/s$/)).toHaveTextContent(/^[+−]\d{5}$/);
      expect(c.getByLabelText(/^R3, Altitude: \d+ ft$/)).toHaveTextContent(/^\+\d{5}$/);
    },
  },
  {},
) as Story;

export const AProgramAlarmLightsTheLamp = scenario(
  {
    name: 'A program alarm lights the lamp',
    when: 'a 1202 is raised',
    then: 'the PROG lamp lights and the alarm code can be displayed',
    requirement: 'The DSKY shows what the crew saw',
    shall: 'The DSKY SHALL show the current program, verb and noun, and the three five-digit registers with the values the descent programs display for that noun, in the units and scaling Luminary 099 defines, with its status and caution lamps.',
    act: async ({ canvasElement }) => {
      await raise1202(canvasElement);
    },
    check: async ({ canvasElement }) => {
      expect(within(canvasElement).getByLabelText('PROG lamp lit')).toBeInTheDocument();
      await key(canvasElement, 'VERB 0 5 NOUN 0 9 ENTR');
      await waitFor(() => expect(within(canvasElement).getByLabelText('R1, Alarm code first')).toHaveTextContent('+01202'));
    },
  },
  { args: { load: 'radar' } },
) as Story;

export const KeyRelAfterAnAlarm = scenario(
  {
    name: 'KEY REL after an alarm',
    given: 'a 1202 has been raised and the crew has called up its code with V05N09',
    when: 'the crew presses KEY REL after a 1202',
    then: 'the alarm display gives way and the monitor noun returns',
    requirement: 'The crew’s keys work during descent',
    shall: 'The DSKY SHALL accept the keys that matter during descent: KEY REL to take back the display after an alarm, PRO to proceed, and verb and noun entry for the displays the source offers.',
    act: async ({ canvasElement }) => {
      await raise1202(canvasElement);
      await key(canvasElement, 'VERB 0 5 NOUN 0 9 ENTR');
      await key(canvasElement, 'KEY REL');
    },
    check: async ({ canvasElement }) => {
      const c = within(canvasElement);
      expect(c.getByLabelText('Verb 06')).toBeInTheDocument();
      expect(c.getByLabelText('Noun 63')).toBeInTheDocument();
      expect(c.queryByLabelText('R1, Alarm code first')).toBeNull();
    },
  },
  { args: { load: 'radar' } },
) as Story;
