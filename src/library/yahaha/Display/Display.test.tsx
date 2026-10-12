import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeScope } from '../../theme';
import { packs } from '../../themes/packs';
import { FormProvider } from '../../layout/assembly/forms';
import { principlesFor, resolveNeed } from '../../layout/assembly/units';
import { DISPLAY_CAPS, DISPLAY_FORMS, DISPLAY_GROWTH, Display, type DisplayForm, type DisplayProps } from './Display';
import {
  displayBoard,
  displayLongFingering,
  displayLooping,
  displayNoParts,
  displayPartOff,
  displayStopped,
  displaySyncStart,
  displayThreeFour,
} from './Display.fixtures';

function setup(props: Partial<DisplayProps> = {}) {
  const calls = {
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onBrowse: vi.fn(),
    onOneTouch: vi.fn(),
    onSound: vi.fn(),
    onTempoUp: vi.fn(),
    onTempoDown: vi.fn(),
    onTempo: vi.fn(),
    onTap: vi.fn(),
    onStyleTempo: vi.fn(),
  };
  const view = render(<Display {...displayBoard} {...calls} {...props} />);
  return { ...view, calls };
}

const beatStates = (root: HTMLElement) => [...root.querySelectorAll('.yh-bar-beat__segment[data-state]')].map((b) => b.getAttribute('data-state'));

