import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, type StageProps } from './Stage';
import { sectionPads as padBankSections } from '../PadBank/PadBank.fixtures';
import { songFormBoard } from '../SongForm/SongForm.fixtures';
import { stageBoard, stageSections, stageStopped } from './Stage.fixtures';
import { pressSectionPad, SECTION_PAD_LAYOUT, sectionPads } from './sectionPads';
import { StagePlayground } from './StagePlayground';

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
  return render(<Stage {...stageBoard} width={1440} height={900} {...props} />);
}

describe('Stage', () => {
  it('is a Screen: the app bar fixed on top, the regions in a named grid, the keys and status fixed at the foot', () => {
    const { container } = setup();
    expect(container.querySelector('.yh-stage')).toHaveAttribute('data-layout', 'stacked');
    const screenNode = screen.getByRole('group', { name: 'Stage' });
    const [header, grid, footer] = Array.from(screenNode.children) as HTMLElement[];
    expect([header, grid, footer].map((node) => node.dataset.part)).toEqual(['header', 'grid', 'footer']);
    expect(within(header).getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    expect(Array.from(grid.children).map((node) => [node.getAttribute('aria-label'), (node as HTMLElement).style.gridArea])).toEqual([
      ['Hero', 'hero'],
      ['Transport keys', 'transport'],
      ['Song form strip', 'form'],
      ['Mixer', 'mixer'],
      ['Knobs', 'knobs'],
      ['Pads', 'pads'],
    ]);
    expect(grid.style.gridTemplateAreas).toBe('"hero transport" "form form" "mixer knobs" "mixer pads"');
    expect(within(footer).getByRole('region', { name: 'Keyboard' })).toBeInTheDocument();
    expect(footer.querySelector('.yh-status-line')).not.toBeNull();
    expect(within(grid).getByRole('region', { name: 'Hero' })).toContainElement(screen.getByRole('region', { name: 'Stage display' }));
    expect(within(grid).getByRole('region', { name: 'Transport keys' })).toContainElement(screen.getByRole('region', { name: 'Transport' }));
    expect(within(grid).getByRole('region', { name: 'Song form strip' })).toContainElement(screen.getByRole('region', { name: 'Song form' }));
    expect(screen.queryByRole('region', { name: 'Song form and transport' })).toBeNull();
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
    for (const name of ['Hero', 'Stage display', 'Song form', 'Transport', 'Mixer', 'Knobs', 'Pads', 'Keyboard']) {
      expect(within(stage).getAllByRole('region', { name })).toHaveLength(1);
    }
    expect(stage.querySelectorAll('.yh-keys')).toHaveLength(1);
    expect(stage.querySelectorAll('.yh-status-line')).toHaveLength(1);
  });

  it('has every page once, in the app bar', () => {
    setup();
    const nav = within(screen.getByRole('navigation', { name: 'Pages' }));
    for (const page of ['Stage', 'Channel', 'Effects', 'Quick Racks', 'Multi Pads', 'Looper', 'Harm/Arp', 'Library', 'Settings']) {
      expect(nav.getAllByRole('button', { name: page })).toHaveLength(1);
    }
    expect(nav.getByRole('button', { name: 'Stage' })).toHaveAttribute('aria-current', 'page');
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
    const hero = region('Stage display');
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
    expect(region('Stage display').queryByRole('list', { name: 'Sounds' })).toBeNull();
    const faders = region('Mixer');
    for (const name of ['Right 1, Stage Grand: open Channel', 'Right 2, Silk Strings, edited: open Channel', 'Left, Finger Bass: open Channel']) {
      expect(faders.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  const SECTIONS = [/^Intro I\b(?!I)/, /^Intro II\b(?!I)/, /^Intro III/, /^Main A/, /^Main B/, /^Main C/, /^Main D/, /^Ending I\b(?!I)/, /^Ending II\b(?!I)/, /^Ending III/, /^Break/];
  const TRANSPORT = [/^Start \/ Stop/, /^Sync Start/, 'Sync Stop', 'Auto Fill', /^Fill Up/, /^Fill Down/, /^Fade\b/, /^Section reset/, 'Accomp (ACMP)'];

  it('has every section once, in the song form strip, and every transport key once, beside the hero', () => {
    setup();
    const form = region('Song form');
    for (const name of SECTIONS) {
      once(name);
      expect(form.getByRole('button', { name })).toBeInTheDocument();
    }
    const transport = region('Transport');
    for (const name of TRANSPORT) {
      once(name);
      expect(transport.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('split: the song form over the transport beside the hero, each key once', () => {
    const { container } = setup({ layout: 'split' });
    expect(container.querySelector('.yh-stage')).toHaveAttribute('data-layout', 'split');
    expect(container.querySelector('.yh-stage__strip')).toBeNull();
    const grid = container.querySelector('[data-part="grid"]') as HTMLElement;
    expect(grid.style.gridTemplateAreas).toBe('"hero form" "mixer knobs" "mixer pads"');
    const outer = screen.getByRole('region', { name: 'Form and transport' });
    expect(outer.style.gridArea).toBe('form');
    const form = within(within(outer).getByRole('region', { name: 'Song form and transport' }));
    for (const name of [...SECTIONS, ...TRANSPORT]) {
      once(name);
      expect(form.getByRole('button', { name })).toBeInTheDocument();
    }
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

  it('has the pad banks Sections first, then Quick Racks, Chord, Multi Pads, Setup; the board on Quick Racks', () => {
    setup();
    const tabs = region('Pads').getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Sections', 'Quick Racks', 'Chord', 'Multi Pads', 'Setup']);
    expect(region('Pads').getByRole('tab', { name: 'Quick Racks' })).toHaveAttribute('aria-selected', 'true');
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
    /** The strip's step and the bank's pad for one section: the same Pad face on both. */
    function faces(container: HTMLElement, id: (typeof SECTION_IDS)[number]) {
      const strip = container.querySelector(`.yh-stage__strip [data-section="${id}"] .yh-pad`) as HTMLElement;
      const index = SECTION_PAD_LAYOUT.findIndex((a) => 'section' in a && a.section === id);
      const cell = container.querySelectorAll('.yh-stage__pads .yh-padbank__cell')[index];
      return { strip: strip.dataset.state, pad: (cell.querySelector('.yh-pad') as HTMLElement).dataset.state };
    }
    const onSections = (songForm: StageProps['songForm']): Partial<StageProps> => ({ ...stageSections, songForm });

    it('draws its pads from the song form, so they agree with the strip in every state', () => {
      const forms: StageProps['songForm'][] = [
        stageBoard.songForm,
        stageStopped.songForm,
        { ...stageBoard.songForm, syncStart: false, syncStop: true, autoFill: true, next: 'ending1' },
        { ...stageStopped.songForm, playing: 'intro1', syncStart: true, absent: ['intro2', 'intro3', 'mainC', 'mainD', 'break'] },
      ];
      for (const songForm of forms) {
        const { container, unmount } = setup(onSections(songForm));
        for (const id of SECTION_IDS) {
          const face = faces(container, id);
          expect(face.strip, id).toBeTruthy();
          expect(face.pad, id).toBe(face.strip);
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

    it('shows each section and transport key once in its own region and once on the pads, which mirror the hardware', () => {
      setup(stageSections);
      const form = region('Song form');
      const pads = region('Pads');
      for (const name of SECTIONS) {
        expect(form.getAllByRole('button', { name })).toHaveLength(1);
        expect(pads.getAllByRole('button', { name })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name })).toHaveLength(2);
      }
      for (const name of [/^Sync Start/, /^Sync Stop/, /^Auto Fill/, /^Start \/ Stop/]) {
        expect(region('Transport').getAllByRole('button', { name })).toHaveLength(1);
        expect(pads.getAllByRole('button', { name })).toHaveLength(1);
      }
      expect(pads.getAllByRole('button', { name: /^Tap tempo \(pad 14\)/ })).toHaveLength(1);
      expect(region('Stage display').getAllByRole('button', { name: 'Tap tempo' })).toHaveLength(1);
    });

    it('sends a pad press where the same step or key in the strip and transport sends it, and Tap to the hero', async () => {
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
      setup({ ...stageSections, songForm, display: { ...stageBoard.display, onTap }, pads: { ...stageSections.pads, onPress } });
      const user = userEvent.setup();
      const pads = region('Pads');
      await user.click(pads.getByRole('button', { name: /^Main D \(pad 12\)/ }));
      await user.click(region('Song form').getByRole('button', { name: 'Main D' }));
      expect(songForm.onSection.mock.calls).toEqual([['mainD'], ['mainD']]);
      await user.click(pads.getByRole('button', { name: /^Break/ }));
      expect(songForm.onSection).toHaveBeenLastCalledWith('break');
      await user.click(pads.getByRole('button', { name: /^Intro III, not in this style/ }));
      expect(songForm.onSection).toHaveBeenCalledTimes(3);
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

  describe('fitting the frame', () => {
    afterEach(() => vi.unstubAllGlobals());

    /** A frame of `frame` px and a screen whose content needs `need` px of height per hero density. */
    function measure(frame: { w: number; h: number }, need: { full: number; compact: number }) {
      const observers: { fit: () => void; nodes: Element[] }[] = [];
      vi.stubGlobal(
        'ResizeObserver',
        class {
          nodes: Element[] = [];
          constructor(fit: () => void) {
            observers.push({ fit, nodes: this.nodes });
          }
          observe(node: Element) {
            this.nodes.push(node);
          }
          disconnect() {}
        },
      );
      // The grid's room is `frame` (what the header and footer leave); a cleared grid fills it.
      const isGrid = (node: Element) => node.classList.contains('lib-screen__grid');
      const px = (node: Element, side: 'width' | 'height') => parseFloat((node as HTMLElement).style[side]) || 0;
      const box = (node: Element, side: 'width' | 'height') => px(node, side) || (side === 'width' ? frame.w : frame.h);
      vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
        return isGrid(this) ? box(this, 'width') : 0;
      });
      vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
        return isGrid(this) ? box(this, 'height') : 0;
      });
      vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
        return isGrid(this) ? box(this, 'width') : 0;
      });
      vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
        if (!isGrid(this)) return 0;
        return (this.closest('.yh-stage') as HTMLElement).dataset.hero === 'compact' ? need.compact : need.full;
      });
      return { refit: () => act(() => observers.forEach((o) => o.fit())), observed: () => observers.flatMap((o) => o.nodes) };
    }
    const fit = () => ({
      zoom: (document.querySelector('.yh-stage') as HTMLElement).dataset.zoom,
      hero: screen.getByRole('region', { name: 'Stage display' }).getAttribute('data-density'),
    });

    it('tightens the hero before it zooms, at the 1217 × 752 screen', () => {
      measure({ w: 1217, h: 752 }, { full: 800, compact: 740 });
      render(<Stage {...stageBoard} />);
      expect(fit()).toEqual({ zoom: '1.000', hero: 'compact' });
    });

    it('keeps the full hero where the screen has the height', () => {
      measure({ w: 1440, h: 900 }, { full: 860, compact: 800 });
      render(<Stage {...stageBoard} />);
      expect(fit()).toEqual({ zoom: '1.000', hero: 'full' });
    });

    it('refits when the content grows, and gives the hero back its room when the frame does', () => {
      const frame = { w: 1217, h: 752 };
      const need = { full: 800, compact: 740 };
      const { refit, observed } = measure(frame, need);
      const { container } = render(<Stage {...stageBoard} />);
      // The header, the footer and each region are watched, not only the frame: the fit sets the grid's own box.
      expect(observed()).toContain(container.querySelector('[data-part="header"]'));
      expect(observed()).toContain(container.querySelector('[data-part="footer"]'));
      expect(observed()).toContain(screen.getByRole('region', { name: 'Hero' }));
      expect(observed()).toContain(screen.getByRole('region', { name: 'Pads' }));
      need.compact = 940;
      refit();
      expect(fit()).toEqual({ zoom: '0.800', hero: 'compact' });
      Object.assign(frame, { w: 1440, h: 900 });
      refit();
      expect(fit()).toEqual({ zoom: '1.000', hero: 'full' });
    });

    it('retries the full hero once when the content shrinks in the same frame', () => {
      const need = { full: 800, compact: 740 };
      const { refit } = measure({ w: 1217, h: 752 }, need);
      render(<Stage {...stageBoard} />);
      expect(fit()).toEqual({ zoom: '1.000', hero: 'compact' });
      // A denser pack: the rows shrink, but full still overflows, so the hero settles compact.
      Object.assign(need, { full: 780, compact: 720 });
      refit();
      expect(fit()).toEqual({ zoom: '1.000', hero: 'compact' });
      refit();
      expect(fit()).toEqual({ zoom: '1.000', hero: 'compact' });
      // Denser still: now full fits.
      Object.assign(need, { full: 740, compact: 690 });
      refit();
      expect(fit()).toEqual({ zoom: '1.000', hero: 'full' });
    });
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
    expect(region('Stage display').getByRole('img', { name: 'Stopped on Main A' })).toBeInTheDocument();
    once('Start / Stop, stopped');
    expect(screen.getByRole('button', { name: /Style queued/ })).toBeInTheDocument();
  });
});

describe('StagePlayground', () => {
  const play = () => render(<StagePlayground {...stageBoard} width={1440} height={900} tick={false} />);

  it('queues a section as next while running, and lands it on a second press', async () => {
    play();
    const user = userEvent.setup();
    const form = region('Song form');
    await user.click(form.getByRole('button', { name: 'Main D' }));
    expect(form.getByRole('button', { name: /^Main D, next/ })).toBeInTheDocument();
    expect(region('Stage display').getByText('Main D')).toBeInTheDocument();
    await user.click(form.getByRole('button', { name: /^Main D, next/ }));
    expect(form.getByRole('button', { name: 'Main D, playing' })).toBeInTheDocument();
    expect(region('Stage display').getByRole('img', { name: /^Playing Main\sD$/ })).toBeInTheDocument();
  });

  it('plays the song from the Sections pads exactly as from the strip', async () => {
    play();
    const user = userEvent.setup();
    const pads = region('Pads');
    await user.click(pads.getByRole('tab', { name: 'Sections' }));
    const pad = (name: RegExp) => pads.getByRole('button', { name });
    expect(pad(/^Main B, playing/)).toHaveAttribute('data-state', 'playing');
    expect(pad(/^Main C, next/)).toHaveAttribute('data-state', 'next');
    // A pad queues as the strip's step does, and the strip and the hero follow.
    await user.click(pad(/^Main D \(pad 12\)/));
    expect(region('Song form').getByRole('button', { name: /^Main D, next/ })).toBeInTheDocument();
    expect(pad(/^Main D, next/)).toHaveAttribute('data-state', 'next');
    expect(pad(/^Main C \(pad 11\)/)).toHaveAttribute('data-state', 'idle');
    // The strip lands it, and the pad shows it playing.
    await user.click(region('Song form').getByRole('button', { name: /^Main D, next/ }));
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
    await user.click(screen.getByRole('button', { name: /^Start \/ Stop, running/ }));
    expect(screen.getByRole('button', { name: 'Start / Stop, stopped' })).toBeInTheDocument();
    expect(region('Stage display').getByRole('img', { name: /^Stopped on Main\sB$/ })).toBeInTheDocument();
    // Stopped, a section press picks where the band starts.
    await user.click(screen.getByRole('button', { name: 'Main A' }));
    await user.click(screen.getByRole('button', { name: 'Start / Stop, stopped' }));
    expect(screen.getByRole('button', { name: /^Start \/ Stop, running/ })).toBeInTheDocument();
    expect(region('Stage display').getByRole('img', { name: /^Playing Main\sA$/ })).toBeInTheDocument();
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
    const ots = (n: number) => pads.getByRole('button', { name: new RegExp(`^OTS\\s${n}\\b`) });
    // The seed's One Touch 2 lights OTS 2, not the bank's own lit OTS 1.
    expect(ots(2)).toHaveAttribute('data-state', 'playing');
    expect(ots(1)).toHaveAttribute('data-state', 'idle');
    await user.click(ots(3));
    expect(region('Stage display').getByRole('button', { name: /^One Touch 3, applied/ })).toBeInTheDocument();
    expect(ots(3)).toHaveAttribute('data-state', 'playing');
    expect(ots(2)).toHaveAttribute('data-state', 'idle');
    await user.click(region('Stage display').getByRole('button', { name: /^Apply One Touch 4/ }));
    expect(ots(4)).toHaveAttribute('data-state', 'playing');
    // A new style has none applied.
    await user.click(screen.getByRole('button', { name: 'Next style (Track right)' }));
    for (const n of [1, 2, 3, 4]) expect(ots(n)).toHaveAttribute('data-state', 'idle');
  });

  it('steps styles around both ends of the list', async () => {
    play();
    const user = userEvent.setup();
    const hero = region('Stage display');
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
    const hero = () => region('Stage display');
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
