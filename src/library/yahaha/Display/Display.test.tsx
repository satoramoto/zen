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
    expect(screen.getByText('Right 1 · off')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Right 1 sound/ })).toHaveAttribute('data-off', 'true');
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

  it('running: the section live, what is next and when, the beat lit', () => {
    const { container } = setup();
    expect(container.querySelector('.yh-display__now')).toHaveAttribute('data-live', 'true');
    const next = container.querySelector('.yh-display__next') as HTMLElement;
    expect(next.textContent).toBe('Main Cfill after bar 4');
    expect(within(next).getByText('Main C')).toHaveAttribute('data-face', 'waiting');
    expect(within(next).getByText('Main C')).toHaveAttribute('data-hue', 't');
    expect(beatStates(container)).toEqual(['past', 'current', 'future', 'future']);
  });

  it('gives sections no hue', () => {
    const { container } = setup();
    for (const el of container.querySelectorAll('.yh-section-name, .yh-bar-beat')) {
      // The primitive's default (or none, once the primitives drop section kinds), never a kind passed in from here.
      expect(['main', null]).toContain(el.getAttribute('data-hue'));
    }
  });

  it('looping with nothing queued: where the section is', () => {
    const { container } = render(<Display {...displayLooping} />);
    expect((container.querySelector('.yh-display__next') as HTMLElement).textContent).toBe('bar 2 of 8');
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
    expect((container.querySelector('.yh-display__next') as HTMLElement).textContent).toBe('Sync Start armedIntro II');
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
