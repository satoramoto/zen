import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { Workspace } from './Workspace';
import WorkspaceSvelte from './Workspace.svelte';
import { mixSpec, stageSpec, workspaceArgTypes, workspaceStories as s } from './Workspace.fixtures';

// Every story is built from Workspace.fixtures.ts (`story(s.Name)`), region contents joining in
// this file; the toolbar's Renderer draws it with React's or Svelte's `Tree`.

/** A region's placeholder content: a labelled plate of stage height, so a tab reads as a tab. */
function plate(label: string, height = 280): ReactNode {
  const style: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height,
    border: '1px dashed currentColor',
    opacity: 0.7,
  };
  return <div style={style}>{label}</div>;
}

const stageContent = {
  loop: plate('Loop grid', 320),
  mix: plate('Mix', 320),
  arp: plate('Arp', 320),
  cuts: plate('Transitions', 120),
};

/**
 * Tabs of self-assembling screens: a persistent strip, the open tab beneath it, and — while
 * editing — a frame round every region with the six structural edits. Controlled throughout. Each
 * story is drawn in a 1440 × 900 frame (Narrow: 900 × 700), so the tab's screen assembles the way
 * an app window assembles it.
 */
const meta = {
  title: 'Design OS/Layout/Workspace',
  component: Workspace,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 1440, h: 900 } },
  args: { name: 'Live', workspace: { tabs: [{ id: 'stage', title: 'My stage', spec: stageSpec }] }, active: 'stage' },
  argTypes: workspaceArgTypes,
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Workspace, WorkspaceSvelte);

/** A story that can be played: tabs, specs and bindings all spies. */
const wired = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, content: stageContent, onTab: fn(), onSpec: fn(), onBinding: fn() },
});

/** My stage, Session grid, Mix & sends: the loop grid over the mix beside the arp. */
export const Perform: Story = wired(s.Perform, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('tab', { name: 'Session grid' });
    await userEvent.click(grid);
    await expect(args.onTab).toHaveBeenCalledWith('grid');
  },
});

/** Edit mode: every region framed, the palette bar under the tabs. */
export const Edit: Story = wired(s.Edit);

/** The palette bar adds a kind to the tab's last row. */
export const AddFromPalette: Story = wired(s.Edit, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'add Transitions to this tab' }));
    await expect(args.onSpec).toHaveBeenCalled();
    const [, next, why] = (args.onSpec as unknown as { mock: { calls: [string, { rows: unknown[] }, string][] } }).mock.calls[0];
    await expect(why).toBe('add');
    await expect(next.rows.length).toBeGreaterThan(0);
  },
});

/** A frame's arrow moves its region within its row. */
export const Reorder: Story = wired(s.Edit, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'move arp left' }));
    await expect(args.onSpec).toHaveBeenCalled();
    const [tabId, , why] = (args.onSpec as unknown as { mock: { calls: [string, unknown, string][] } }).mock.calls[0];
    await expect(tabId).toBe('stage');
    await expect(why).toBe('move');
  },
});

/** A frame's `+ kind` splits its slot with the new region. */
export const Split: Story = wired(s.Edit, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'split loop with Transitions' }));
    await expect(args.onSpec).toHaveBeenCalled();
    const [, , why] = (args.onSpec as unknown as { mock: { calls: [string, unknown, string][] } }).mock.calls[0];
    await expect(why).toBe('split');
  },
});

/** A frame's track switch binds its region. */
export const Bind: Story = wired(s.Edit, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Bind loop' });
    await userEvent.click(within(group).getByRole('button', { name: 'Keys' }));
    await expect(args.onBinding).toHaveBeenCalledWith('stage', 'loop', { track: 'keys' });
  },
});

/** The stage tab at 900 × 700: the tabs step down and nothing overflows. */
export const Narrow: Story = {
  ...story(s.Narrow, { args: { ...s.Narrow.args, content: stageContent }, parameters: { frame: { w: 900, h: 700 } } }),
};

/** No tabs: the strip alone. */
export const Empty: Story = story(s.Empty);

/** Drawn but deaf: dimmed, tools inert. */
export const Disabled: Story = story(s.Disabled, { args: { ...s.Disabled.args, content: stageContent } });
