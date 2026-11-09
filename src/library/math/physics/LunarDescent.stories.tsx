import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { ApolloDescentSimulator } from './ApolloDescentSimulator';
import { DescentSources } from './DescentSources';
import { flightLog, key, press, readout, recall, remember, status } from './stories/play';

/**
 * Apollo 11’s powered descent, guided as Luminary 099 guided it. Press PRO on the DSKY to light the
 * engine; fly, or jump to high gate, low gate or touchdown; take over with the rate switch.
 */
const meta = {
  title: 'Math/Physics/Lunar Descent',
  component: ApolloDescentSimulator,
  decorators: [withLibraryTheme],
  parameters: {
    spec: {
      capability: 'physics-lunar-descent',
      purpose: 'The Lunar Module’s powered descent from the start of braking to touchdown, as Luminary 099 guided it, including its program switches and the 1202 overload.',
      requirement: 'The descent is guided as Luminary 099 guided it',
    shall: 'The simulator SHALL steer the Lunar Module from the start of braking to touchdown with the descent guidance equations of Luminary 099, and every constant and target it uses SHALL either cite the source file and line it comes from or be listed in `SOURCES.md` as an approximation with its reason.',
    },
  },
  args: { load: 'none' },
} satisfies Meta<typeof ApolloDescentSimulator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ANominalDescentLands: Story = scenario(
  {
    name: 'A nominal descent lands',
    when: 'the descent runs from the start of braking with no crew input',
    then: 'the Lunar Module touches down upright, within the landing velocity limits the source sets, with propellant left',
    requirement: 'The descent is guided as Luminary 099 guided it',
    shall: 'The simulator SHALL steer the Lunar Module from the start of braking to touchdown with the descent guidance equations of Luminary 099, and every constant and target it uses SHALL either cite the source file and line it comes from or be listed in `SOURCES.md` as an approximation with its reason.',
    act: async ({ canvasElement }) => {
      await press(canvasElement, 'Fly to touchdown');
    },
    check: async ({ canvasElement }) => {
      await status(canvasElement, 'Landed');
      const touchdown = flightLog(canvasElement).find((e) => e.kind === 'touchdown')!;
      const [, down, across, left] = touchdown.text.match(/at ([\d.]+) ft\/s down, ([\d.]+) ft\/s across, (\d+) kg/)!;
      expect(Number(down)).toBeLessThanOrEqual(10);
      expect(Number(across)).toBeLessThanOrEqual(4);
      expect(Number(left)).toBeGreaterThan(0);
    },
  },
  {},
);

