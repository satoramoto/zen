import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { Workspace } from './Workspace';
import { workspacePane } from './content.story';
import { useSurfaceHost } from './host.story';
import { workspaceDocument, workspacePanes } from './Workspace.fixtures';
import type { SurfaceDocument, SurfaceIntent } from './Workspace.types';

// Building a panel: a tab is a split tree with shares; edit mode resizes it by its handles, docks a
// region by dragging its tag, and Lock puts it beyond a stray touch. Each region draws the richest
// form its room fits. The hosted stories apply every intent as an app's store would; the spied ones
// read exactly what the surface sent. React only: the drags are pointer sequences a play dispatches,
// and the Workspace's own stories already play both renderers.

const meta = {
  title: 'Core/Layouts/Workspace/Building',
  component: Workspace,
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1440, h: 900 },
    spec: {
      capability: 'live-panel-layout',
      purpose: 'Building a panel to play: a tab as a split tree with shares, resized by its handles, docked by dragging, locked for the gig, each region in the form its room fits, by touch, mouse and keyboard.',
      requirement: 'A tab is a layout tree with shares',
      shall: 'A tab SHALL lay its regions out as a tree that splits into rows or columns to any depth, each child taking its share of its parent’s room, with region instances at the leaves.',
    },
  },
  args: { name: 'Panel', document: { version: 2, active: 't', tabs: [] } },
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;

const region = (id: string, kind: string, title: string) => ({ id, kind, title, binding: { mode: 'selected' as const } });

/** A row: the grid with two shares, then a column of the cuts over the stems with one. */
const TREE: SurfaceDocument = {
  version: 2,
  active: 't',
  tabs: [
    {
      id: 't',
      title: 'Panel',
      layout: { id: 't-row', split: 'row', children: [{ node: 'grid', share: 2 }, { node: { id: 't-col', split: 'column', children: [{ node: 'cuts', share: 1 }, { node: 'stems', share: 1 }] }, share: 1 }] },
      regions: [region('grid', 'loopGrid', 'Loop grid'), region('cuts', 'cuts', 'Transitions'), region('stems', 'stems', 'Stems')],
    },
  ],
};

/** Two regions side by side, equal shares. */
const PAIR: SurfaceDocument = {
  version: 2,
  active: 't',
  tabs: [{ id: 't', title: 'Pair', layout: { id: 't-row', split: 'row', children: [{ node: 'grid', share: 1 }, { node: 'cuts', share: 1 }] }, regions: [region('grid', 'loopGrid', 'Loop grid'), region('cuts', 'cuts', 'Transitions')] }],
};

