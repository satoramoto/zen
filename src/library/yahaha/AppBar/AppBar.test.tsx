import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppBar, type AppBarProps } from './AppBar';
import { boardAppBar } from './AppBar.fixtures';

function setup(props: Partial<AppBarProps> = {}) {
  const handlers = {
    onChoose: vi.fn(),
    onHealth: vi.fn(),
    onMetronome: vi.fn(),
    onMetronomeSettings: vi.fn(),
    onMetronomeClose: vi.fn(),
    onMetronomeVolume: vi.fn(),
    onMetronomeBell: vi.fn(),
    onUnison: vi.fn(),
    onHelp: vi.fn(),
    onPanic: vi.fn(),
  };
  const view = render(<AppBar {...boardAppBar} {...handlers} {...props} />);
  return { ...view, ...handlers };
}

const CARET = 'Metronome settings: on/off, volume, bell on beat 1';

describe('AppBar navigation', () => {
  it('marks the chosen page and calls onChoose with a page id, never moving it itself', async () => {
    const { onChoose } = setup();
    const nav = screen.getByRole('navigation', { name: 'Pages' });
    const pages = within(nav).getAllByRole('button').map((b) => b.textContent);
    expect(pages).toEqual([
      'Stage',
      'Channel',
      'Effects',
      'Quick Racks',
      'Multi Pads',
      'Looper',
      'Harm/Arp',
      'Library',
      'Settings',
    ]);
    expect(within(nav).getByRole('button', { name: 'Stage' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(nav).getByRole('button', { name: 'Settings' }));
    expect(onChoose).toHaveBeenLastCalledWith('settings');
    expect(within(nav).getByRole('button', { name: 'Stage' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Settings' })).not.toHaveAttribute('aria-current');
  });

  it('shows the style and tempo off the Stage only', () => {
    const { rerender } = setup();
    expect(screen.queryByLabelText(/^Style /)).toBeNull();
    rerender(<AppBar {...boardAppBar} chosen="settings" nowPlaying={{ style: 'Sunday Drive Pop', tempo: 104 }} />);
    expect(screen.getByLabelText('Style Sunday Drive Pop, 104 BPM')).toHaveTextContent('Sunday Drive Pop104BPM');
  });

  it('applies the tooltip action to tabs, switches and the health slot', () => {
    const tipAction = vi.fn();
    setup({ tipAction, failedPart: 1 });
    const keys = tipAction.mock.calls.map(([, key]) => key);
    expect(keys).toEqual(
      expect.arrayContaining(['view.stage', 'nav.settings', 'metronome.on', 'metronome.settings', 'transport.unison', 'app.help', 'transport.panic', 'app.health']),
    );
  });
});

/** A tooltip action that records each application and each destroy, per node. */
function recordingTip() {
  const applied: { node: HTMLElement; key: string; destroyed: boolean }[] = [];
  const tipAction = vi.fn((node: HTMLElement, key: string) => {
    const entry = { node, key, destroyed: false };
    applied.push(entry);
    return {
      destroy: () => {
        entry.destroyed = true;
      },
    };
  });
  const live = () => applied.filter((a) => !a.destroyed);
  return { tipAction, applied, live };
}

describe('AppBar tooltips', () => {
  it('applies the action exactly once to each tip node, with its own key', () => {
    const { tipAction, applied } = recordingTip();
    const { container } = setup({ tipAction, failedPart: 1 });
    const nodes = [...container.querySelectorAll<HTMLElement>('[data-tip]')];
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      const calls = applied.filter((a) => a.node === node);
      expect(calls, node.dataset.tip).toHaveLength(1);
      expect(calls[0].key).toBe(node.dataset.tip);
    }
    expect(applied.every((a) => nodes.includes(a.node))).toBe(true);
  });

  it('a rerender with the same props applies nothing again', () => {
    const { tipAction, applied } = recordingTip();
    const { rerender } = setup({ tipAction });
    const before = applied.length;
    rerender(<AppBar {...boardAppBar} tipAction={tipAction} />);
    expect(applied).toHaveLength(before);
  });

  it('destroys the health tip when calm turns to trouble, and applies it once to the new node', () => {
    const { tipAction, applied, live } = recordingTip();
    const { rerender, container } = setup({ tipAction });
    const calm = applied.filter((a) => a.key === 'app.health');
    expect(calm).toHaveLength(1);
    rerender(<AppBar {...boardAppBar} tipAction={tipAction} failedPart={1} />);
    expect(calm[0].destroyed).toBe(true);
    const button = container.querySelector<HTMLElement>('.yh-appbar__health [data-tip]');
    const health = live().filter((a) => a.key === 'app.health');
    expect(health).toHaveLength(1);
    expect(health[0].node).toBe(button);
    // The health change tore down and re-applied nothing else.
    expect(applied.filter((a) => a.key === 'view.stage')).toHaveLength(1);
  });

  it('destroys a tab tip when its key changes', () => {
    const { tipAction, applied, live } = recordingTip();
    const { rerender } = setup({ tipAction });
    const stage = applied.find((a) => a.key === 'view.stage');
    expect(stage).toBeDefined();
    const displayTabs = boardAppBar.displayTabs.map((t) => (t.tip === 'view.stage' ? { ...t, tip: 'view.stage2' } : t));
    rerender(<AppBar {...boardAppBar} displayTabs={displayTabs} tipAction={tipAction} />);
    expect(stage?.destroyed).toBe(true);
    expect(live().filter((a) => a.key === 'view.stage2')).toHaveLength(1);
  });

  it('destroys every tip handle on unmount', () => {
    const { tipAction, applied, live } = recordingTip();
    const { unmount } = setup({ tipAction, failedPart: 1, metronomeOpen: true });
    expect(applied.length).toBeGreaterThan(0);
    unmount();
    expect(live()).toEqual([]);
  });
});

describe('AppBar switches', () => {
  it('asks for the next state of Metronome, Unison and help, and calls Panic', async () => {
    const { onMetronome, onUnison, onHelp, onPanic } = setup({ unison: true });
    const switches = screen.getByRole('group', { name: 'Global switches' });
    const metronome = within(switches).getByRole('button', { name: 'Metronome' });
    expect(metronome).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(metronome);
    expect(onMetronome).toHaveBeenLastCalledWith(true);
    await userEvent.click(within(switches).getByRole('button', { name: 'Unison' }));
    expect(onUnison).toHaveBeenLastCalledWith(false);
    const help = within(switches).getByRole('button', { name: /^Help mode/ });
    expect(help).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(help);
    expect(onHelp).toHaveBeenLastCalledWith(true);
    await userEvent.click(screen.getByRole('button', { name: 'Panic: all notes off' }));
    expect(onPanic).toHaveBeenCalledTimes(1);
  });

  it('draws help mode on when help is set', () => {
    setup({ help: true });
    expect(screen.getByRole('button', { name: /^Help mode/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps Panic quiet at rest: an outlined key, never the filled face', () => {
    setup();
    const panic = screen.getByRole('button', { name: 'Panic: all notes off' });
    expect(panic).toHaveAttribute('data-face', 'off');
    expect(panic).toHaveAttribute('data-variant', 'secondary');
    expect(panic).toHaveAttribute('data-hue', 'rec');
  });
});

describe('AppBar metronome popover', () => {
  it('the ▾ names its popover and asks to toggle it', async () => {
    const { onMetronomeSettings } = setup();
    const caret = screen.getByRole('button', { name: CARET });
    expect(caret).toHaveAttribute('aria-haspopup', 'dialog');
    expect(caret).toHaveAttribute('aria-expanded', 'false');
    expect(caret).toHaveAttribute('aria-controls', 'metronome-settings');
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(caret);
    expect(onMetronomeSettings).toHaveBeenCalledTimes(1);
  });

  it('open: the popover shows the metronome state and passes its changes up', async () => {
    const { onMetronome, onMetronomeBell, onMetronomeVolume } = setup({
      metronomeOpen: true,
      metronome: true,
      metronomeVolume: 90,
      metronomeBell: false,
    });
    expect(screen.getByRole('button', { name: CARET })).toHaveAttribute('aria-expanded', 'true');
    const dialog = screen.getByRole('dialog', { name: 'Metronome settings' });
    expect(dialog).toHaveAttribute('id', 'metronome-settings');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Metronome on/off' }));
    expect(onMetronome).toHaveBeenLastCalledWith(false);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Bell on beat 1' }));
    expect(onMetronomeBell).toHaveBeenLastCalledWith(true);
    const volume = within(dialog).getByRole('slider', { name: 'Metronome volume' });
    expect(volume).toHaveAttribute('aria-valuenow', '90');
    volume.focus();
    await userEvent.keyboard('{End}');
    expect(onMetronomeVolume).toHaveBeenLastCalledWith(127);
  });

  it('Esc and a press outside ask to close; a press on the ▾ is left to the ▾', () => {
    const { onMetronomeClose } = setup({ metronomeOpen: true });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onMetronomeClose).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(document.body);
    expect(onMetronomeClose).toHaveBeenCalledTimes(2);
    fireEvent.pointerDown(screen.getByRole('button', { name: CARET }));
    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(onMetronomeClose).toHaveBeenCalledTimes(2);
  });

  it('wired: the ▾ opens and closes it, Esc closes it and gives focus back to the ▾', async () => {
    function Wired() {
      const [open, setOpen] = useState(false);
      return (
        <AppBar
          {...boardAppBar}
          metronomeOpen={open}
          onMetronomeSettings={() => setOpen((o) => !o)}
          onMetronomeClose={() => setOpen(false)}
        />
      );
    }
    render(<Wired />);
    const caret = screen.getByRole('button', { name: CARET });
    await userEvent.click(caret);
    expect(screen.getByRole('dialog', { name: 'Metronome settings' })).toBeInTheDocument();
    await userEvent.click(caret);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(caret);
    screen.getByRole('slider', { name: 'Metronome volume' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(caret).toHaveFocus();
  });

  it('removes its window listeners once it closes: a later Esc or press outside calls nothing', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { rerender, onMetronomeClose } = setup({ metronomeOpen: true });
    const added = add.mock.calls.filter(([type]) => type === 'keydown' || type === 'pointerdown');
    expect(added.length).toBeGreaterThan(0);
    rerender(<AppBar {...boardAppBar} onMetronomeClose={onMetronomeClose} metronomeOpen={false} />);
    for (const [type, listener, options] of added) {
      expect(remove).toHaveBeenCalledWith(type, listener, options);
    }
    add.mockRestore();
    remove.mockRestore();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.pointerDown(document.body);
    expect(onMetronomeClose).not.toHaveBeenCalled();
  });

  it('destroys the popover tips when it closes', () => {
    const { tipAction, applied } = recordingTip();
    const { rerender } = setup({ tipAction, metronomeOpen: true });
    const inside = applied.filter((a) => a.key === 'metronome.volume' || a.key === 'metronome.bell');
    expect(inside).toHaveLength(2);
    rerender(<AppBar {...boardAppBar} tipAction={tipAction} metronomeOpen={false} />);
    expect(inside.every((a) => a.destroyed)).toBe(true);
  });

  it("an Esc while it's open never reaches the window's own handlers", () => {
    const windowKeys = vi.fn();
    window.addEventListener('keydown', windowKeys);
    setup({ metronomeOpen: true });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    window.removeEventListener('keydown', windowKeys);
    expect(windowKeys).not.toHaveBeenCalled();
  });
});

describe('AppBar connections', () => {
  it('names the Launchkey state', () => {
    const { rerender } = setup();
    expect(screen.getByRole('status', { name: 'Launchkey connected' })).toBeInTheDocument();
    rerender(<AppBar {...boardAppBar} launchkey={false} />);
    expect(screen.getByRole('status', { name: 'Launchkey not connected' })).toBeInTheDocument();
  });

  it('trouble is a button that sends you where to fix it', async () => {
    const { onHealth } = setup({ failedPart: 2 });
    await userEvent.click(screen.getByRole('button', { name: 'R3 failed' }));
    expect(onHealth).toHaveBeenLastCalledWith({ page: 'channel', part: 2 });
  });

  it('calm audio is not a button', () => {
    setup();
    expect(screen.queryByRole('button', { name: /Audio/ })).toBeNull();
  });
});

describe('AppBar layout', () => {
  it('takes a fixed width, and the end slot sits before the switches', () => {
    const { container } = setup({ width: 1217, end: <button type="button">Extra</button> });
    const header = container.querySelector('header');
    expect(header).toHaveStyle({ width: '1217px' });
    const buttons = within(header as HTMLElement).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent);
    expect(buttons.indexOf('Extra')).toBeGreaterThan(buttons.indexOf('Settings'));
    expect(buttons.indexOf('Extra')).toBeLessThan(buttons.indexOf('Metronome'));
  });
});
