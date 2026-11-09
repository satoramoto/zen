import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Workspace } from '../../../layout/Workspace/Workspace';
import { useSurfaceHost } from '../../../layout/Workspace/host.story';
import type { SurfaceDocument } from '../../../layout/Workspace/Workspace.types';
import { LIVE_PANES } from '../panes';
import { host, withHost } from '../host.story';
import { ControlPanel, type ControlCell } from './ControlPanel';
import ControlPanelSvelte from './ControlPanel.svelte';
import { controlPanelArgTypes, controlPanelStories as s, controlParams, controlValues, macroCells } from './ControlPanel.fixtures';
import type { ControlPanelProps } from './ControlPanel.model';

// The person's own controls on the app's parameters. The playing stories run in both renderers
// (the toolbar's Renderer) with `withHost` standing in for the app: it applies `onParam` to the
// values, as an app would. The building stories put the panel in a Workspace that is editing, with
// a story host that applies every intent, since building follows the surface's edit mode.

const meta = {
  id: 'music-live-control-panel',
  title: 'Music/Live/Control panel',
  component: ControlPanel,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 960, h: 360 },
    spec: {
      capability: 'live-control-panels',
      purpose: 'The control panel pane: a grid of the person’s own controls bound to the app’s parameters, values in and moves out, built in place while the surface edits.',
      requirement: 'A control panel draws the app’s parameters',
      shall: 'A control panel SHALL draw a grid of cells, each holding one control (a fader, a knob, a toggle, a button, a pad or an XY) bound to one of the app’s parameters (an XY to two), showing the parameter’s label and the value the app gives for it, in the parameter’s range and unit.',
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
  return { ...st, args: { ...fixture.args, onParam: fn(), onTrigger: fn() }, parameters: { ...st.parameters, ...parameters } };
};

export const AFaderShowsTheAppsValue: Story = scenario(
  {
    name: 'A fader shows the app’s value',
    when: 'the app lists a filter cutoff from 20 Hz to 20 kHz and gives its value as 1.2 kHz',
    then: 'the fader bound to it stands at 1.2 kHz and reads `1.20 kHz` under its label',
    check: async ({ canvasElement }) => {
      const cell = canvasElement.querySelector<HTMLElement>('[data-cell="c1"]')!;
      await expect(within(cell).getByRole('slider', { name: 'Filter' })).toBeTruthy();
      await expect(cell.textContent).toMatch(/1\.20\s*kHz/);
    },
  },
  spied(s.Default),
) as Story;

export const AControlWithNoParameterYet: Story = scenario(
  {
    name: 'A control with no parameter yet',
    when: 'a cell holds a knob not yet bound to a parameter',
    then: 'the knob is drawn dimmed, says it has no parameter, and moves nothing',
    check: async ({ canvasElement }) => {
      await expect(within(canvasElement).getByRole('note', { name: 'Knob: no parameter' })).toBeTruthy();
      await expect(within(canvasElement.querySelector<HTMLElement>('[data-cell="k"]')!).queryByRole('slider')).toBeNull();
    },
  },
  spied(s.Unbound),
) as Story;

export const AParameterTheAppNoLongerLists: Story = scenario(
  {
    name: 'A parameter the app no longer lists',
    when: 'a control is bound to a parameter id the app’s catalogue no longer has',
    then: 'the control says its parameter is missing and moves nothing, and the rest of the panel plays',
    check: async ({ canvasElement }) => {
      await expect(within(canvasElement).getByRole('note', { name: 'Fader: parameter missing' })).toBeTruthy();
      await expect(within(canvasElement).getByRole('slider', { name: 'Delay send' })).toBeTruthy();
    },
  },
  spied(s.Missing),
) as Story;

/** A drag on a fader's track, upward. */
async function dragUp(el: HTMLElement, by = 60) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height * 0.7;
  await fireEvent.pointerDown(el, { pointerId: 5, button: 0, clientX: x, clientY: y });
  for (let i = 1; i <= 4; i++) await fireEvent.pointerMove(el, { pointerId: 5, clientX: x, clientY: y - (by * i) / 4 });
  await fireEvent.pointerUp(el, { pointerId: 5, clientX: x, clientY: y - by });
}

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

