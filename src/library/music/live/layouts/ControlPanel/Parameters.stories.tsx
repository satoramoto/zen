import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../../storybook';
import { fixtureStories, withRenderer } from '../../../../foundation/stories/story';
import { host, withHost } from '../../host.story';
import { ControlPanel } from './ControlPanel';
import ControlPanelSvelte from './ControlPanel.svelte';
import { Building } from './Building.story';
import { dragUp } from './drag.story';
import { controlPanelArgTypes, controlPanelStories as s, controlParams, controlValues } from './ControlPanel.fixtures';
import { CONTROL_ROLES, type ControlPanelProps } from './ControlPanel.model';

// The app's parameters, as a control meets them: the catalogue the app lists, the value it gives,
// the move a control asks for, and touch, which brackets a continuous gesture so an app can make
// one undo step of a drag or write automation while a hand is on the control. Drawn with the
// control panel, the first pane to carry them; both renderers (the toolbar's Renderer), with
// `withHost` standing in for the app.

const meta = {
  id: 'music-live-parameters',
  title: 'Music/Live/Layouts/Parameters',
  component: ControlPanel,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 960, h: 360 },
    spec: {
      capability: 'live-parameters',
      purpose: 'The app’s parameters as a control meets them: the catalogue the app lists, values as readings, moves and triggers as asks, and touch around a continuous gesture.',
      requirement: 'The app lists its parameters',
      shall: 'The app SHALL give its parameters as plain data, each with an id, a label, an optional group, a range with its unit, and whether it moves along a range, switches or fires, and each parameter’s value now; a control SHALL be offered only the parameters of the kind it can move.',
    },
  },
  args: s.Default.args,
  argTypes: controlPanelArgTypes,
} satisfies Meta<typeof ControlPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ControlPanel, ControlPanelSvelte);

/** The app applying each move to its values. */
const app = host<ControlPanelProps>({ apply: { onParam: (props, move: { param: string; value: number }) => ({ values: { ...props.values, [move.param]: move.value } }) } });

const spied = (fixture: Parameters<typeof story>[0], parameters: object = {}): Story => {
  const st = story(fixture);
  return { ...st, args: { ...fixture.args, onParam: fn(), onTrigger: fn(), onTouch: fn() }, parameters: { ...st.parameters, ...parameters } };
};

type Spy = ReturnType<typeof fn>;
const touches = (args: { onTouch?: unknown }): { param: string; down: boolean }[] => ((args.onTouch as Spy).mock.calls as [{ param: string; down: boolean }][]).map(([t]) => t);
/** The order each call of a spy was made in, among every spy's calls. */
const order = (spy: unknown): number[] => (spy as Spy).mock.invocationCallOrder;

export const TheCatalogueIsPlainData: Story = scenario(
  {
    name: 'The catalogue is plain data',
    when: 'an app’s parameter catalogue and its values are written as JSON and read back',
    then: 'they are the same catalogue and values, each parameter with an id, a label, a range and one of the three ways of moving',
    check: async () => {
      await expect(JSON.parse(JSON.stringify(controlParams))).toEqual(controlParams);
      await expect(JSON.parse(JSON.stringify(controlValues))).toEqual(controlValues);
      for (const p of controlParams) {
        await expect(p.id && p.label).toBeTruthy();
        await expect(p.param.max).toBeGreaterThan(p.param.min);
        await expect(CONTROL_ROLES).toContain(p.role);
      }
    },
  },
  spied(s.Default),
) as Story;

// Stories tagged browser below open popovers and dialogs: they play in a real browser, not on zen-stories' virtual DOM.
export const APadIsOfferedOnlyWhatItCanFire: Story = { ...scenario(
  {
    name: 'A pad is offered only what it can fire',
    when: 'a person opens a pad’s sheet while building',
    then: 'its parameter list offers the parameters that fire, and none that move along a range or switch',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(await canvas.findByRole('button', { name: 'DROP control' }));
      await userEvent.click(canvas.getByRole('combobox', { name: 'DROP parameter' }));
    },
    check: async ({ canvasElement }) => {
      const offered = within(canvasElement).getAllByRole('option').map((o) => o.textContent ?? '');
      const fires = controlParams.filter((p) => p.role === 'trigger').map((p) => p.label);
      for (const label of fires) await expect(offered.some((o) => o.includes(label))).toBe(true);
      for (const p of controlParams.filter((p) => p.role !== 'trigger')) await expect(offered.some((o) => o.includes(p.label))).toBe(false);
    },
  },
  { parameters: { frame: { w: 1280, h: 800 } }, render: () => <Building /> },
), tags: ['browser'] } as Story;