describe('Display', () => {
  it('names itself and its regions', () => {
    setup();
    const display = document.querySelector<HTMLElement>('.yh-display')!;
    expect(within(display).getByRole('group', { name: 'Style' })).toBeInTheDocument();
    expect(within(display).getByRole('group', { name: 'Section' })).toBeInTheDocument();
    expect(within(display).getByRole('group', { name: 'Tempo and Tap' })).toBeInTheDocument();
    expect(within(display).getByRole('img', { name: 'Playing Main B' })).toBeInTheDocument();
    expect(within(display).getByRole('img', { name: 'Chord Am7: A C E G, Fingered On Bass' })).toBeInTheDocument();
    expect(within(display).getByRole('img', { name: 'Beat 2 of 4' })).toBeInTheDocument();
    expect(within(display).getByRole('list', { name: 'Sounds' })).toBeInTheDocument();
  });

  it('steps and browses styles, and applies a One Touch', async () => {
    const user = userEvent.setup();
    const { calls } = setup();
    await user.click(screen.getByRole('button', { name: 'Previous style (Track left)' }));
    await user.click(screen.getByRole('button', { name: 'Next style (Track right)' }));
    await user.click(screen.getByRole('button', { name: 'Sunday Drive Pop: open the Browser' }));
    expect(calls.onPrev).toHaveBeenCalledOnce();
    expect(calls.onNext).toHaveBeenCalledOnce();
    expect(calls.onBrowse).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /^One Touch 2, applied/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /^Apply One Touch 3/ }));
    expect(calls.onOneTouch).toHaveBeenCalledWith(3);
  });

  it('opens a part\'s sound list, with the marks in its name', async () => {
    const user = userEvent.setup();
    const { calls } = setup();
    await user.click(screen.getByRole('button', { name: /^Left sound: 33 Finger Bass/ }));
    expect(calls.onSound).toHaveBeenCalledWith('l');
    expect(screen.getByRole('button', { name: 'Right 3 sound: 57 Brass Section, off, plugin missing. Opens the quick sound list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Right 2 sound: 41 Silk Strings, edited/ })).toBeInTheDocument();
  });

  it('wires each part row to the tooltip action and tears it down', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { unmount } = render(<Display {...displayBoard} tipAction={tipAction} />);
    const rows = displayBoard.parts!.length;
    const partCalls = tipAction.mock.calls.filter((c: unknown[]) => c[1] === 'launchkey.fader_sound');
    expect(partCalls).toHaveLength(rows);
    const before = destroy.mock.calls.length;
    unmount();
    expect(destroy.mock.calls.length - before).toBeGreaterThanOrEqual(rows);
  });

  it('marks an off part and drops the parts column when none are given', () => {
    const { unmount } = render(<Display {...displayPartOff} />);
    const r1 = screen.getByRole('button', { name: /^Right 1 sound/ });
    expect(r1).toHaveAttribute('data-off', 'true');
    // The name and "off" in their own spans (the " · " between them is CSS), so a one-row strip can drop the name.
    expect(r1.querySelector('.yh-display__part-label')).toHaveTextContent('Right 1');
    expect(r1.querySelector('.yh-display__part-tail')).toHaveTextContent('off');
    unmount();
    render(<Display {...displayNoParts} />);
    expect(screen.queryByRole('list', { name: 'Sounds' })).toBeNull();
    expect(document.querySelector<HTMLElement>('.yh-display')!).not.toHaveAttribute('data-parts');
  });

  it('changes the tempo: + and − as holds, keys and wheel on the number, the style tempo two ways', async () => {
    const { calls } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Tempo up (Scene Launch)' }), { detail: 0 });
    expect(calls.onTempoUp).toHaveBeenNthCalledWith(1, true);
    expect(calls.onTempoUp).toHaveBeenNthCalledWith(2, false);
    fireEvent.click(screen.getByRole('button', { name: 'Tempo down (Function)' }), { detail: 0 });
    expect(calls.onTempoDown).toHaveBeenNthCalledWith(1, true);
    const tempo = screen.getByRole('spinbutton');
    expect(tempo).toHaveAttribute('aria-valuenow', '104');
    fireEvent.keyDown(tempo, { key: 'ArrowUp' });
    expect(calls.onTempo).toHaveBeenLastCalledWith(105);
    fireEvent.wheel(tempo, { deltaY: 100 });
    expect(calls.onTempo).toHaveBeenLastCalledWith(103);
    fireEvent.doubleClick(tempo);
    expect(calls.onStyleTempo).toHaveBeenCalledOnce();
    await userEvent.setup().click(screen.getByRole('button', { name: "Back to the style's tempo" }));
    expect(calls.onStyleTempo).toHaveBeenCalledTimes(2);
  });

  it('taps once per press: on pointer down, and once from the keyboard', async () => {
    const user = userEvent.setup();
    const { calls } = setup();
    const tap = within(screen.getByRole('group', { name: 'Tempo and Tap' })).getByRole('button', { name: 'Tap tempo' });
    fireEvent.pointerDown(tap, { button: 0, pointerId: 1 });
    expect(calls.onTap).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(tap, { button: 0, pointerId: 1 });
    fireEvent.click(tap, { detail: 1 });
    expect(calls.onTap).toHaveBeenCalledTimes(1);
    tap.focus();
    await user.keyboard('{Enter}');
    expect(calls.onTap).toHaveBeenCalledTimes(2);
  });

  it('has one Tap', () => {
    setup();
    expect(screen.getAllByRole('button', { name: /tap/i })).toHaveLength(1);
  });

  it('running: the section live, one "then" tab docked under it with what is next and when, the beat lit', () => {
    const { container } = setup();
    expect(container.querySelector('.yh-display__now')).toHaveAttribute('data-live', 'true');
    const tabs = container.querySelectorAll('.yh-display__then');
    expect(tabs).toHaveLength(1);
    const then = tabs[0] as HTMLElement;
    expect(then.textContent).toBe('then Main Cfill after bar 4');
    expect(then).toHaveAttribute('data-docked', 'true');
    // The next role, from hues.ts, on its arrow; "Main C" said once in the hero.
    expect(then.style.getPropertyValue('--yh-display-then-hue')).toBe('var(--accent)');
    expect(within(document.querySelector<HTMLElement>('.yh-display')!).getAllByText('Main C')).toHaveLength(1);
    expect(beatStates(container)).toEqual(['past', 'current', 'future', 'future']);
  });

  it('draws no captions: the readouts name themselves', () => {
    const { container } = setup();
    expect(container.querySelector('.yh-display__caption')).toBeNull();
    expect(container.querySelector('.yh-chord-readout__label')).toBeNull();
    for (const word of ['Section', 'Tempo']) expect(screen.queryByText(word)).toBeNull();
  });

  it('puts the beat cells under the tempo, with Tap and Style tempo', () => {
    setup();
    const tempo = screen.getByRole('group', { name: 'Tempo and Tap' });
    expect(within(tempo).getByRole('img', { name: 'Beat 2 of 4' })).toBeInTheDocument();
    const key = within(tempo).getByRole('button', { name: "Back to the style's tempo" });
    expect(key).toHaveTextContent('Style tempo');
    expect(key).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText('Reset')).toBeNull();
  });

  it('at the style tempo, the Style tempo key is unavailable but still focusable', async () => {
    const { calls, rerender } = setup({ nowPlaying: { ...displayBoard.nowPlaying, styleTempo: 104 } });
    const key = within(screen.getByRole('group', { name: 'Tempo and Tap' })).getByRole('button', { name: "Back to the style's tempo" });
    expect(key).toHaveAttribute('aria-disabled', 'true');
    key.focus();
    expect(key).toHaveFocus();
    await userEvent.setup().click(key);
    expect(calls.onStyleTempo).not.toHaveBeenCalled();
    // Off the style's tempo, it presses again.
    rerender(<Display {...displayBoard} {...calls} nowPlaying={{ ...displayBoard.nowPlaying, styleTempo: 92 }} />);
    expect(key).not.toHaveAttribute('aria-disabled');
    await userEvent.setup().click(key);
    expect(calls.onStyleTempo).toHaveBeenCalledOnce();
  });

  it('steps the readouts down together until a long section fits, and drops the genre · metre before the name is cut', () => {
    // Pretend the readouts need 120px more than they have at full size, 70px at 0.9, and fit at 0.8;
    // and that the style's name is cut while the metre is shown.
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('yh-display__readouts')) {
        const fit = (this.closest('.yh-display__frame') as HTMLElement).dataset.fit;
        return 500 + (fit === '1' ? 120 : fit === '0.9' ? 70 : 0);
      }
      if (this.classList.contains('yh-accentblock__text')) {
        const style = this.closest('.yh-display__style') as HTMLElement;
        return style.dataset.meta === 'dropped' ? 100 : 160;
      }
      return 0;
    });
    const client = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('yh-display__readouts')) return 500;
      if (this.classList.contains('yh-accentblock__text')) return 120;
      return 0;
    });
    try {
      const { container } = render(<Display {...displayBoard} nowPlaying={{ ...displayBoard.nowPlaying, playing: 'Ending III' }} />);
      expect(container.querySelector('.yh-display__frame')).toHaveAttribute('data-fit', '0.8');
      expect(container.querySelector('.yh-display__style')).toHaveAttribute('data-meta', 'dropped');
    } finally {
      scroll.mockRestore();
      client.mockRestore();
    }
  });

  it('keeps the genre · metre and the full section size when they fit', () => {
    const { container } = render(<Display {...displayBoard} />);
    expect(container.querySelector('.yh-display__frame')).toHaveAttribute('data-fit', '1');
    expect(container.querySelector('.yh-display__style')).not.toHaveAttribute('data-meta');
    expect(screen.getByText('Pop & Rock · 4/4')).toBeInTheDocument();
  });

  it('header: the style name without a chevron between ‹ and ›', () => {
    const { container } = setup();
    expect(container.querySelector('.yh-display__style .yh-accentblock__chevron')).toBeNull();
  });

  it('gives sections no hue', () => {
    const { container } = setup();
    for (const el of container.querySelectorAll('.yh-section-name, .yh-bar-beat')) {
      // The primitive's default (or none, once the primitives drop section kinds), never a kind passed in from here.
      expect(['main', null]).toContain(el.getAttribute('data-hue'));
    }
  });

  it('looping with nothing queued: no tab and no "bar 2 of 8" (the beat cells say where the bar is)', () => {
    const { container } = render(<Display {...displayLooping} />);
    expect(container.querySelector('.yh-display__next')).toBeNull();
    expect(screen.queryByText(/bar 2 of 8/)).toBeNull();
  });

  it('stopped: "Stopped", the queued style, no live block, the beat at rest', () => {
    const { container } = render(<Display {...displayStopped} />);
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Stopped on Main A' })).not.toHaveAttribute('data-live');
    expect(screen.getByText('Coastal Highway')).toHaveAttribute('data-hue', 'a');
    expect(screen.queryByText('Pop & Rock · 4/4')).toBeNull();
    expect(screen.getByRole('img', { name: 'Chord Cmaj7, held: C E G B, Fingered' })).toBeInTheDocument();
    expect(beatStates(container)).toEqual(['future', 'future', 'future', 'future']);
    expect(screen.getByRole('button', { name: /^Apply One Touch 4/ })).toBeDisabled();
  });

  it('stopped with a beat still set draws the bar at rest', () => {
    const { container } = render(<Display {...displayStopped} nowPlaying={{ ...displayStopped.nowPlaying, beat: 3 }} />);
    expect(beatStates(container)).toEqual(['future', 'future', 'future', 'future']);
  });

  it('Sync Start armed, then what starts', () => {
    const { container } = render(<Display {...displaySyncStart} />);
    expect((container.querySelector('.yh-display__next') as HTMLElement).textContent).toBe('Sync Start armedthen Intro II');
    expect(container.querySelector('.yh-display__then')).not.toHaveAttribute('data-docked');
  });

  it('a waltz: three beats, on the third; the metre in the header', () => {
    const { container } = render(<Display {...displayThreeFour} />);
    expect(beatStates(container)).toEqual(['past', 'past', 'current']);
    expect(screen.getByText('Ballroom · 3/4')).toBeInTheDocument();
  });

  it('a long fingering stays whole in the chord\'s name', () => {
    render(<Display {...displayLongFingering} />);
    expect(screen.getByRole('img', { name: /AI Full Keyboard · played Cm7 \(Keyboard transpose −3\)$/ })).toBeInTheDocument();
  });

  it('an empty style name reads "No style"', () => {
    render(<Display {...displayBoard} style={{ ...displayBoard.style, name: '  ' }} />);
    expect(screen.getByRole('button', { name: 'No style: open the Browser' })).toBeInTheDocument();
  });

  it('marks its density: auto by default, compact or full when asked', () => {
    const { rerender } = render(<Display {...displayBoard} />);
    const display = () => document.querySelector<HTMLElement>('.yh-display')!;
    expect(display()).toHaveAttribute('data-density', 'auto');
    rerender(<Display {...displayBoard} density="compact" />);
    expect(display()).toHaveAttribute('data-density', 'compact');
    rerender(<Display {...displayBoard} density="full" />);
    expect(display()).toHaveAttribute('data-density', 'full');
  });

  it('sizes the readouts through the primitives\' own options, from the hero\'s variables', () => {
    const { container } = render(<Display {...displayBoard} density="compact" />);
    const style = (sel: string) => (container.querySelector(sel) as HTMLElement).style;
    expect(style('.yh-section-name').getPropertyValue('--yh-section-name-size')).toBe('var(--yh-display-section)');
    expect(style('.yh-chord-readout').getPropertyValue('--yh-chord-readout-hero')).toBe('var(--yh-display-chord)');
    expect(style('.yh-tempo-readout').getPropertyValue('--yh-tempo-readout-size')).toBe('var(--yh-display-tempo)');
    expect(style('.yh-bar-beat').getPropertyValue('--yh-bar-beat-line')).toBe('var(--yh-display-beat-line)');
  });

  it('scales the readouts on both axes from the numeral size, each with its own cap per form, as Display.forms.ts says', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Display.css'), 'utf8');
    expect(css).toMatch(/container:\s*yh-display\s*\/\s*size/);
    // The share of the room past the least, per axis: the same factors as DISPLAY_GROWTH.
    for (const r of ['section', 'tempo', 'chord'] as const) {
      const m = new RegExp(
        `--yh-display-${r}: calc\\(clamp\\(var\\(--size-numeral\\), min\\(var\\(--size-numeral\\) \\+ var\\(--yh-display-room-w\\) \\* ([\\d.]+), var\\(--size-numeral\\) \\+ var\\(--yh-display-room-h\\) \\* ([\\d.]+)\\), var\\(--yh-display-cap-${r}\\)\\) \\* var\\(--yh-display-fit\\)\\);`,
      ).exec(css);
      expect(m, r).not.toBeNull();
      expect([Number(m![1]), Number(m![2])], r).toEqual([DISPLAY_GROWTH.w[r], DISPLAY_GROWTH.h[r]]);
    }
    expect(css).toMatch(/--yh-display-room-w: calc\(100cqi - var\(--yh-display-min-w\)\);/);
    expect(css).toMatch(/--yh-display-room-h: calc\(100cqh - var\(--yh-display-min-h\)\);/);
    // Each form's caps, as DISPLAY_CAPS, ranked section > tempo > chord.
    for (const id of ['full', 'compact', 'minimal'] as const) {
      const block = new RegExp(`\\.yh-display\\[data-form='${id}'\\] \\.yh-display__frame \\{([^}]*)\\}`).exec(css)![1];
      const caps = (['section', 'tempo', 'chord'] as const).map((n) => Number(new RegExp(`--yh-display-cap-${n}: calc\\(var\\(--size-numeral\\) \\* ([\\d.]+)\\)`).exec(block)![1]));
      expect(caps, id).toEqual([DISPLAY_CAPS[id].section, DISPLAY_CAPS[id].tempo, DISPLAY_CAPS[id].chord]);
      expect(caps[0]).toBeGreaterThan(caps[1]);
      expect(caps[1]).toBeGreaterThan(caps[2]);
    }
    // At numeral 32: full 96 / 84 / 72, compact 60 / 52 / 44.
    expect(Object.values(DISPLAY_CAPS.full).map((k) => k * 32)).toEqual([96, 84, 72]);
    expect(Object.values(DISPLAY_CAPS.compact).map((k) => k * 32)).toEqual([60, 52, 44]);
    // Never below the form's least.
    expect(css).toMatch(/\.yh-display \{[^}]*min-width: var\(--yh-display-min-w\);[^}]*min-height: var\(--yh-display-min-h\);/);
    // The primitives' own size variables are set only through their options, never overridden here.
    expect(css).not.toMatch(/--yh-(chord-readout-hero|tempo-readout-size|section-name-size|bar-beat-line|bar-beat-lit)\s*:/);
  });

  it('keeps every readout whole: the section never cut, the chord column a fingering wide, cells never over the header', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Display.css'), 'utf8');
    expect(css).toMatch(/\.yh-display__readouts \{[^}]*align-content:\s*safe center/);
    expect(css).toMatch(/grid-template-columns:\s*max-content minmax\(var\(--yh-display-chord-w\), 1fr\) max-content;/);
    expect(css).toMatch(/--yh-display-chord-w: max\(calc\(var\(--yh-display-chord\) \* 1\.8\), calc\(var\(--size-label\) \* 9\.6\)\);/);
    expect(css).toMatch(/@container yh-display \(min-width: 900px\) \{\s*\.yh-display\[data-parts\]:not\(\[data-form='minimal'\]\) \.yh-display__readouts \{[^}]*minmax\(calc\(var\(--control-h\) \* 6\), 0\.8fr\)/);
    expect(css).toMatch(/\.yh-chord-readout__fingering \{[^}]*white-space:\s*nowrap;[^}]*text-overflow:\s*ellipsis/);
    // The notes are never dropped.
    expect(css).not.toMatch(/\.yh-chord-readout__tones \{\s*display:\s*none/);
    // No faint text, no mono.
    expect(css).not.toMatch(/--text-4|--font-mono/);
  });

  describe('forms', () => {
    const display = () => document.querySelector<HTMLElement>('.yh-display')!;

    it('declares full, compact and minimal, also as Display.forms', () => {
      expect(DISPLAY_FORMS.map((f) => f.id)).toEqual(['full', 'compact', 'minimal']);
      expect(Display.forms).toBe(DISPLAY_FORMS);
      for (const f of DISPLAY_FORMS) expect(f.grow).toEqual({ w: true });
    });

    it('draws each form, from the prop and from the assembled screen, with its least as the scaling floor', () => {
      for (const id of ['full', 'compact', 'minimal'] as const) {
        const { unmount } = render(<Display {...displayBoard} form={id} />);
        expect(display()).toHaveAttribute('data-form', id);
        expect(display()).not.toHaveAttribute('data-density');
        expect(display().style.getPropertyValue('--yh-display-min-h')).toMatch(/^calc\(.*var\(--control-h\)/);
        unmount();
        const screened = render(
          <FormProvider form={id}>
            <Display {...displayBoard} />
          </FormProvider>,
        );
        expect(display()).toHaveAttribute('data-form', id);
        screened.unmount();
      }
    });

    it('minimal keeps every concept: the tempo keys move into the header, one Tap', () => {
      const { container } = render(<Display {...displayBoard} form="minimal" />);
      const header = container.querySelector('.yh-display__header')!;
      expect(within(header as HTMLElement).getByRole('button', { name: 'Tap tempo' })).toBeInTheDocument();
      expect(within(header as HTMLElement).getByRole('button', { name: "Back to the style's tempo" })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /tap/i })).toHaveLength(1);
      for (const part of ['style', 'one-touch', 'now', 'then', 'chord', 'tempo', 'beat']) expect(container.querySelector(`[data-part='${part}']`), part).not.toBeNull();
      expect(screen.getByText('fill after bar 4')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Chord Am7: A C E G, Fingered On Bass' })).toBeInTheDocument();
    });

    it('precedence: the form prop, then the screen\'s form, then density', () => {
      const { rerender } = render(<Display {...displayBoard} density="full" />);
      expect(display()).toHaveAttribute('data-form', 'full');
      expect(display()).toHaveAttribute('data-density', 'full');
      rerender(<Display {...displayBoard} density="compact" />);
      expect(display()).toHaveAttribute('data-form', 'compact');
      // auto, where nothing measures: compact.
      rerender(<Display {...displayBoard} />);
      expect(display()).toHaveAttribute('data-form', 'compact');
      expect(display()).toHaveAttribute('data-density', 'auto');
      // The prop wins over density.
      rerender(<Display {...displayBoard} density="full" form="minimal" />);
      expect(display()).toHaveAttribute('data-form', 'minimal');
      // The screen's form wins over density; the prop wins over the screen's.
      rerender(
        <FormProvider form="minimal">
          <Display {...displayBoard} density="full" />
        </FormProvider>,
      );
      expect(display()).toHaveAttribute('data-form', 'minimal');
      expect(display()).not.toHaveAttribute('data-density');
      rerender(
        <FormProvider form="minimal">
          <Display {...displayBoard} form="compact" />
        </FormProvider>,
      );
      expect(display()).toHaveAttribute('data-form', 'compact');
    });

    it('are ordered under every pack: each later form shorter and no wider, min ≤ ideal', () => {
      for (const pack of packs) {
        const p = principlesFor(pack.facets, pack.principles);
        const needs = DISPLAY_FORMS.map((f) => ({ min: resolveNeed(f.min, p), ideal: resolveNeed(f.ideal, p) }));
        needs.forEach(({ min, ideal }, i) => {
          expect(min.w, `${pack.id} ${i}`).toBeLessThanOrEqual(ideal.w);
          expect(min.h, `${pack.id} ${i}`).toBeLessThanOrEqual(ideal.h);
          if (i > 0) expect(min.h, `${pack.id} ${i}`).toBeLessThan(needs[i - 1].min.h);
        });
        // Compact is never wider than full.
        expect(needs[1].min.w).toBeLessThanOrEqual(needs[0].min.w);
      }
    });

    it('needs, in px, under yahaha classic (compact scale: control 28, unit 4, numeral 32)', () => {
      const pack = packs.find((x) => x.id === 'yahaha-classic')!;
      const p = principlesFor(pack.facets, pack.principles);
      const px = (id: DisplayForm) => {
        const f = DISPLAY_FORMS.find((x) => x.id === id)!;
        const r = (n: { w: number; h: number }) => ({ w: Math.round(n.w), h: Math.round(n.h) });
        return { min: r(resolveNeed(f.min, p)), ideal: r(resolveNeed(f.ideal, p)) };
      };
      expect(px('full')).toEqual({ min: { w: 486, h: 214 }, ideal: { w: 1058, h: 311 } });
      expect(px('compact')).toEqual({ min: { w: 454, h: 178 }, ideal: { w: 654, h: 220 } });
      expect(px('minimal')).toEqual({ min: { w: 433, h: 128 }, ideal: { w: 486, h: 140 } });
      // Minimal is under five control heights tall; compact about 200px.
      expect(px('minimal').min.h / 28).toBeLessThan(5);
      expect(px('compact').min.h).toBeLessThan(200);
    });
  });

  it('hands the tooltip action to the primitives, each control\'s key applied once', () => {
    const tipAction = vi.fn(() => ({ destroy: vi.fn() }));
    render(<Display {...displayNoParts} tipAction={tipAction} />);
    const keys = tipAction.mock.calls.map((c: unknown[]) => c[1] as string);
    const once = ['style.prev', 'style.next', 'browser.open', 'ots.1', 'ots.2', 'ots.3', 'ots.4', 'fingering.select', 'display.tempo', 'tempo.up', 'tempo.down', 'tempo.tap', 'tempo.reset'];
    for (const key of once) expect(keys.filter((k) => k === key), key).toHaveLength(1);
  });

  it('renders under every theme pack', () => {
    for (const pack of packs) {
      for (const form of [undefined, ...DISPLAY_FORMS.map((f) => f.id)]) {
        const { unmount } = render(
          <ThemeScope facets={pack.facets}>
            <Display {...displayBoard} art form={form} />
          </ThemeScope>,
        );
        expect(document.querySelector<HTMLElement>('.yh-display')!).toBeInTheDocument();
        unmount();
      }
    }
  });
});