/** The panel inside an editing surface, its cells and grid in the region's settings, every intent applied. */
function Building({ cells = macroCells, columns = 8, rows = 4, editing = true }: { cells?: readonly ControlCell[]; columns?: number; rows?: number; editing?: boolean }) {
  const doc: SurfaceDocument = {
    version: 2,
    active: 't',
    tabs: [{ id: 't', title: 'Macros', layout: 'panel', regions: [{ id: 'panel', kind: 'controls', title: 'Controls', binding: { mode: 'selected' }, settings: { cells: cells as never, columns, rows } }] }],
  };
  const surface = useSurfaceHost(doc, { keepEditing: true, editing });
  const region = (surface.document.tabs[0] as (typeof doc.tabs)[0] & { regions: { settings?: Record<string, unknown> }[] }).regions[0];
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <output aria-label="Story: cells">{JSON.stringify(region.settings?.cells ?? [])}</output>
      <Workspace
        name="Macros"
        document={surface.document}
        panes={[LIVE_PANES.controls]}
        editing={surface.editing}
        onIntent={surface.onIntent}
        pane={(r, _t, settings) => (
          <ControlPanel
            cells={settings.cells as unknown as readonly ControlCell[]}
            columns={settings.columns as number}
            rows={settings.rows as number}
            params={controlParams}
            values={controlValues}
            onParam={fn()}
            onTrigger={fn()}
            onCells={(next) => surface.onIntent({ type: 'configureRegion', tab: 't', region: r.id, settings: { ...(r.settings ?? {}), cells: next as never } })}
          />
        )}
      />
    </div>
  );
}
const cellsOf = (el: HTMLElement): ControlCell[] => JSON.parse(within(el).getByLabelText('Story: cells').textContent || '[]');

export const AddingAKnob: Story = scenario(
  {
    requirement: 'Controls are built in place',
    shall: 'While the surface is editing and the tab is unlocked, a control panel SHALL show its grid, let a person add a control to an empty cell, move and resize a control on the grid (by pointer, or arrows and Shift+arrows), and set a control’s kind, parameter and label or remove it, sending the panel’s whole next cells as one change each time and never overlapping two controls.',
    name: 'Adding a knob',
    when: 'a person picks a knob for an empty cell',
    then: 'one change is sent with a knob in that cell, and once applied the knob is there, waiting for a parameter',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'add a control at column 1, row 4' }));
      await userEvent.click(canvas.getByRole('button', { name: 'add a knob here' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(cellsOf(canvasElement).at(-1)).toMatchObject({ control: 'knob', x: 0, y: 3, w: 1, h: 1 }));
      await expect(within(canvasElement).getByRole('note', { name: 'Knob: no parameter' })).toBeTruthy();
    },
  },
  { render: () => <Building /> },
) as Story;

