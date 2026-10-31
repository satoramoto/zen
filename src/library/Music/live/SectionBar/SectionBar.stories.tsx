import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { SectionBar, type SectionBarProps } from './SectionBar';
import SectionBarSvelte from './SectionBar.svelte';
import { sectionBarArgTypes, sectionBarBoard, sectionBarStories as s } from './SectionBar.fixtures';

// Every story is built from SectionBar.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the bar with no `onSection`: read-only.

/**
 * A song's sections in mix[flow]'s face, PushTwin's row-7 cell as the song's form: playing lit,
 * queued blinking, ready tinted, an unavailable section dashed with its reason.
 */
const meta = {
  id: 'music-live-section-bar',
  title: 'Music/Live/Section bar',
  component: SectionBar,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 720, h: 96 } },
  args: sectionBarBoard,
  argTypes: sectionBarArgTypes,
} satisfies Meta<typeof SectionBar>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SectionBar, SectionBarSvelte);

/** A story in its own frame, keeping the fixture's Svelte parameters. */
const framed = (st: Story, w: number, h: number): Story => ({ ...st, parameters: { ...st.parameters, frame: { w, h } } });

/** A story with a section spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onSection: fn() },
});

const cell = (canvas: ReturnType<typeof within>, name: string) => canvas.getByRole('button', { name: new RegExp(`^Section ${name.replace(/[▸]/g, '.')},`) });

/** The verse playing, the chorus queued. A press (or Enter) asks for that section by id; the cells keep the host's state. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Section VERSE, playing' })).toHaveAttribute('aria-current', 'true');
    await expect(canvas.getByRole('button', { name: 'Section CHORUS, queued' })).toHaveAttribute('data-state', 'queued');
    await expect(canvas.getByRole('button', { name: 'Section INTRO, ready' })).toHaveTextContent('8 bars');
    await expect(canvas.getByRole('button', { name: 'Section VERSE, playing' })).toHaveTextContent('16 bars · ×2');
    await expect(canvas.getByRole('button', { name: 'Section OUT, ready' })).toHaveTextContent('free');
    await expect(canvas.getByText('change on phrase')).toBeTruthy();
    await userEvent.click(canvas.getByRole('button', { name: 'Section BRIDGE, ready' }));
    await expect(args.onSection).toHaveBeenCalledWith('bridge');
    canvas.getByRole('button', { name: 'Section OUT, ready' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSection).toHaveBeenLastCalledWith('out');
    // Nothing is queued until the host says so.
    await expect(canvas.getByRole('button', { name: 'Section BRIDGE, ready' })).toHaveAttribute('data-state', 'stopped');
    // Widths follow the bars: the verse (16 × 2) is wider than the intro (8).
    const w = (name: string) => cell(canvas, name).getBoundingClientRect().width;
    await expect(w('VERSE')).toBeGreaterThan(w('INTRO'));
  },
});

/** Every state; the bridge is unavailable, says why, and asks nothing when pressed. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const states = canvas.getAllByRole('button').map((b) => b.getAttribute('data-state'));
    await expect(new Set(states)).toEqual(new Set(['on', 'queued', 'stopped']));
    const bridge = canvas.getByRole('button', { name: 'Section BRIDGE, ready, unavailable: no bridge loop recorded' });
    await expect(bridge).toBeDisabled();
    await userEvent.click(bridge, { pointerEventsCheck: 0 });
    await expect(args.onSection).not.toHaveBeenCalled();
  },
});

/** The `row` form: Push row 7, eight equal cells, FILL, VAR and NO FORM after the song's form. */
export const Row: Story = framed(
  live(s.Row, {
    play: async ({ args, canvasElement }) => {
      const canvas = within(canvasElement);
      const cells = canvas.getAllByRole('button');
      await expect(cells).toHaveLength(8);
      const widths = cells.map((c) => Math.round(c.getBoundingClientRect().width));
      await expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
      await expect(canvasElement.querySelector('[data-part="length"]')).toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: 'Section FILL, ready' }));
      await expect(args.onSection).toHaveBeenCalledWith('fill');
      await expectFits(canvasElement);
    },
  }),
  560,
  48,
);

/** The `chip` form: one status line, the section playing and the one queued; nothing to press. */
export const Dense: Story = framed(
  live(s.Dense, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('status', { name: 'VERSE playing, CHORUS queued' })).toHaveTextContent('VERSE → CHORUS');
      await expect(canvas.queryAllByRole('button')).toHaveLength(0);
      await expectFits(canvasElement);
    },
  }),
  260,
  32,
);

/** No sections (a jam): one quiet well, nothing to press. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No sections')).toBeTruthy();
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
  },
});

/** No `onSection`: the bar is read, not pressed. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
    await expect(canvas.getByText('read-only')).toBeTruthy();
  },
});

/** A host that queues the section asked for. When it lands, and whether a queued one is replaced, is the host's: this one replaces. */
const queue = host<SectionBarProps>({ apply: { onSection: (_, id: string) => ({ queued: id }) } });

/** Controlled readback: a press queues the section once the host does; the old queued one reads ready again; playing stays the host's. */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...queue },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Section BRIDGE, ready' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Section BRIDGE, queued' })).toHaveAttribute('data-state', 'queued'));
    await expect(canvas.getByRole('button', { name: 'Section CHORUS, ready' })).toHaveAttribute('data-state', 'stopped');
    await expect(canvas.getByRole('button', { name: 'Section VERSE, playing' })).toHaveAttribute('aria-current', 'true');
    canvas.getByRole('button', { name: 'Section INTRO, ready' }).focus();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Section INTRO, queued' })).toBeTruthy());
    await expect(canvas.getByRole('button', { name: 'Section INTRO, queued' })).toHaveFocus();
    await expect(args.onSection).toHaveBeenNthCalledWith(1, 'bridge');
    await expect(args.onSection).toHaveBeenNthCalledWith(2, 'intro');
  },
});

/** Another song a host could bind the bar to. */
const NEXT_SONG: Partial<SectionBarProps> = {
  sections: [
    { id: 'wire-a', name: 'A', bars: 8 },
    { id: 'wire-b', name: 'B', bars: 8 },
    { id: 'wire-drop', name: 'DROP', bars: 16 },
  ],
  current: 'wire-a',
  queued: undefined,
};

/** Rebinding: the host hands the bar the next song. The old sections are gone, and a press carries the new song's id. */
export const Rebound: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, host: { ...queue.host, presets: { 'Bind Wire': NEXT_SONG } } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Bind Wire' }));
    await waitFor(() => expect(canvas.queryByRole('button', { name: /^Section VERSE/ })).toBeNull());
    await expect(canvas.getByRole('button', { name: 'Section A, playing' })).toHaveAttribute('aria-current', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Section DROP, ready' }));
    await expect(args.onSection).toHaveBeenCalledTimes(1);
    await expect(args.onSection).toHaveBeenCalledWith('wire-drop');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Section DROP, queued' })).toBeTruthy());
  },
});
