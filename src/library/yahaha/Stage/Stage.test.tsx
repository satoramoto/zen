import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, type StageProps } from './Stage';
import { sectionPads as padBankSections } from '../PadBank/PadBank.fixtures';
import { songFormBoard } from '../SongForm/SongForm.fixtures';
import { stageBoard, stageQuickRacks, stageStopped } from './Stage.fixtures';
import { pressSectionPad, SECTION_PAD_LAYOUT, sectionPads } from './sectionPads';
import { StagePlayground } from './StagePlayground';
import type { Placement } from '../../layout/assembly/types';
import { principlesFor } from '../../layout/assembly/units';
import { packs } from '../../themes/packs';

afterEach(() => vi.restoreAllMocks());

const region = (name: string) => within(screen.getByRole('region', { name }));
const group = (name: string) => within(screen.getByRole('group', { name }));
/** Exactly one control on the whole screen answers to `name`. */
const once = (name: string | RegExp, role: 'button' | 'slider' | 'group' | 'img' | 'tab' = 'button') =>
  expect(
    screen.getAllByRole(role, { name }).map((node) => node.getAttribute('aria-label') ?? node.textContent),
    String(name),
  ).toHaveLength(1);

function setup(props: Partial<StageProps> = {}) {
  return render(<Stage {...stageBoard} width={1920} height={1080} {...props} />);
}

/** The Stage screen's zones, in its 16:9 room: header, body (and the body's inner grid box), footer, in that order. */
function zones() {
  const stage = screen.getByRole('group', { name: 'Stage' });
  const room = stage.querySelector<HTMLElement>(':scope > [data-part="room"]')!;
  expect(room).not.toBeNull();
  const children = Array.from(room.children) as HTMLElement[];
  expect(children.map((node) => node.dataset.part)).toEqual(['header', 'body', 'footer']);
  const [header, body, footer] = children;
  const grid = body.querySelector<HTMLElement>(':scope > [data-part="grid"]')!;
  expect(grid).not.toBeNull();
  return { header, body, grid, footer };
}
/** A zone's slots, in DOM order: each one's region id and the name of the Region it holds (null for none). */
const slots = (zone: HTMLElement) =>
  (Array.from(zone.querySelectorAll(':scope > .lib-assembled__slot')) as HTMLElement[]).map((node) => [
    node.dataset.region,
    node.querySelector(':scope > section.lib-region')?.getAttribute('aria-label') ?? null,
  ]);
const slot = (zone: HTMLElement, id: string) => zone.querySelector<HTMLElement>(`:scope > .lib-assembled__slot[data-region="${id}"]`)!;

