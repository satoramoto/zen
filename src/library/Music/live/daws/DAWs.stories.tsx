import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
// The host first: it loads the surface before the kit's definitions (the kit's forms reach back into the layout).
import { DawApp } from './Daw.story';
import { isLivePaneKind } from '../panes';
import { DAWS, type DawId } from './daws';

// Whole DAWs composed from the reference kit: a surface document each (daws.ts), built through the
// surface's own intents, drawn by one linked stand-in set. The premise of the Live work, shown:
// zen is a UI framework to build your own DAW, and these are four. Each wears its own pack and is
// made for its own window; hold "Locked" to unlock one and rebuild it. React only: region content
// is app content.

const meta = {
  title: 'Music/Live/DAWs',
  component: DawApp,
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    spec: {
      capability: 'live-reference-kit',
      purpose: 'The Music live panes as a ready-made set an app may use whole, in part or beside its own, the settings they declare, and the whole DAWs composed from them.',
      requirement: 'Whole DAWs are composed from the kit',
      shall: 'Zen SHALL show whole DAWs composed from the reference kit alone, each a surface document built through the surface’s own intents and drawn by one linked host, in its own pack and at the window size it is made for; in each, every region SHALL draw a pane of the kit with none cramped, and the DAW SHALL be played as it stands.',
    },
  },
  argTypes: { daw: { control: 'select', options: Object.keys(DAWS) }, running: { control: 'boolean' } },
} satisfies Meta<typeof DawApp>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A DAW's story: its pack and mode on the toolbar, its window as the frame. */
const daw = (id: DawId): Story => ({ args: { daw: id }, globals: { theme: DAWS[id].pack, mode: DAWS[id].mode }, parameters: { frame: DAWS[id].frame } });

const panes = (el: HTMLElement): HTMLElement[] => [...el.querySelectorAll<HTMLElement>('[data-testid^="pane-"]')];
const pane = (el: HTMLElement, kind: string, nth = 0): HTMLElement => panes(el).filter((p) => p.dataset.kind === kind)[nth];

/** Every region of the DAW's open tab draws a pane of the kit, none cramped, none failed or unknown, and the board has no sideways overflow. */
async function expectWhole(canvasElement: HTMLElement, id: DawId) {
  const tab = DAWS[id].document.tabs[0];
  await waitFor(() => expect(panes(canvasElement)).toHaveLength(tab.regions.length));
  await waitFor(() => expect(canvasElement.querySelectorAll('[data-leaf][data-form]')).toHaveLength(tab.regions.length));
  for (const p of panes(canvasElement)) {
    await expect(isLivePaneKind(p.dataset.kind!)).toBe(true);
    await expect(p.querySelector('.live-pane')).toBeTruthy();
  }
  await waitFor(() => expect(canvasElement.querySelector('[data-cramped]')).toBeNull());
  await expect(canvasElement.querySelector('[data-part="placeholder"], [data-part="failed"], [data-part="unbound"]')).toBeNull();
  const board = canvasElement.querySelector<HTMLElement>('.yh-workspace')!;
  await expect(board.scrollWidth).toBeLessThanOrEqual(board.clientWidth + 1);
  // Built through intents and locked for the gig: no edit chrome, the hold to unlock in the head.
  await expect(within(canvasElement).getByRole('button', { name: `unlock ${tab.title}` })).toBeTruthy();
}