const box = (el: Element) => el.getBoundingClientRect();
const leaf = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-leaf="${id}"]`)!;
const sent = (args: { onIntent?: unknown }): SurfaceIntent[] => ((args.onIntent as { mock: { calls: [SurfaceIntent][] } }).mock.calls ?? []).map(([i]) => i);
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A drag from `from` to `to`, as one pointer. */
async function drag(el: Element, from: { x: number; y: number }, to: { x: number; y: number }, release = true) {
  await fireEvent.pointerDown(el, { pointerId: 7, button: 0, clientX: from.x, clientY: from.y });
  for (let i = 1; i <= 4; i++) await fireEvent.pointerMove(el, { pointerId: 7, clientX: from.x + ((to.x - from.x) * i) / 4, clientY: from.y + ((to.y - from.y) * i) / 4 });
  if (release) await fireEvent.pointerUp(el, { pointerId: 7, clientX: to.x, clientY: to.y });
}
const centre = (el: Element) => ({ x: box(el).left + box(el).width / 2, y: box(el).top + box(el).height / 2 });

export const AColumnBesideARowOfTwo: Story = scenario(
  {
    name: 'A column beside a row of two',
    when: 'a tab’s layout is a row whose first child is a region and whose second is a column of two regions, with shares 2 and 1',
    then: 'the first region takes two thirds of the width and the two in the column stack in the last third',
    check: async ({ canvasElement }) => {
      const grid = box(leaf(canvasElement, 'grid'));
      const cuts = box(leaf(canvasElement, 'cuts'));
      const stems = box(leaf(canvasElement, 'stems'));
      await expect(grid.width / (grid.width + cuts.width)).toBeCloseTo(2 / 3, 1);
      await expect(Math.abs(cuts.left - stems.left)).toBeLessThan(1);
      await expect(stems.top).toBeGreaterThan(cuts.top);
    },
  },
  { render: () => <Workspace name="Panel" document={TREE} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

export const SharesNotPixels: Story = scenario(
  {
    name: 'Shares, not pixels',
    when: 'the same tab is drawn in a smaller window',
    then: 'every region keeps its share of the room',
    check: async ({ canvasElement }) => {
      const grid = box(leaf(canvasElement, 'grid'));
      const cuts = box(leaf(canvasElement, 'cuts'));
      await expect(grid.width / (grid.width + cuts.width)).toBeCloseTo(2 / 3, 1);
    },
  },
  { parameters: { frame: { w: 960, h: 600 } }, render: () => <Workspace name="Panel" document={TREE} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

export const DraggingAHandle: Story = scenario(
  {
    requirement: 'Regions are resized by their split handles',
    shall: 'In edit mode the surface SHALL put a handle between every two siblings of a split; dragging it or pressing the arrow keys on it SHALL change only those two shares, previewing as it moves and sending one resize intent when it ends, and SHALL never give a region less room than its smallest form.',
    name: 'Dragging a handle',
    when: 'a person drags the handle between two regions toward the second and lets go',
    then: 'the first grows and the second shrinks while dragging, and one resize intent with both new shares is sent on release',
    act: async ({ canvasElement }) => {
      const handle = canvasElement.querySelector('[data-part="handle"]')!;
      const before = box(leaf(canvasElement, 'grid')).width;
      const from = centre(handle);
      await drag(handle, from, { x: from.x + 160, y: from.y }, false);
      await waitFor(() => expect(box(leaf(canvasElement, 'grid')).width).toBeGreaterThan(before + 100));
      await fireEvent.pointerUp(handle, { pointerId: 7, clientX: from.x + 160, clientY: from.y });
    },
    check: async ({ args }) => {
      const intents = sent(args);
      await expect(intents).toHaveLength(1);
      const [resize] = intents as Extract<SurfaceIntent, { type: 'resizeSplit' }>[];
      await expect(resize).toMatchObject({ type: 'resizeSplit', tab: 't', split: 't-row' });
      await expect(resize.shares[0]).toBeGreaterThan(resize.shares[1]);
    },
  },
  { args: { onIntent: fn() }, render: (args) => <Workspace name="Panel" document={PAIR} panes={workspacePanes} editing onIntent={args.onIntent} pane={workspacePane} /> },
) as Story;

export const ResizingFromTheKeyboard: Story = scenario(
  {
    requirement: 'Regions are resized by their split handles',
    shall: 'In edit mode the surface SHALL put a handle between every two siblings of a split; dragging it or pressing the arrow keys on it SHALL change only those two shares, previewing as it moves and sending one resize intent when it ends, and SHALL never give a region less room than its smallest form.',
    name: 'Resizing from the keyboard',
    when: 'a person focuses a handle and presses the right arrow three times',
    then: 'each press sends one resize intent moving the shares one step',
    act: async ({ canvasElement }) => {
      canvasElement.querySelector<HTMLElement>('[data-part="handle"]')!.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    },
    check: async ({ args }) => {
      const intents = sent(args) as Extract<SurfaceIntent, { type: 'resizeSplit' }>[];
      await expect(intents.map((i) => i.type)).toEqual(['resizeSplit', 'resizeSplit', 'resizeSplit']);
      for (const i of intents) await expect(i.shares[0]).toBeGreaterThan(i.shares[1]);
    },
  },
  { args: { onIntent: fn() }, render: (args) => <Workspace name="Panel" document={PAIR} panes={workspacePanes} editing onIntent={args.onIntent} pane={workspacePane} /> },
) as Story;

export const TheSmallestFormIsAFloor: Story = scenario(
  {
    requirement: 'Regions are resized by their split handles',
    shall: 'In edit mode the surface SHALL put a handle between every two siblings of a split; dragging it or pressing the arrow keys on it SHALL change only those two shares, previewing as it moves and sending one resize intent when it ends, and SHALL never give a region less room than its smallest form.',
    name: 'The smallest form is a floor',
    when: 'a person drags a handle until the region beside it would be smaller than its smallest form',
    then: 'the handle stops where that form still fits',
    act: async ({ canvasElement }) => {
      const handle = canvasElement.querySelector('[data-part="handle"]')!;
      const from = centre(handle);
      await drag(handle, from, { x: from.x + 2000, y: from.y }, false);
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(leaf(canvasElement, 'cuts')).not.toHaveAttribute('data-cramped'));
      await expect(box(leaf(canvasElement, 'cuts')).width).toBeGreaterThan(100);
    },
  },
  { args: { onIntent: fn() }, render: (args) => <Workspace name="Panel" document={PAIR} panes={workspacePanes} editing onIntent={args.onIntent} pane={workspacePane} /> },
) as Story;

/** An app with a store: applies every intent, so a dock shows in the layout. */
function Docking({ document }: { document: SurfaceDocument }) {
  const host = useSurfaceHost(document, { keepEditing: true, editing: true });
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <output aria-label="Story: intents sent">{JSON.stringify(host.intents)}</output>
      <Workspace name="Panel" document={host.document} panes={workspacePanes} editing={host.editing} onIntent={host.onIntent} pane={workspacePane} />
    </div>
  );
}
const intentsOf = (el: HTMLElement): SurfaceIntent[] => JSON.parse(within(el).getByLabelText('Story: intents sent').textContent || '[]');
const grip = (el: HTMLElement, id: string) => leaf(el, id).querySelector<HTMLElement>('[data-part="grip"]')!;

export const DockingBelow: Story = scenario(
  {
    requirement: 'Regions are docked by dragging',
    shall: 'In edit mode a person SHALL be able to drag a region by its tag onto another region and drop it on one of five zones (left, right, above, below, swap), and the surface SHALL send one dock intent naming the region, the target and the zone; the step-wise move tools SHALL remain for the keyboard.',
    name: 'Docking below',
    when: 'a person drags the grid by its tag onto the lower zone of the stems and drops',
    then: 'the surface sends one dock intent naming the grid, the stems and below, and the applied document stacks the grid under the stems',
    act: async ({ canvasElement }) => {
      const stems = box(leaf(canvasElement, 'stems'));
      await drag(grip(canvasElement, 'grid'), centre(grip(canvasElement, 'grid')), { x: stems.left + stems.width / 2, y: stems.bottom - 8 });
    },
    check: async ({ canvasElement }) => {
      await expect(intentsOf(canvasElement)).toEqual([{ type: 'dockRegion', tab: 't', region: 'grid', target: 'stems', zone: 'below' }]);
      await waitFor(() => expect(box(leaf(canvasElement, 'grid')).top).toBeGreaterThan(box(leaf(canvasElement, 'stems')).top));
      await expect(Math.abs(box(leaf(canvasElement, 'grid')).left - box(leaf(canvasElement, 'stems')).left)).toBeLessThan(1);
    },
  },
  { render: () => <Docking document={TREE} /> },
) as Story;

export const Swapping: Story = scenario(
  {
    requirement: 'Regions are docked by dragging',
    shall: 'In edit mode a person SHALL be able to drag a region by its tag onto another region and drop it on one of five zones (left, right, above, below, swap), and the surface SHALL send one dock intent naming the region, the target and the zone; the step-wise move tools SHALL remain for the keyboard.',
    name: 'Swapping',
    when: 'a person drops a region on another’s centre zone',
    then: 'the two regions trade places',
    act: async ({ canvasElement }) => {
      await drag(grip(canvasElement, 'cuts'), centre(grip(canvasElement, 'cuts')), centre(leaf(canvasElement, 'grid')));
    },
    check: async ({ canvasElement }) => {
      await expect(intentsOf(canvasElement)).toEqual([{ type: 'dockRegion', tab: 't', region: 'cuts', target: 'grid', zone: 'swap' }]);
      await waitFor(() => expect(box(leaf(canvasElement, 'cuts')).left).toBeLessThan(box(leaf(canvasElement, 'grid')).left));
    },
  },
  { render: () => <Docking document={TREE} /> },
) as Story;

export const ADropOutsideEveryRegion: Story = scenario(
  {
    requirement: 'Regions are docked by dragging',
    shall: 'In edit mode a person SHALL be able to drag a region by its tag onto another region and drop it on one of five zones (left, right, above, below, swap), and the surface SHALL send one dock intent naming the region, the target and the zone; the step-wise move tools SHALL remain for the keyboard.',
    name: 'A drop outside every region',
    when: 'a person lets go of a dragged tag outside every region',
    then: 'nothing is sent and the layout is as it was',
    act: async ({ canvasElement }) => {
      await drag(grip(canvasElement, 'cuts'), centre(grip(canvasElement, 'cuts')), { x: 4, y: 4 });
    },
    check: async ({ canvasElement }) => {
      await expect(intentsOf(canvasElement)).toEqual([]);
      await expect(canvasElement.querySelector('[data-part="drop"]')).toBeNull();
    },
  },
  { render: () => <Docking document={TREE} /> },
) as Story;

export const LockingForTheGig: Story = scenario(
  {
    requirement: 'A locked tab can’t be edited',
    shall: 'A tab SHALL carry whether it is locked; a locked tab SHALL show no edit tools, handles or drop zones, and its panes SHALL take every touch, until a person deliberately unlocks it.',
    name: 'Locking for the gig',
    when: 'a person locks the panel',
    then: 'the surface sends one lock intent, and once applied the panel shows no edit tools while every pane still plays',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'lock Panel' }));
    },
    check: async ({ canvasElement }) => {
      await expect(intentsOf(canvasElement).filter((i) => i.type === 'lockTab')).toEqual([{ type: 'lockTab', tab: 't', locked: true }]);
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getByRole('button', { name: 'unlock Panel' })).toBeTruthy());
      await expect(canvas.queryByRole('button', { name: 'edit the views' })).toBeNull();
      await expect(canvasElement.querySelectorAll('[data-part="handle"], [data-part="frame"], [data-part="grip"]')).toHaveLength(0);
      await expect(within(leaf(canvasElement, 'grid')).getAllByRole('button').some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    },
  },
  { render: () => <Docking document={TREE} /> },
) as Story;

const LOCKED: SurfaceDocument = { ...TREE, tabs: [{ ...(TREE.tabs[0] as Extract<SurfaceDocument, { version: 2 }>['tabs'][number]), locked: true }] } as SurfaceDocument;

export const AStrayTouchOnALockedTab: Story = scenario(
  {
    requirement: 'A locked tab can’t be edited',
    shall: 'A tab SHALL carry whether it is locked; a locked tab SHALL show no edit tools, handles or drop zones, and its panes SHALL take every touch, until a person deliberately unlocks it.',
    name: 'A stray touch on a locked tab',
    when: 'a person drags across a locked tab',
    then: 'no region moves and no intent but the panes’ own is sent',
    act: async ({ canvasElement }) => {
      await drag(leaf(canvasElement, 'grid'), centre(leaf(canvasElement, 'grid')), centre(leaf(canvasElement, 'stems')));
    },
    check: async ({ canvasElement, args }) => {
      await expect(sent(args)).toEqual([]);
      await expect(box(leaf(canvasElement, 'grid')).left).toBeLessThan(box(leaf(canvasElement, 'stems')).left);
    },
  },
  { args: { onIntent: fn() }, render: (args) => <Workspace name="Panel" document={LOCKED} panes={workspacePanes} onIntent={args.onIntent} pane={workspacePane} /> },
) as Story;

export const UnlockingTakesIntent: Story = scenario(
  {
    requirement: 'A locked tab can’t be edited',
    shall: 'A tab SHALL carry whether it is locked; a locked tab SHALL show no edit tools, handles or drop zones, and its panes SHALL take every touch, until a person deliberately unlocks it.',
    name: 'Unlocking takes intent',
    when: 'a person presses unlock briefly',
    then: 'the tab stays locked until the press is held',
    act: async ({ canvasElement }) => {
      const unlock = within(canvasElement).getByRole('button', { name: 'unlock Panel' });
      await userEvent.click(unlock);
    },
    check: async ({ canvasElement, args }) => {
      await expect(sent(args)).toEqual([]);
      const unlock = within(canvasElement).getByRole('button', { name: 'unlock Panel' });
      await fireEvent.pointerDown(unlock, { pointerId: 9, button: 0, clientX: 1, clientY: 1 });
      await pause(450);
      await fireEvent.pointerUp(window, { pointerId: 9, clientX: 1, clientY: 1 });
      await waitFor(() => expect(sent(args)).toEqual([{ type: 'lockTab', tab: 't', locked: false }]));
    },
  },
  { args: { onIntent: fn() }, render: (args) => <Workspace name="Panel" document={LOCKED} panes={workspacePanes} onIntent={args.onIntent} pane={workspacePane} /> },
) as Story;

/** The mix band in a short share under the grid; a story button gives it more room through the host. */
const STACK: SurfaceDocument = {
  version: 2,
  active: 't',
  tabs: [{ id: 't', title: 'Stack', layout: { id: 't-col', split: 'column', children: [{ node: 'grid', share: 5 }, { node: 'mix', share: 1 }] }, regions: [region('grid', 'loopGrid', 'Loop grid'), region('mix', 'mix', 'Mix')] }],
};
function Growing() {
  const host = useSurfaceHost(STACK);
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <button type="button" onClick={() => host.onIntent({ type: 'resizeSplit', tab: 't', split: 't-col', shares: [1, 1] })}>
        Story: give the mix more room
      </button>
      <Workspace name="Panel" document={host.document} panes={workspacePanes} onIntent={host.onIntent} pane={workspacePane} />
    </div>
  );
}

export const GrowingARegionStepsItsFormUp: Story = scenario(
  {
    requirement: 'A region draws the largest form its room fits',
    shall: 'The surface SHALL give each region the room its share works out to and draw the largest of its pane’s forms that fits that room, so a resized region steps its form up or down; a region with less room than its smallest form SHALL draw that smallest form and be marked as cramped, and nothing reflows.',
    name: 'Growing a region steps its form up',
    when: 'the mix is resized from a short share to a tall one',
    then: 'it changes from its short form to its tall form',
    act: async ({ canvasElement }) => {
      await waitFor(() => expect(leaf(canvasElement, 'mix')).toHaveAttribute('data-form', 'short'));
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Story: give the mix more room' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(leaf(canvasElement, 'mix')).toHaveAttribute('data-form', 'tall'));
    },
  },
  { render: () => <Growing /> },
) as Story;

const EMPTY: SurfaceDocument = { version: 2, active: 't', tabs: [{ id: 't', title: 'New', layout: null, regions: [] }] };
function Keyboard() {
  const host = useSurfaceHost(EMPTY, { titleOf: (kind) => workspacePanes.find((p) => p.kind === kind)?.label ?? kind });
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <output aria-label="Story: intents sent">{JSON.stringify(host.intents)}</output>
      <Workspace name="Panel" document={host.document} panes={workspacePanes} onIntent={host.onIntent} pane={workspacePane} />
    </div>
  );
}

/** Focus a control and press Enter: a keyboard-only activation. */
async function press(root: HTMLElement, name: string, key = '{Enter}') {
  const el = await within(root).findByRole('button', { name });
  el.focus();
  await userEvent.keyboard(key);
}

export const TheKeyboardAlone: Story = scenario(
  {
    requirement: 'Edit mode works by touch, mouse and keyboard',
    shall: 'Every edit tool SHALL be reachable and usable with a finger (targets at least the principles’ minimum target, nothing that only appears on hover), with a mouse, and with the keyboard alone.',
    name: 'The keyboard alone',
    when: 'a person builds a two-pane tab using only the keyboard',
    then: 'every step (open the palette, add, open a region’s tools, move, resize, lock) is possible and each sends its intent',
    act: async ({ canvasElement }) => {
      await press(canvasElement, 'edit the views');
      await press(canvasElement, 'open the palette');
      await press(canvasElement, 'add Loop grid to this tab');
      await press(canvasElement, 'add Mix to this tab');
      await press(canvasElement, 'Mix tools');
      await press(canvasElement, 'move Mix up');
      await waitFor(() => expect(canvasElement.querySelector('[data-part="handle"]')).toBeTruthy());
      canvasElement.querySelector<HTMLElement>('[data-part="handle"]')!.focus();
      await userEvent.keyboard('{ArrowDown}');
      await press(canvasElement, 'lock New');
    },
    check: async ({ canvasElement }) => {
      const types = intentsOf(canvasElement).map((i) => i.type);
      await expect(types).toEqual(['setEditing', 'addRegion', 'addRegion', 'moveRegion', 'resizeSplit', 'lockTab', 'setEditing']);
      await waitFor(() => expect(within(canvasElement).getByRole('button', { name: 'unlock New' })).toBeTruthy());
    },
  },
  { render: () => <Keyboard /> },
) as Story;

export const FingerSizedTools: Story = scenario(
  {
    requirement: 'Edit mode works by touch, mouse and keyboard',
    shall: 'Every edit tool SHALL be reachable and usable with a finger (targets at least the principles’ minimum target, nothing that only appears on hover), with a mouse, and with the keyboard alone.',
    name: 'Finger-sized tools',
    when: 'edit mode is drawn',
    then: 'every handle, tag and tool is at least the minimum target in both directions',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Loop grid tools' }));
    },
    check: async ({ canvasElement }) => {
      const MIN = 24;
      const tools = [...canvasElement.querySelectorAll<HTMLElement>('[data-part="tools"] button, [data-part="regiontools"] button, [data-part="grip"] button')];
      await expect(tools.length).toBeGreaterThan(8);
      for (const t of tools) {
        const r = box(t);
        await expect(Math.min(r.width, r.height), t.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(MIN);
      }
      // A handle is thin, but a finger landing within the minimum target of its seam still takes it.
      for (const handle of canvasElement.querySelectorAll<HTMLElement>('[data-part="handle"]')) {
        const r = box(handle);
        const across = handle.getAttribute('aria-orientation') === 'vertical';
        // A quarter of the way along the seam, clear of any handle crossing it.
        const c = { x: r.left + (across ? r.width / 2 : r.width / 4), y: r.top + (across ? r.height / 4 : r.height / 2) };
        for (const d of [-(MIN / 2 - 1), MIN / 2 - 1]) {
          const hit = document.elementFromPoint(across ? c.x + d : c.x, across ? c.y : c.y + d);
          await expect(hit === handle || handle.contains(hit), `${handle.getAttribute('aria-label')} at ${d}px (${r.width}×${r.height})`).toBe(true);
        }
      }
    },
  },
  { render: () => <Docking document={TREE} /> },
) as Story;

export const FormsStepDownOnASmallWindow: Story = scenario(
  {
    requirement: 'A region draws the largest form its room fits',
    shall: 'The surface SHALL give each region the room its share works out to and draw the largest of its pane’s forms that fits that room, so a resized region steps its form up or down; a region with less room than its smallest form SHALL draw that smallest form and be marked as cramped, and nothing reflows.',
    name: 'Forms step down on a small window',
    when: 'the surface is narrowed until a region’s widest form no longer fits',
    then: 'the region steps down to its next form, as the kind’s forms list them, and no region is cramped',
    check: async ({ canvasElement }) => {
      const placed = [...canvasElement.querySelectorAll<HTMLElement>('[data-leaf][data-form]')];
      const firstForm = (kind: string) => workspacePanes.find((p) => p.kind === kind)!.forms[0].id;
      const kinds = workspaceDocument.tabs[0].regions.map((r) => r.kind);
      await expect(placed.some((el, i) => el.dataset.form !== firstForm(kinds[i]))).toBe(true);
      await expect(canvasElement.querySelector('[data-cramped]')).toBeNull();
    },
  },
  {
    parameters: { frame: { w: 900, h: 700 } },
    render: () => <Workspace name="Live" document={{ ...workspaceDocument, tabs: [workspaceDocument.tabs[0]] }} panes={workspacePanes} pane={workspacePane} />,
  },
) as Story;

/** A short strip over a tall grid: the mix gets less height than even its smallest form needs. */
const SQUEEZED: SurfaceDocument = {
  version: 2,
  active: 't',
  tabs: [{ id: 't', title: 'Squeezed', layout: { id: 't-col', split: 'column', children: [{ node: 'mix', share: 1 }, { node: 'grid', share: 30 }] }, regions: [region('mix', 'mix', 'Mix'), region('grid', 'loopGrid', 'Loop grid')] }],
};

export const LessRoomThanTheSmallestForm: Story = scenario(
  {
    requirement: 'A region draws the largest form its room fits',
    shall: 'The surface SHALL give each region the room its share works out to and draw the largest of its pane’s forms that fits that room, so a resized region steps its form up or down; a region with less room than its smallest form SHALL draw that smallest form and be marked as cramped, and nothing reflows.',
    name: 'Less room than the smallest form',
    when: 'a document gives a region a share too small for even its smallest form',
    then: 'the region draws its smallest form and is marked as cramped, and the region beside it keeps its own share',
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(leaf(canvasElement, 'mix')).toHaveAttribute('data-cramped', 'true'));
      const forms = workspacePanes.find((p) => p.kind === 'mix')!.forms;
      await expect(leaf(canvasElement, 'mix')).toHaveAttribute('data-form', forms[forms.length - 1].id);
      await expect(leaf(canvasElement, 'grid')).not.toHaveAttribute('data-cramped');
    },
  },
  { render: () => <Workspace name="Panel" document={SQUEEZED} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

/** Two tabs, the second locked, in an app that is editing. */
const HALF_LOCKED: SurfaceDocument = {
  version: 2,
  active: 'open',
  tabs: [
    { id: 'open', title: 'Open', layout: 'o-1', regions: [region('o-1', 'loopGrid', 'Loop grid')] },
    { id: 'gig', title: 'Gig', layout: 'g-1', regions: [region('g-1', 'mix', 'Mix')], locked: true },
  ],
};
function HalfLocked() {
  const host = useSurfaceHost(HALF_LOCKED, { keepEditing: true, editing: true });
  return <Workspace name="Panel" document={host.document} panes={workspacePanes} editing={host.editing} onIntent={host.onIntent} pane={workspacePane} />;
}

export const ALockedTabOpenedWhileEditing: Story = scenario(
  {
    requirement: 'A locked tab can’t be edited',
    shall: 'A tab SHALL carry whether it is locked; a locked tab SHALL show no edit tools, handles or drop zones, and its panes SHALL take every touch, until a person deliberately unlocks it.',
    name: 'A locked tab opened while editing',
    when: 'the surface is editing one tab and a person opens another that is locked',
    then: 'the locked tab shows no frames, handles, palette or tab tools (it can’t be renamed, duplicated or removed), only the hold to unlock',
    and: ['going back to the first tab finds it still in edit mode'],
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvasElement.querySelectorAll('[data-part="frame"]').length).toBe(1);
      await userEvent.click(canvas.getByRole('tab', { name: 'Gig' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getByRole('button', { name: 'unlock Gig' })).toBeTruthy());
      await expect(canvasElement.querySelectorAll('[data-part="frame"], [data-part="handle"], [data-part="palette"]')).toHaveLength(0);
      for (const name of ['rename Gig', 'duplicate Gig', 'remove Gig', 'finish editing']) await expect(canvas.queryByRole('button', { name })).toBeNull();
      await userEvent.click(canvas.getByRole('tab', { name: 'Open' }));
      await waitFor(() => expect(canvasElement.querySelectorAll('[data-part="frame"]').length).toBe(1));
    },
  },
  { render: () => <HalfLocked /> },
) as Story;
