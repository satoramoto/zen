import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeScope } from '../../theme';
import { packs } from '../../themes/packs';
import { Display, type DisplayProps } from './Display';
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
    const display = screen.getByRole('region', { name: 'Stage display' });
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
    expect(screen.getByRole('region', { name: 'Stage display' })).not.toHaveAttribute('data-parts');
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
    expect(within(screen.getByRole('region', { name: 'Stage display' })).getAllByText('Main C')).toHaveLength(1);
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
    const display = () => screen.getByRole('region', { name: 'Stage display' });
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

  it('defines the sizes in container units, each readout with its own cap per density, ranked section > tempo > chord', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Display.css'), 'utf8');
    expect(css).toMatch(/container:\s*yh-display\s*\/\s*inline-size/);
    const cqi = (name: string) => {
      const m = new RegExp(`--yh-display-${name}:\\s*(?:calc\\()?clamp\\(var\\(--size-numeral\\),\\s*(\\d+(?:\\.\\d+)?)cqi,\\s*var\\(--yh-display-cap-${name}\\)\\)`).exec(css);
      expect(m, name).not.toBeNull();
      return Number(m![1]);
    };
    expect(cqi('section')).toBeGreaterThan(cqi('tempo'));
    expect(cqi('tempo')).toBeGreaterThan(cqi('chord'));
    // Full caps 96 / 84 / 72 from display 40; compact 60 / 52 / 44 from numeral 32 (push's numbers).
    const caps = (block: string) =>
      ['section', 'tempo', 'chord'].map((n) => Number(new RegExp(`--yh-display-cap-${n}:\\s*calc\\(var\\(--size-[a-z]+\\) \\* ([\\d.]+)\\)`).exec(block)![1]));
    const full = /\.yh-display__frame \{([^}]*)\}/.exec(css)![1];
    const compact = /\.yh-display\[data-density='compact'\] \.yh-display__frame \{([^}]*)\}/.exec(css)![1];
    expect(caps(full).map((k) => k * 40)).toEqual([96, 84, 72]);
    expect(caps(compact).map((k) => k * 32)).toEqual([60, 52, 44]);
    expect(css).toMatch(/@container yh-display \(max-width: 1199px\) \{\s*\.yh-display\[data-density='auto'\] \.yh-display__frame \{[^}]*--yh-display-cap-section:/);
    // The primitives' own size variables are set only through their options, never overridden here.
    expect(css).not.toMatch(/--yh-(chord-readout-hero|tempo-readout-size|section-name-size|bar-beat-line|bar-beat-lit)\s*:/);
  });

  it('lays out narrow heroes without overlap: parts wrap below 900px and drop below 600px, cells never ride over the header', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Display.css'), 'utf8');
    expect(css).toMatch(/\.yh-display__readouts \{[^}]*align-content:\s*safe center/);
    // The section is never cut (it steps down instead); the chord keeps a cell and steps itself down.
    expect(css).toMatch(/grid-template-columns:\s*max-content minmax\(calc\(var\(--yh-display-chord\) \* 1\.5\), 1fr\) max-content;/);
    expect(css).toMatch(/@container yh-display \(min-width: 900px\) \{\s*\.yh-display\[data-parts\] \.yh-display__readouts \{[^}]*minmax\(calc\(var\(--control-h\) \* 6\), 0\.8fr\)/);
    expect(css).toMatch(/@container yh-display \(max-width: 899px\) \{\s*\.yh-display \.yh-display__parts \{[^}]*grid-column:\s*1 \/ -1;[^}]*flex-direction:\s*row/);
    expect(css).toMatch(/@container yh-display \(max-width: 599px\) \{\s*\.yh-display \.yh-display__parts \{\s*display:\s*none/);
    expect(css).toMatch(/\.yh-chord-readout__fingering \{[^}]*white-space:\s*nowrap;[^}]*text-overflow:\s*ellipsis/);
    // Narrow: the notes drop rather than clip.
    expect(css).toMatch(/@container yh-display \(max-width: 599px\) \{[^@]*\.yh-chord-readout__tones \{\s*display:\s*none/);
    // No faint text, no mono, no literal sizes for the readouts.
    expect(css).not.toMatch(/--text-4|--font-mono/);
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
      const { unmount } = render(
        <ThemeScope facets={pack.facets}>
          <Display {...displayBoard} art />
        </ThemeScope>,
      );
      expect(screen.getByRole('region', { name: 'Stage display' })).toBeInTheDocument();
      unmount();
    }
  });
});