export const BindingAParameter: Story = scenario(
  {
    requirement: 'Controls are built in place',
    shall: 'While the surface is editing and the tab is unlocked, a control panel SHALL show its grid, let a person add a control to an empty cell, move and resize a control on the grid (by pointer, or arrows and Shift+arrows), and set a control’s kind, parameter and label or remove it, sending the panel’s whole next cells as one change each time and never overlapping two controls.',
    name: 'Binding a parameter',
    when: 'a person opens a fader’s sheet and picks the feedback',
    then: 'one change is sent with the fader bound to it, and the sheet offers only continuous parameters',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Drive control' }));
      await userEvent.click(canvas.getByRole('combobox', { name: 'Drive parameter' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const options = canvas.getAllByRole('option').map((o) => o.textContent);
      await expect(options).not.toContain('Cuts · DROP');
      await expect(options).not.toContain('FX · Freeze');
      await userEvent.click(canvas.getByRole('option', { name: 'FX · Feedback' }));
      await waitFor(() => expect(cellsOf(canvasElement).find((c) => c.id === 'c4')).toMatchObject({ param: 'feedback' }));
    },
  },
  { render: () => <Building /> },
) as Story;

export const MovingOntoAnotherControl: Story = scenario(
  {
    requirement: 'Controls are built in place',
    shall: 'While the surface is editing and the tab is unlocked, a control panel SHALL show its grid, let a person add a control to an empty cell, move and resize a control on the grid (by pointer, or arrows and Shift+arrows), and set a control’s kind, parameter and label or remove it, sending the panel’s whole next cells as one change each time and never overlapping two controls.',
    name: 'Moving onto another control',
    when: 'a person moves a control toward a cell another control holds',
    then: 'the control stops at the last free cell on its way and the two never overlap',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      // Add a knob in the free row, then send it right along the row and up into the faders.
      await userEvent.click(canvas.getByRole('button', { name: 'add a control at column 1, row 4' }));
      await userEvent.click(canvas.getByRole('button', { name: 'add a knob here' }));
      const tag = await canvas.findByRole('button', { name: 'Knob control' });
      tag.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowUp}');
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(cellsOf(canvasElement).find((c) => c.control === 'knob')).toMatchObject({ x: 2, y: 3 }));
      const cells = cellsOf(canvasElement);
      for (const a of cells)
        for (const b of cells)
          if (a !== b) await expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
    },
  },
  { render: () => <Building /> },
) as Story;

export const PlayedNotBuilt: Story = scenario(
  {
    requirement: 'Controls are built in place',
    shall: 'While the surface is editing and the tab is unlocked, a control panel SHALL show its grid, let a person add a control to an empty cell, move and resize a control on the grid (by pointer, or arrows and Shift+arrows), and set a control’s kind, parameter and label or remove it, sending the panel’s whole next cells as one change each time and never overlapping two controls.',
    name: 'Played, not built',
    when: 'the surface is not editing, or the tab is locked',
    then: 'the panel shows no grid, no empty cells and no sheets, and every control plays',
    check: async ({ canvasElement }) => {
      await expect(canvasElement.querySelectorAll('[data-part="empty"], [data-part="tag"], [data-part="sheet"]')).toHaveLength(0);
      await expect(within(canvasElement).getAllByRole('slider').length).toBeGreaterThanOrEqual(4);
    },
  },
  { render: () => <Building editing={false} /> },
) as Story;

export const AWiderGrid: Story = scenario(
  {
    requirement: 'The panel’s grid is a setting',
    shall: 'A control panel’s columns and rows SHALL be settings in its settings sheet, and its cells SHALL be a plain-data setting it edits itself.',
    name: 'A wider grid',
    when: 'a person sets the panel to twelve columns',
    then: 'the cells keep their places and the new columns are empty',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Controls tools' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Controls settings' }));
      const columns = within(canvas.getByRole('group', { name: 'Controls settings' })).getByRole('slider', { name: 'Columns' });
      columns.focus();
      await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(canvasElement.querySelectorAll('[data-part="empty"][data-at$=",0"]').length).toBe(4));
      await expect(cellsOf(canvasElement)).toEqual(macroCells);
    },
  },
  { render: () => <Building /> },
) as Story;

export const ASmallerGrid: Story = scenario(
  {
    requirement: 'The panel’s grid is a setting',
    shall: 'A control panel’s columns and rows SHALL be settings in its settings sheet, and its cells SHALL be a plain-data setting it edits itself.',
    name: 'A smaller grid',
    when: 'a person sets fewer columns than a control reaches',
    then: 'that control is drawn clipped to the grid and marked, and nothing is removed',
    check: async ({ canvasElement }) => {
      await expect(canvasElement.querySelector('[data-cell="c10"]')).toHaveAttribute('data-clipped', 'true');
      await expect(canvasElement.querySelectorAll('[data-cell]')).toHaveLength(macroCells.length);
    },
  },
  spied(s.Clipped),
) as Story;