export const AFaderDrag: Story = scenario(
  {
    requirement: 'A control asks; the app moves the value',
    shall: 'Moving a continuous control or a switch SHALL send one parameter intent with the parameter and the requested value; pressing and releasing a button or a pad SHALL send a trigger intent on the press and another on the release; and a control SHALL show a new value only when the app gives it.',
    name: 'A fader drag',
    when: 'a person drags a fader up',
    then: 'each step sends a parameter intent with the fader’s parameter and a value in its range, and the fader reads back what the app gives',
    act: async ({ canvasElement }) => {
      await dragUp(within(canvasElement).getByRole('slider', { name: 'Delay send' }));
    },
    check: async ({ canvasElement, args }) => {
      const calls = (args.onParam as ReturnType<typeof fn>).mock.calls as [{ param: string; value: number }][];
      await expect(calls.length).toBeGreaterThan(0);
      for (const [move] of calls) {
        await expect(move.param).toBe('delay');
        await expect(move.value).toBeGreaterThanOrEqual(0);
        await expect(move.value).toBeLessThanOrEqual(100);
      }
      const last = calls.at(-1)![0].value;
      await expect(last).toBeGreaterThan(35);
      await waitFor(() => expect(Number(within(canvasElement).getByRole('slider', { name: 'Delay send' }).getAttribute('aria-valuenow'))).toBeCloseTo(last, 2));
    },
  },
  spied(s.Default, app),
) as Story;

export const APadPressAndRelease: Story = scenario(
  {
    requirement: 'A control asks; the app moves the value',
    shall: 'Moving a continuous control or a switch SHALL send one parameter intent with the parameter and the requested value; pressing and releasing a button or a pad SHALL send a trigger intent on the press and another on the release; and a control SHALL show a new value only when the app gives it.',
    name: 'A pad press and release',
    when: 'a person presses a pad and lets go',
    then: 'one trigger intent with down is sent on the press and one with up on the release',
    act: async ({ canvasElement }) => {
      const pad = within(canvasElement.querySelector<HTMLElement>('[data-cell="c6"]')!).getByRole('button');
      await fireEvent.pointerDown(pad, { pointerId: 6, button: 0 });
      await fireEvent.pointerUp(pad, { pointerId: 6, button: 0 });
    },
    check: async ({ args }) => {
      await expect((args.onTrigger as ReturnType<typeof fn>).mock.calls).toEqual([[{ param: 'drop', down: true }], [{ param: 'drop', down: false }]]);
    },
  },
  spied(s.Default),
) as Story;

export const AMoveTheAppIgnores: Story = scenario(
  {
    requirement: 'A control asks; the app moves the value',
    shall: 'Moving a continuous control or a switch SHALL send one parameter intent with the parameter and the requested value; pressing and releasing a button or a pad SHALL send a trigger intent on the press and another on the release; and a control SHALL show a new value only when the app gives it.',
    name: 'A move the app ignores',
    when: 'a person moves a fader and the app gives no new value',
    then: 'the fader returns to the app’s value once the gesture ends',
    act: async ({ canvasElement }) => {
      await dragUp(within(canvasElement).getByRole('slider', { name: 'Reverb send' }));
    },
    check: async ({ canvasElement, args }) => {
      await expect((args.onParam as ReturnType<typeof fn>).mock.calls.length).toBeGreaterThan(0);
      await waitFor(() => expect(Number(within(canvasElement).getByRole('slider', { name: 'Reverb send' }).getAttribute('aria-valuenow'))).toBeCloseTo(20, 1));
    },
  },
  spied(s.Default),
) as Story;

export const AFaderDragIsOneTouch: Story = scenario(
  {
    requirement: 'A continuous gesture says when it begins and ends',
    shall: 'A continuous control (a fader, a knob, an XY for both its parameters) SHALL tell the app when a gesture on its parameter begins and when it ends, with every move of that gesture between the two; a key that steps the value SHALL be a whole gesture; a control taken away mid-gesture SHALL still end it; and a switch, a button and a pad SHALL send no touch.',
    name: 'A fader drag is one touch',
    when: 'a person drags a fader up and lets go',
    then: 'one touch down is sent for the fader’s parameter before its first move and one touch up after its last',
    act: async ({ canvasElement }) => {
      await dragUp(within(canvasElement).getByRole('slider', { name: 'Delay send' }));
    },
    check: async ({ args }) => {
      await waitFor(() => expect(touches(args)).toEqual([{ param: 'delay', down: true }, { param: 'delay', down: false }]));
      const [down, up] = order(args.onTouch);
      const moves = order(args.onParam);
      await expect(moves.length).toBeGreaterThan(0);
      await expect(down).toBeLessThan(Math.min(...moves));
      await expect(up).toBeGreaterThan(Math.max(...moves));
    },
  },
  spied(s.Default, app),
) as Story;