export const EveryNumberHasASource: Story = scenario(
  {
    name: 'Every number has a source',
    when: 'a reader opens `SOURCES.md`',
    then: 'each guidance constant and target is listed with the Luminary 099 file and line it comes from, or marked as an approximation with its reason',
    requirement: 'The descent is guided as Luminary 099 guided it',
    shall: 'The simulator SHALL steer the Lunar Module from the start of braking to touchdown with the descent guidance equations of Luminary 099, and every constant and target it uses SHALL either cite the source file and line it comes from or be listed in `SOURCES.md` as an approximation with its reason.',
    check: async ({ canvasElement }) => {
      const rows = [...canvasElement.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      expect(rows.length).toBeGreaterThan(20);
      for (const row of rows) {
        const [, , cite, approximation] = [...row.cells].map((c) => c.textContent ?? '');
        expect(/\.agc:\d+$/.test(cite) || approximation.length > 10).toBe(true);
      }
      expect(within(canvasElement).getByRole('rowheader', { name: 'RBRFG (downrange)' }).closest('tr')).toHaveAttribute('data-source', 'approximation');
    },
  },
  { render: () => <DescentSources /> },
);

export const BrakingGivesWayToApproach: Story = scenario(
  {
    name: 'Braking gives way to approach',
    when: 'the braking phase meets the source’s criterion for high gate',
    then: 'the program becomes P64 and the Lunar Module pitches over so the landing site comes into view',
    requirement: 'The programs switch as they did',
    shall: 'The descent SHALL run P63 (braking) until its switching criterion is met, then P64 (approach), and SHALL enter P66 (rate of descent) when the crew selects it, with the switching criteria taken from the source.',
    act: async ({ canvasElement }) => {
      await press(canvasElement, 'Fly to high gate');
      remember(canvasElement, 'pitch', readout(canvasElement, 'pitch'));
      await press(canvasElement, 'Advance 10 s', 3);
    },
    check: async ({ canvasElement }) => {
      const c = within(canvasElement);
      expect(c.getByLabelText('Program 64')).toBeInTheDocument();
      expect(readout(canvasElement, 'pitch')).toBeLessThan(recall(canvasElement, 'pitch') - 5);
      expect(flightLog(canvasElement).some((e) => e.text.includes('P64: approach'))).toBe(true);
    },
  },
  {},
);

export const TheCrewTakesOverTheRateOfDescent: Story = scenario(
  {
    name: 'The crew takes over the rate of descent',
    when: 'the crew selects P66 during approach',
    then: 'the program becomes P66 and each click of the rate switch changes the commanded descent rate by the step the source defines',
    requirement: 'The programs switch as they did',
    shall: 'The descent SHALL run P63 (braking) until its switching criterion is met, then P64 (approach), and SHALL enter P66 (rate of descent) when the crew selects it, with the switching criteria taken from the source.',
    act: async ({ canvasElement }) => {
      await press(canvasElement, 'Fly to low gate');
      await press(canvasElement, 'Rate switch up: slower descent');
      await press(canvasElement, 'Advance 10 s');
      remember(canvasElement, 'rate', readout(canvasElement, 'commanded-rate'));
      await press(canvasElement, 'Rate switch up: slower descent');
      await press(canvasElement, 'Advance 10 s');
    },
    check: async ({ canvasElement }) => {
      expect(within(canvasElement).getByLabelText('Program 66')).toBeInTheDocument();
      // RODSCALE: 1 ft/s a click.
      expect(readout(canvasElement, 'commanded-rate') - recall(canvasElement, 'rate')).toBeCloseTo(1, 2);
    },
  },
  {},
);

export const ExtraLoadRaisesA1202: Story = scenario(
  {
    name: 'Extra load raises a 1202',
    given: 'the rendezvous radar is stealing time, as its switch let it on Apollo 11',
    when: 'a load like the rendezvous radar’s is added during descent until the executive overflows',
    then: 'the DSKY shows a 1202 and the program alarm, and guidance continues after the restart',
    requirement: 'A 1202 comes from overload',
    shall: 'The simulator SHALL model the guidance computer’s executive: when more work is scheduled than it can run in a cycle, it SHALL raise a 1202 alarm and restart, shedding the lowest-priority work, while guidance carries on.',
    act: async ({ canvasElement }) => {
      await key(canvasElement, 'PRO');
      await press(canvasElement, 'Advance 10 s', 6);
      await key(canvasElement, 'VERB 1 6 NOUN 6 8 ENTR');
      await press(canvasElement, 'Advance 10 s', 2);
    },
    check: async ({ canvasElement }) => {
      const c = within(canvasElement);
      expect(c.getByLabelText('PROG lamp lit')).toBeInTheDocument();
      await key(canvasElement, 'VERB 0 5 NOUN 0 9 ENTR');
      await waitFor(() => expect(canvasElement.querySelector('[data-register="1"]')).toHaveTextContent('+01202'));
      await status(canvasElement, /P63: braking/);
      expect(flightLog(canvasElement).some((e) => e.kind === 'alarm' && e.text.includes('1202'))).toBe(true);
    },
  },
  { args: { load: 'radar' } },
);

export const TheDescentSurvivesTheAlarm: Story = scenario(
  {
    name: 'The descent survives the alarm',
    when: '1202 alarms occur during braking as they did on Apollo 11',
    then: 'the descent still lands, and the alarms are listed in the flight log with their mission time',
    requirement: 'A 1202 comes from overload',
    shall: 'The simulator SHALL model the guidance computer’s executive: when more work is scheduled than it can run in a cycle, it SHALL raise a 1202 alarm and restart, shedding the lowest-priority work, while guidance carries on.',
    act: async ({ canvasElement }) => {
      await press(canvasElement, 'Fly to touchdown');
    },
    check: async ({ canvasElement }) => {
      await status(canvasElement, 'Landed');
      const alarms = flightLog(canvasElement).filter((e) => e.kind === 'alarm');
      expect(alarms).toHaveLength(5);
      for (const a of alarms) expect(a.text).toMatch(/^102:\d\d:\d\d 120[12]: /);
    },
  },
  { args: { load: 'apollo-11' } },
);