describe('Stage', () => {
  it('is an assembled Screen: the app bar in the header, the regions in the body in reading order, the keys then the status line in the footer', () => {
    const { container } = setup();
    expect(container.querySelector('.yh-stage')).toHaveAttribute('data-layout', 'stacked');
    const { header, body, grid, footer } = zones();
    expect(within(header).getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    expect(slots(header).map(([id]) => id)).toEqual(['bar']);
    expect(grid.parentElement).toBe(body);
    expect(slots(grid)).toEqual([
      ['hero', 'Hero'],
      ['transport', 'Transport'],
      ['mixer', 'Mixer'],
      ['knobs', 'Knobs'],
      ['pads', 'Pads'],
    ]);
    expect(slots(footer)).toEqual([
      ['keys', 'Keyboard'],
      ['status', null],
    ]);
    expect(slot(footer, 'status').querySelector('.yh-status-line')).not.toBeNull();
    // The hero and the song form halves are plain elements: the Stage's Regions name them.
    expect(within(grid).getByRole('region', { name: 'Hero' })).toContainElement(grid.querySelector<HTMLElement>('.yh-display'));
    expect(within(grid).getByRole('region', { name: 'Transport' })).toContainElement(within(grid).getByRole('group', { name: 'Transport' }));
    // No song form strip: the sections are the Pads region's Sections bank, its default view.
    expect(screen.queryByRole('region', { name: 'Song form' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Sections' })).toBeNull();
    expect(region('Pads').getByRole('tab', { name: 'Sections' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('region', { name: 'Stage display' })).toBeNull();
  });

  it("gives each slot the placement's form, and at the 1920 × 1080 board the full hero at zoom 1", () => {
    for (const layout of ['stacked', 'split'] as const) {
      const placements: Placement[] = [];
      const { unmount } = setup({ layout, onPlacement: (p) => void placements.push(p) });
      expect(placements.length).toBeGreaterThan(0);
      const placement = placements[placements.length - 1];
      const stage = screen.getByRole('group', { name: 'Stage' });
      const all = Array.from(stage.querySelectorAll<HTMLElement>('.lib-assembled__slot'));
      expect(all.map((node) => node.dataset.region)).toEqual(placement.order);
      for (const node of all) expect(node.dataset.form, node.dataset.region).toBe(placement.regions[node.dataset.region!].form);
      expect(placement.regions.hero.form).toBe('full');
      expect(placement.zoom).toBe(1);
      expect(stage).toHaveAttribute('data-zoom', '1.000');
      expect(stage).not.toHaveAttribute('data-overflow');
      unmount();
    }
  });

  it('is 16:9: a 1440 × 900 window draws a 1440 × 810 room with a ground band above and below', () => {
    setup({ width: 1440, height: 900 });
    const stage = screen.getByRole('group', { name: 'Stage' });
    const room = stage.querySelector<HTMLElement>(':scope > [data-part="room"]')!;
    expect(room.style.getPropertyValue('--lib-at-h')).toBe('810');
    expect(room.style.getPropertyValue('--lib-at-y')).toBe('45');
    const bands = Array.from(stage.querySelectorAll<HTMLElement>(':scope > [data-part="band"]'));
    expect(bands.map((b) => [b.dataset.layer, b.style.getPropertyValue('--lib-at-h')])).toEqual([
      ['ground', '45'],
      ['ground', '45'],
    ]);
    expect(slot(zones().header, 'bar').style.getPropertyValue('--lib-at-w')).toBe('1440');
  });

  it("fit='scale': a 900 × 700 frame draws the whole 1920 × 1080 board, scaled to 900 × 506.25, in the board's forms", () => {
    const placements: Placement[] = [];
    setup({ fit: 'scale', width: 900, height: 700, onPlacement: (p) => void placements.push(p) });
    const placement = placements[placements.length - 1];
    expect(placement.regions.hero.form).toBe('full');
    expect(placement.scale).toBeCloseTo(900 / 1920, 12);
    const room = screen.getByRole('group', { name: 'Stage' }).querySelector<HTMLElement>(':scope > [data-part="room"]')!;
    expect(room).toHaveAttribute('data-scale', (900 / 1920).toFixed(3));
    expect(room.style.getPropertyValue('--lib-at-w')).toBe('1920');
    expect(room.style.getPropertyValue('--lib-at-h')).toBe('1080');
  });

  it("gives the keys the keys slot's width less the plate", () => {
    const placements: Placement[] = [];
    for (const size of [{ width: 1920, height: 1080 }, { width: 1217, height: 752 }]) {
      const { unmount } = setup({ ...size, onPlacement: (p) => void placements.push(p) });
      const { inset } = principlesFor(packs[0].facets, packs[0].principles).plate;
      const keysRect = placements[placements.length - 1].regions.keys.rect;
      const keys = slot(zones().footer, 'keys').querySelector<HTMLElement>('.yh-keys')!;
      expect(keys.style.width).toBe(`${keysRect.w - inset.left - inset.right}px`);
      unmount();
    }
  });

  it('folds each bank\'s tabs into its region: no region inside the Mixer, Knobs or Pads', () => {
    setup();
    for (const [name, tabs] of [
      ['Mixer', ['Panel', 'Style']],
      ['Knobs', ['Style', 'Rack', 'Pan', 'Reverb', 'Chorus', 'Delay']],
      ['Pads', ['Sections', 'Quick Racks', 'Chord', 'Multi Pads', 'Setup']],
    ] as const) {
      const node = screen.getByRole('region', { name });
      expect(within(node).queryAllByRole('region')).toHaveLength(0);
      expect(within(within(node).getByRole('tablist', { name })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(tabs);
      expect(within(node).getByRole('tabpanel')).toBeInTheDocument();
    }
    expect(within(screen.getByRole('region', { name: 'Mixer' })).getByRole('tablist', { name: 'Fader layer' })).toBeInTheDocument();
  });

  it('has no hue legend: the mixer names each part in its hue', () => {
    const { container } = setup();
    expect(container.querySelector('.yh-huelegend')).toBeNull();
    expect(screen.queryByRole('list', { name: /legend/i })).toBeNull();
  });

  it('lays out every region once', () => {
    setup();
    const stage = screen.getByRole('group', { name: 'Stage' });
    expect(within(stage).getAllByRole('navigation', { name: 'Pages' })).toHaveLength(1);
    for (const name of ['Hero', 'Transport', 'Mixer', 'Knobs', 'Pads', 'Keyboard']) {
      expect(within(stage).getAllByRole('region', { name })).toHaveLength(1);
    }
    expect(stage.querySelectorAll('.yh-keys')).toHaveLength(1);
    expect(stage.querySelectorAll('.yh-status-line')).toHaveLength(1);
  });

  it('has every page once, in the app bar', () => {
    setup();
    const nav = within(screen.getByRole('navigation', { name: 'Pages' }));
    for (const page of ['Stage', 'Channel', 'Effects', 'Quick Racks', 'Multi Pads', 'Looper', 'Harm/Arp', 'Library', 'Settings']) {
      expect(nav.getAllByRole('tab', { name: page })).toHaveLength(1);
    }
    expect(nav.getByRole('tab', { name: 'Stage' })).toHaveAttribute('aria-selected', 'true');
  });

  it('has the global switches once, only in the app bar', () => {
    setup();
    const switches = group('Global switches');
    for (const name of ['Metronome', /^Metronome settings/, 'Unison', /^Help mode/]) {
      once(name);
      expect(switches.getByRole('button', { name })).toBeInTheDocument();
    }
    once('Panic: all notes off');
    expect(screen.getAllByRole('status', { name: /Launchkey/ })).toHaveLength(1);
  });

  it('has the style, chord, section, tempo and beat once, in the hero', () => {
    setup();
    const hero = region('Hero');
    for (const name of ['Previous style (Track left)', 'Next style (Track right)', 'Sunday Drive Pop: open the Browser']) {
      once(name);
      expect(hero.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(hero.getAllByRole('button', { name: /One Touch [1-4]/ })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: /One Touch [1-4]/ })).toHaveLength(4);
    expect(hero.getByRole('img', { name: 'Playing Main B' })).toBeInTheDocument();
    expect(hero.getAllByRole('img', { name: /Am/ }).length).toBeGreaterThan(0);
    for (const name of ['Tap tempo', 'Tempo up (Scene Launch)', 'Tempo down (Function)', "Back to the style's tempo"]) {
      once(name);
      expect(hero.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('drops the hero parts column: the mixer names each sound', () => {
    setup();
    expect(region('Hero').queryByRole('list', { name: 'Sounds' })).toBeNull();
    const faders = region('Mixer');
    for (const name of ['Right 1, Stage Grand: open Channel', 'Right 2, Silk Strings, edited: open Channel', 'Left, Finger Bass: open Channel']) {
      expect(faders.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  const SECTIONS = [/^Intro I\b(?!I)/, /^Intro II\b(?!I)/, /^Intro III/, /^Main A/, /^Main B/, /^Main C/, /^Main D/, /^Ending I\b(?!I)/, /^Ending II\b(?!I)/, /^Ending III/, /^Break/];
  const TRANSPORT = [/^Start \/ Stop/, /^Sync Start/, 'Sync Stop', 'Auto Fill', /^Fill Up/, /^Fill Down/, /^Fade\b/, /^Section reset/, 'Accomp (ACMP)'];

  it('has every section once, on the Pads region\'s Sections bank, and every transport key once beside the hero', () => {
    const { unmount } = setup();
    const pads = region('Pads');
    for (const name of SECTIONS) {
      once(name);
      expect(pads.getByRole('button', { name })).toBeInTheDocument();
    }
    unmount();
    // On another bank the transport keys the Sections pads mirror are only in the transport.
    setup(stageQuickRacks);
    const transport = region('Transport');
    for (const name of TRANSPORT) {
      once(name);
      expect(transport.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('split: the hero across the top, the transport down the right beside the knobs and pads', () => {
    const { container } = setup({ layout: 'split' });
    expect(container.querySelector('.yh-stage')).toHaveAttribute('data-layout', 'split');
    const { header, grid, footer } = zones();
    expect(slots(header).map(([id]) => id)).toEqual(['bar']);
    expect(slots(grid)).toEqual([
      ['hero', 'Hero'],
      ['mixer', 'Mixer'],
      ['knobs', 'Knobs'],
      ['pads', 'Pads'],
      ['transport', 'Transport'],
    ]);
    expect(slots(footer)).toEqual([
      ['keys', 'Keyboard'],
      ['status', null],
    ]);
    expect(screen.queryByRole('region', { name: 'Song form' })).toBeNull();
    for (const name of SECTIONS) once(name);
  });

  it('shows the Tempo knob at the hero tempo in every fixture', () => {
    for (const fixture of [stageBoard, stageStopped]) {
      const { unmount } = setup(fixture);
      const bpm = fixture.display.nowPlaying.bpm;
      expect(region('Knobs').getByRole('button', { name: new RegExp(`^Knob \\d: Tempo.*\\b${bpm}\\b`) })).toBeInTheDocument();
      unmount();
    }
    expect(stageStopped.knobs.knobs.find((k) => k.label === 'Tempo')?.value).toBe('92');
  });

  it('has the mixer, eight knobs, sixteen pads in two rows of eight', () => {
    const { container } = setup();
    expect(region('Mixer').getAllByRole('slider')).toHaveLength(9);
    for (const name of ['Style volume, level 100', 'Multi Pad volume, level 90', 'Master, level 100']) once(name, 'slider');
    expect(region('Knobs').getAllByRole('button', { name: /^Knob [1-8]:/ }).length + container.querySelectorAll('.yh-knobbank__empty').length).toBe(8);
    expect(container.querySelectorAll('.yh-padbank__cell')).toHaveLength(16);
    expect(container.querySelector('.yh-padbank__pads')).toHaveAttribute('data-columns', '8');
  });

  it('has the pad banks Sections first, then Quick Racks, Chord, Multi Pads, Setup; the board on Sections', () => {
    setup();
    const tabs = region('Pads').getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Sections', 'Quick Racks', 'Chord', 'Multi Pads', 'Setup']);
    expect(region('Pads').getByRole('tab', { name: 'Sections' })).toHaveAttribute('aria-selected', 'true');
  });

  it('says whether the tempo is the style tempo: unavailable on the board at 104, available stopped at 92', () => {
    const { unmount } = setup();
    expect(screen.getByRole('button', { name: "Back to the style's tempo" })).toHaveAttribute('aria-disabled', 'true');
    unmount();
    setup(stageStopped);
    expect(screen.getByRole('button', { name: "Back to the style's tempo" })).not.toHaveAttribute('aria-disabled');
  });

  describe('the Sections pad bank', () => {
    const SECTION_IDS = ['intro1', 'intro2', 'intro3', 'mainA', 'mainB', 'mainC', 'mainD', 'ending1', 'ending2', 'ending3', 'break'] as const;
    /** The state the song form asks of a section, and the state the bank's pad wears. */
    function faces(container: HTMLElement, songForm: StageProps['songForm'], id: (typeof SECTION_IDS)[number]) {
      const index = SECTION_PAD_LAYOUT.findIndex((a) => 'section' in a && a.section === id);
      const cell = container.querySelector('.lib-assembled__slot[data-region="pads"]')!.querySelectorAll('.yh-padbank__cell')[index];
      return { asked: sectionPads(songForm)[index].state, pad: (cell.querySelector('.yh-pad') as HTMLElement).dataset.state };
    }
    const onSections = (songForm: StageProps['songForm']): Partial<StageProps> => ({ ...stageBoard, songForm });

    it('draws its pads from the song form in every state', () => {
      const forms: StageProps['songForm'][] = [
        stageBoard.songForm,
        stageStopped.songForm,
        { ...stageBoard.songForm, syncStart: false, syncStop: true, autoFill: true, next: 'ending1' },
        { ...stageStopped.songForm, playing: 'intro1', syncStart: true, absent: ['intro2', 'intro3', 'mainC', 'mainD', 'break'] },
      ];
      for (const songForm of forms) {
        const { container, unmount } = setup(onSections(songForm));
        for (const id of SECTION_IDS) {
          const face = faces(container, songForm, id);
          expect(face.asked, id).toBeTruthy();
          expect(face.pad, id).toBe(face.asked);
        }
        const transport = region('Transport');
        const pads = region('Pads');
        const pressed = (name: RegExp) => transport.getByRole('button', { name }).getAttribute('aria-pressed') === 'true';
        const state = (name: RegExp) => pads.getByRole('button', { name }).getAttribute('data-state');
        expect(state(/^Sync Start\b.*\(pad 4\)/)).toBe(pressed(/^Sync Start/) ? 'armed' : 'idle');
        expect(state(/^Sync Stop\b.*\(pad 15\)/)).toBe(pressed(/^Sync Stop/) ? 'armed' : 'idle');
        expect(state(/^Auto Fill\b.*\(pad 8\)/)).toBe(pressed(/^Auto Fill/) ? 'playing' : 'idle');
        expect(state(/^Start \/ Stop\b.*\(pad 16\)/)).toBe(pressed(/^Start \/ Stop/) ? 'running' : 'idle');
        unmount();
      }
    });

    it("matches PadBank's own board fixture for the board's song form", () => {
      const mine = sectionPads(songFormBoard);
      expect(mine.map(({ label, family, state, transport, tip }) => ({ label, family, state, transport: !!transport, tip }))).toEqual(
        padBankSections.map(({ label, family, state, transport, tip }) => ({ label, family, state, transport: !!transport, tip })),
      );
    });

    it('shows each section only on the pads, and each transport key once in the transport and once on the pads, which mirror the hardware', () => {
      setup();
      const pads = region('Pads');
      for (const name of SECTIONS) {
        expect(pads.getAllByRole('button', { name })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name })).toHaveLength(1);
      }
      for (const name of [/^Sync Start/, /^Sync Stop/, /^Auto Fill/, /^Start \/ Stop/]) {
        expect(region('Transport').getAllByRole('button', { name })).toHaveLength(1);
        expect(pads.getAllByRole('button', { name })).toHaveLength(1);
      }
      expect(pads.getAllByRole('button', { name: /^Tap tempo \(pad 14\)/ })).toHaveLength(1);
      expect(region('Hero').getAllByRole('button', { name: 'Tap tempo' })).toHaveLength(1);
    });

    it('sends a pad press where the same step or transport key sends it, and Tap to the hero', async () => {
      const songForm = {
        ...stageBoard.songForm,
        onSection: vi.fn(),
        onSyncStart: vi.fn(),
        onSyncStop: vi.fn(),
        onAutoFill: vi.fn(),
        onStartStop: vi.fn(),
      };
      const onTap = vi.fn();
      const onPress = vi.fn();
      setup({ ...stageBoard, songForm, display: { ...stageBoard.display, onTap }, pads: { ...stageBoard.pads, onPress } });
      const user = userEvent.setup();
      const pads = region('Pads');
      await user.click(pads.getByRole('button', { name: /^Main D \(pad 12\)/ }));
      expect(songForm.onSection.mock.calls).toEqual([['mainD']]);
      await user.click(pads.getByRole('button', { name: /^Break/ }));
      expect(songForm.onSection).toHaveBeenLastCalledWith('break');
      await user.click(pads.getByRole('button', { name: /^Intro III, not in this style/ }));
      expect(songForm.onSection).toHaveBeenCalledTimes(2);
      await user.click(pads.getByRole('button', { name: /^Sync Start/ }));
      expect(songForm.onSyncStart).toHaveBeenLastCalledWith(true);
      await user.click(pads.getByRole('button', { name: /^Sync Stop/ }));
      expect(songForm.onSyncStop).toHaveBeenLastCalledWith(true);
      await user.click(pads.getByRole('button', { name: /^Auto Fill/ }));
      expect(songForm.onAutoFill).toHaveBeenLastCalledWith(true);
      await user.click(pads.getByRole('button', { name: /^Start \/ Stop/ }));
      expect(songForm.onStartStop).toHaveBeenCalledTimes(1);
      await user.click(pads.getByRole('button', { name: /^Tap tempo/ }));
      expect(onTap).toHaveBeenCalledTimes(1);
      expect(onPress).not.toHaveBeenCalled();
    });

    it('presses each pad as its layout says, with the state it asks for', () => {
      const form = { syncStart: true, syncStop: false, autoFill: true, absent: ['mainD'] as const, onSection: vi.fn(), onSyncStart: vi.fn(), onSyncStop: vi.fn(), onAutoFill: vi.fn(), onStartStop: vi.fn(), onTap: vi.fn() };
      for (let i = 0; i < 16; i++) pressSectionPad(i, { ...form, absent: [...form.absent] });
      expect(form.onSection.mock.calls.flat()).toEqual(['intro1', 'intro2', 'intro3', 'ending1', 'ending2', 'ending3', 'mainA', 'mainB', 'mainC', 'break']);
      expect(form.onSyncStart).toHaveBeenCalledWith(false);
      expect(form.onAutoFill).toHaveBeenCalledWith(false);
      expect(form.onSyncStop).toHaveBeenCalledWith(true);
      expect(form.onStartStop).toHaveBeenCalledTimes(1);
      expect(form.onTap).toHaveBeenCalledTimes(1);
    });
  });

  it('times taps from the hero Tap and asks for their tempo', async () => {
    const onTempo = vi.fn();
    const onTap = vi.fn();
    const clock = vi.spyOn(performance, 'now');
    setup({ display: { ...stageBoard.display, onTempo, onTap } });
    const tap = screen.getByRole('button', { name: 'Tap tempo' });
    const user = userEvent.setup();
    for (const t of [1000, 1500, 2000]) {
      clock.mockReturnValue(t);
      await user.click(tap);
    }
    expect(onTap).toHaveBeenCalledTimes(3);
    expect(onTempo).toHaveBeenCalledTimes(2);
    expect(onTempo).toHaveBeenLastCalledWith(120);
  });

  it("draws the hero in its slot's form, at the board and the small screen", () => {
    for (const size of [{ width: 1920, height: 1080 }, { width: 1217, height: 752 }]) {
      const { unmount } = setup(size);
      const hero = slot(zones().grid, 'hero');
      expect(hero.querySelector('.yh-display')).toHaveAttribute('data-form', hero.dataset.form);
      unmount();
    }
  });

  it('puts the status line in the fixed footer under the keys, in both layouts', () => {
    for (const layout of ['stacked', 'split'] as const) {
      const { container, unmount } = setup({ ...stageStopped, layout });
      const status = container.querySelectorAll('.yh-status-line');
      expect(status).toHaveLength(1);
      expect(status[0].closest('[data-part="footer"]')).not.toBeNull();
      expect(status[0].closest('[data-part="grid"]')).toBeNull();
      expect(status[0]).toHaveTextContent('Style queued');
      unmount();
    }
  });

  it('renders the stopped board', () => {
    setup(stageStopped);
    expect(region('Hero').getByRole('img', { name: 'Stopped on Main A' })).toBeInTheDocument();
    once('Start / Stop, stopped');
    expect(screen.getByRole('button', { name: /Style queued/ })).toBeInTheDocument();
  });
});

describe('StagePlayground', () => {
  const play = () => render(<StagePlayground {...stageBoard} width={1440} height={900} tick={false} />);

  it('queues a section as next while running, and lands it on a second press', async () => {
    play();
    const user = userEvent.setup();
    const pads = region('Pads');
    await user.click(pads.getByRole('button', { name: /^Main D \(pad 12\)/ }));
    expect(pads.getByRole('button', { name: /^Main D, next/ })).toBeInTheDocument();
    expect(region('Hero').getByText('Main D')).toBeInTheDocument();
    await user.click(pads.getByRole('button', { name: /^Main D, next/ }));
    expect(pads.getByRole('button', { name: /^Main D, playing/ })).toBeInTheDocument();
    expect(region('Hero').getByRole('img', { name: /^Playing Main\sD$/ })).toBeInTheDocument();
  });

  it('plays the song from the Sections pads, its default bank', async () => {
    play();
    const user = userEvent.setup();
    const pads = region('Pads');
    expect(pads.getByRole('tab', { name: 'Sections' })).toHaveAttribute('aria-selected', 'true');
    const pad = (name: RegExp) => pads.getByRole('button', { name });
    expect(pad(/^Main B, playing/)).toHaveAttribute('data-state', 'playing');
    expect(pad(/^Main C, next/)).toHaveAttribute('data-state', 'next');
    // A pad queues the section, and the hero follows.
    await user.click(pad(/^Main D \(pad 12\)/));
    expect(region('Hero').getByText('Main D')).toBeInTheDocument();
    expect(pad(/^Main D, next/)).toHaveAttribute('data-state', 'next');
    expect(pad(/^Main C \(pad 11\)/)).toHaveAttribute('data-state', 'idle');
    // A second press lands it.
    await user.click(pad(/^Main D, next/));
    expect(pad(/^Main D, playing/)).toHaveAttribute('data-state', 'playing');
    // Start / Stop and Auto Fill from the pads change the transport's keys.
    await user.click(pad(/^Start \/ Stop, running/));
    expect(screen.getByRole('button', { name: 'Start / Stop, stopped' })).toBeInTheDocument();
    expect(pad(/^Main D, starts here/)).toHaveAttribute('data-state', 'idle');
    await user.click(pad(/^Auto Fill, off/));
    expect(region('Transport').getByRole('button', { name: 'Auto Fill' })).toHaveAttribute('aria-pressed', 'true');
    expect(pad(/^Auto Fill, on/)).toHaveAttribute('data-state', 'playing');
  });

  it('stops and starts the band', async () => {
    play();
    const user = userEvent.setup();
    const transport = region('Transport');
    await user.click(transport.getByRole('button', { name: /^Start \/ Stop, running/ }));
    expect(screen.getByRole('button', { name: 'Start / Stop, stopped' })).toBeInTheDocument();
    expect(region('Hero').getByRole('img', { name: /^Stopped on Main\sB$/ })).toBeInTheDocument();
    // Stopped, a section pad picks where the band starts.
    await user.click(region('Pads').getByRole('button', { name: /^Main A \(pad 9\)/ }));
    await user.click(screen.getByRole('button', { name: 'Start / Stop, stopped' }));
    expect(transport.getByRole('button', { name: /^Start \/ Stop, running/ })).toBeInTheDocument();
    expect(region('Hero').getByRole('img', { name: /^Playing Main\sA$/ })).toBeInTheDocument();
  });

  it('sets the tempo from taps, and the tempo keys step it', async () => {
    play();
    const user = userEvent.setup();
    const clock = vi.spyOn(performance, 'now');
    const tempo = () => screen.getByRole('spinbutton', { name: /^Tempo, / });
    for (const t of [0, 400, 800, 1200]) {
      clock.mockReturnValue(t);
      await user.click(screen.getByRole('button', { name: 'Tap tempo' }));
    }
    expect(tempo()).toHaveAttribute('aria-valuenow', '150');
    await user.click(screen.getByRole('button', { name: "Back to the style's tempo" }));
    expect(tempo()).toHaveAttribute('aria-valuenow', '104');
  });

  it('opens and closes the metronome popover, and applies One Touch', async () => {
    play();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^Metronome settings/ }));
    expect(screen.getByRole('dialog', { name: 'Metronome settings' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Metronome settings' })).toBeNull();
    await user.click(screen.getByRole('button', { name: /^Apply One Touch 3/ }));
    expect(screen.getByRole('button', { name: /^One Touch 3, applied/ })).toBeInTheDocument();
  });

  it('applies One Touch from the OTS pads, and the pads follow the hero', async () => {
    play();
    const user = userEvent.setup();
    const pads = region('Pads');
    await user.click(pads.getByRole('tab', { name: 'Quick Racks' }));
    const ots = (n: number) => pads.getByRole('button', { name: new RegExp(`^OTS\\s${n}\\b`) });
    // The seed's One Touch 2 lights OTS 2, not the bank's own lit OTS 1.
    expect(ots(2)).toHaveAttribute('data-state', 'playing');
    expect(ots(1)).toHaveAttribute('data-state', 'idle');
    await user.click(ots(3));
    expect(region('Hero').getByRole('button', { name: /^One Touch 3, applied/ })).toBeInTheDocument();
    expect(ots(3)).toHaveAttribute('data-state', 'playing');
    expect(ots(2)).toHaveAttribute('data-state', 'idle');
    await user.click(region('Hero').getByRole('button', { name: /^Apply One Touch 4/ }));
    expect(ots(4)).toHaveAttribute('data-state', 'playing');
    // A new style has none applied.
    await user.click(screen.getByRole('button', { name: 'Next style (Track right)' }));
    for (const n of [1, 2, 3, 4]) expect(ots(n)).toHaveAttribute('data-state', 'idle');
  });

  it('steps styles around both ends of the list', async () => {
    play();
    const user = userEvent.setup();
    const hero = region('Hero');
    const style = (name: string) => hero.getByRole('button', { name: `${name}: open the Browser` });
    await user.click(hero.getByRole('button', { name: 'Previous style (Track left)' }));
    expect(style('Waltz for Two')).toBeInTheDocument();
    expect(hero.getByText(/3\/4/)).toBeInTheDocument();
    await user.click(hero.getByRole('button', { name: 'Next style (Track right)' }));
    expect(style('Sunday Drive Pop')).toBeInTheDocument();
  });

  it("shows a seed style the list doesn't hold, and steps from it to either end", async () => {
    const seed = { ...stageBoard, display: { ...stageBoard.display, style: { ...stageBoard.display.style, name: 'Midnight Swing', timeSignature: '6/8' } } };
    const user = userEvent.setup();
    const { unmount } = render(<StagePlayground {...seed} width={1440} height={900} tick={false} />);
    const hero = () => region('Hero');
    expect(hero().getByRole('button', { name: 'Midnight Swing: open the Browser' })).toBeInTheDocument();
    await user.click(hero().getByRole('button', { name: 'Next style (Track right)' }));
    expect(hero().getByRole('button', { name: 'Sunday Drive Pop: open the Browser' })).toBeInTheDocument();
    unmount();
    render(<StagePlayground {...seed} width={1440} height={900} tick={false} />);
    await user.click(hero().getByRole('button', { name: 'Previous style (Track left)' }));
    expect(hero().getByRole('button', { name: 'Waltz for Two: open the Browser' })).toBeInTheDocument();
  });

  it('moves a fader and switches the layer', async () => {
    play();
    const user = userEvent.setup();
    const master = screen.getByRole('slider', { name: 'Master, level 100' });
    master.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('slider', { name: 'Master, level 99' })).toBeInTheDocument();
    await user.click(region('Mixer').getByRole('tab', { name: 'Reverb send' }));
    expect(screen.getByRole('slider', { name: 'Right 1 · Stage Grand, Reverb 40' })).toBeInTheDocument();
  });
});