export const AKeyStepIsAWholeTouch: Story = scenario(
  {
    requirement: 'A continuous gesture says when it begins and ends',
    shall: 'A continuous control (a fader, a knob, an XY for both its parameters) SHALL tell the app when a gesture on its parameter begins and when it ends, with every move of that gesture between the two; a key that steps the value SHALL be a whole gesture; a control taken away mid-gesture SHALL still end it; and a switch, a button and a pad SHALL send no touch.',
    name: 'A key step is a whole touch',
    when: 'a person focuses a fader and presses the up arrow once',
    then: 'a touch down, the move and a touch up are sent, in that order',
    act: async ({ canvasElement }) => {
      within(canvasElement).getByRole('slider', { name: 'Delay send' }).focus();
      await userEvent.keyboard('{ArrowUp}');
    },
    check: async ({ args }) => {
      await waitFor(() => expect(touches(args)).toEqual([{ param: 'delay', down: true }, { param: 'delay', down: false }]));
      const [down, up] = order(args.onTouch);
      const moves = order(args.onParam);
      await expect(moves).toHaveLength(1);
      await expect(down).toBeLessThan(moves[0]);
      await expect(up).toBeGreaterThan(moves[0]);
    },
  },
  spied(s.Default, app),
) as Story;

export const AnXyTouchesBothItsParameters: Story = scenario(
  {
    requirement: 'A continuous gesture says when it begins and ends',
    shall: 'A continuous control (a fader, a knob, an XY for both its parameters) SHALL tell the app when a gesture on its parameter begins and when it ends, with every move of that gesture between the two; a key that steps the value SHALL be a whole gesture; a control taken away mid-gesture SHALL still end it; and a switch, a button and a pad SHALL send no touch.',
    name: 'An XY touches both its parameters',
    when: 'a person presses an XY bound to the delay’s time and feedback, and lets go',
    then: 'a touch down is sent for each of the two parameters on the press and a touch up for each on the release',
    act: async ({ canvasElement }) => {
      const cell = canvasElement.querySelector<HTMLElement>('[data-cell="c10"]')!;
      const r = cell.getBoundingClientRect();
      const at = { pointerId: 8, button: 0, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
      const pad = cell.querySelector<HTMLElement>('[role="slider"], [data-part="pad"], button') ?? cell;
      await fireEvent.pointerDown(pad, at);
      await fireEvent.pointerUp(pad, at);
    },
    check: async ({ args }) => {
      await waitFor(() => expect(touches(args)).toHaveLength(4));
      await expect(touches(args)).toEqual([
        { param: 'time', down: true },
        { param: 'feedback', down: true },
        { param: 'time', down: false },
        { param: 'feedback', down: false },
      ]);
    },
  },
  spied(s.Default, app),
) as Story;

export const APadIsATriggerNotATouch: Story = scenario(
  {
    requirement: 'A continuous gesture says when it begins and ends',
    shall: 'A continuous control (a fader, a knob, an XY for both its parameters) SHALL tell the app when a gesture on its parameter begins and when it ends, with every move of that gesture between the two; a key that steps the value SHALL be a whole gesture; a control taken away mid-gesture SHALL still end it; and a switch, a button and a pad SHALL send no touch.',
    name: 'A pad is a trigger, not a touch',
    when: 'a person presses a pad and lets go, then flips a toggle',
    then: 'the pad’s trigger down and up and the toggle’s move are sent, and no touch',
    act: async ({ canvasElement }) => {
      const pad = within(canvasElement.querySelector<HTMLElement>('[data-cell="c6"]')!).getByRole('button');
      await fireEvent.pointerDown(pad, { pointerId: 6, button: 0 });
      await fireEvent.pointerUp(pad, { pointerId: 6, button: 0 });
      await userEvent.click(within(canvasElement.querySelector<HTMLElement>('[data-cell="c9"]')!).getByRole('button'));
    },
    check: async ({ args }) => {
      await expect((args.onTrigger as Spy).mock.calls).toEqual([[{ param: 'drop', down: true }], [{ param: 'drop', down: false }]]);
      await expect(((args.onParam as Spy).mock.calls as [{ param: string }][]).map(([m]) => m.param)).toEqual(['freeze']);
      await expect(touches(args)).toEqual([]);
    },
  },
  spied(s.Default, app),
) as Story;

export const AControlTakenAwayMidDrag: Story = scenario(
  {
    requirement: 'A continuous gesture says when it begins and ends',
    shall: 'A continuous control (a fader, a knob, an XY for both its parameters) SHALL tell the app when a gesture on its parameter begins and when it ends, with every move of that gesture between the two; a key that steps the value SHALL be a whole gesture; a control taken away mid-gesture SHALL still end it; and a switch, a button and a pad SHALL send no touch.',
    name: 'A control taken away mid-drag',
    when: 'a fader is pressed and its pane is removed before the finger lifts',
    then: 'the touch down is followed by a touch up for the same parameter, so no touch is left down',
    act: async ({ canvasElement }) => {
      const fader = within(canvasElement).getByRole('slider', { name: 'Delay send' });
      const r = fader.getBoundingClientRect();
      await fireEvent.pointerDown(fader, { pointerId: 9, button: 0, clientX: r.left + r.width / 2, clientY: r.top + r.height * 0.7 });
      await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('button', { name: 'Remove pane' }));
    },
    check: async ({ args }) => {
      await waitFor(() => expect(touches(args)).toEqual([{ param: 'delay', down: true }, { param: 'delay', down: false }]));
    },
  },
  spied(s.Default, { ...app, host: { ...app.host, removable: true } }),
) as Story;