/** Dub desk: a mixing desk played as an instrument. Channels to ride, a wide bank of sends and filter, echo throws and drops under the right hand. */
export const DubDesk: Story = scenario(
  {
    name: 'The dub desk',
    when: 'the dub desk is opened at 1440 × 900 and a person flips Freeze on its bank of sends',
    then: 'every region draws a kit pane with none cramped, and the Freeze switch reads on once the host moves the parameter',
    act: async ({ canvasElement }) => {
      await expectWhole(canvasElement, 'dub');
      await userEvent.click(within(pane(canvasElement, 'controls')).getByRole('button', { name: 'Freeze' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(within(pane(canvasElement, 'controls')).getByRole('button', { name: 'Freeze' })).toHaveAttribute('aria-pressed', 'true'));
      await expect(pane(canvasElement, 'mix').querySelectorAll('[data-track]').length).toBeGreaterThanOrEqual(8);
    },
  },
  daw('dub'),
) as Story;

/** Orbit lab: a generative rig. Two orbit clocks, each fixed to its own track, either side of the compass; dice and the landing in reach; the progression under them. */
export const OrbitLab: Story = scenario(
  {
    name: 'The orbit lab',
    when: 'the orbit lab is opened at 1440 × 900 and a person selects Bass in one of its orbit clocks',
    then: 'every region draws a kit pane with none cramped, the dice now aim at Bass, and the two clocks stay on Drums and Keys, the tracks they are fixed to',
    act: async ({ canvasElement }) => {
      await expectWhole(canvasElement, 'orbit');
      await expect([pane(canvasElement, 'orbits', 0).dataset.target, pane(canvasElement, 'orbits', 1).dataset.target]).toEqual(['drums', 'keys']);
      await userEvent.click(within(pane(canvasElement, 'orbits', 0)).getAllByRole('button', { name: /^Bass/ })[0]);
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(canvasElement.querySelector('.live-dice')).toHaveAccessibleName('Dice → Bass'));
      await expect([pane(canvasElement, 'orbits', 0).dataset.target, pane(canvasElement, 'orbits', 1).dataset.target]).toEqual(['drums', 'keys']);
    },
  },
  daw('orbit'),
) as Story;

/** Stem booth: a deck for finished songs. The song now beside its sections, the stems wide, cuts and a blend panel beside them, four strips under the hands. */
export const StemBooth: Story = scenario(
  {
    name: 'The stem booth',
    when: 'the stem booth is opened at 1440 × 900 and a person mutes the bass stem and queues the bridge',
    then: 'every region draws a kit pane with none cramped, the deck shows a lane per stem with the bass muted, and the bridge reads queued',
    act: async ({ canvasElement }) => {
      await expectWhole(canvasElement, 'booth');
      await expect(canvasElement.querySelector('[data-leaf]:has(.live-stems)')).toHaveAttribute('data-form', 'lanes');
      const stems = pane(canvasElement, 'stems');
      const bass = () => within(stems).getAllByRole('button').find((b) => /Bass/.test(b.getAttribute('aria-label') ?? ''))!;
      stems.dataset.was = bass().getAttribute('aria-pressed') ?? '';
      await userEvent.click(bass());
      await userEvent.click(within(pane(canvasElement, 'sections')).getByRole('button', { name: /^Section BRIDGE/ }));
    },
    check: async ({ canvasElement }) => {
      const stems = pane(canvasElement, 'stems');
      await waitFor(() => expect(within(stems).getAllByRole('button').find((b) => /Bass/.test(b.getAttribute('aria-label') ?? ''))).not.toHaveAttribute('aria-pressed', stems.dataset.was!));
      await waitFor(() => expect(within(pane(canvasElement, 'sections')).getByRole('button', { name: /^Section BRIDGE, queued/ })).toBeTruthy());
      await expect(pane(canvasElement, 'mix').querySelectorAll('[data-track]')).toHaveLength(4);
    },
  },
  daw('booth'),
) as Story;

/** Pocket: a phone on the mic stand. The song now, the cuts as the biggest targets, four pads and two faders. */
export const Pocket: Story = scenario(
  {
    name: 'The pocket remote',
    when: 'the pocket remote is opened at 390 × 780, a phone’s window, and a person presses JAM',
    then: 'every region draws a kit pane with none cramped and nothing runs off the side, and the song card reads jamming',
    act: async ({ canvasElement }) => {
      await expectWhole(canvasElement, 'pocket');
      await userEvent.click(within(pane(canvasElement, 'song')).getByRole('button', { name: 'Jam from here' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(within(pane(canvasElement, 'song')).getByRole('button', { name: 'Jam, playing' })).toHaveAttribute('aria-pressed', 'true'));
      const board = canvasElement.querySelector<HTMLElement>('.yh-workspace')!.getBoundingClientRect();
      for (const b of within(pane(canvasElement, 'controls')).getAllByRole('button')) {
        const r = b.getBoundingClientRect();
        await expect(r.left >= board.left - 1 && r.right <= board.right + 1).toBe(true);
      }
    },
  },
  daw('pocket'),
) as Story;
