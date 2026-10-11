import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, type StageProps } from './Stage';
import { stageBoard, stageStopped } from './Stage.fixtures';
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
  it('lays out every region once', () => {
    setup();
    const stage = screen.getByRole('group', { name: 'Stage' });
    expect(within(stage).getAllByRole('navigation', { name: 'Pages' })).toHaveLength(1);
    for (const name of ['Stage display', 'Song form and transport', 'Faders', 'Knobs', 'Pads']) {
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
    const faders = region('Faders');
    for (const name of ['Right 1, Stage Grand: open Channel', 'Right 2, Silk Strings, edited: open Channel', 'Left, Finger Bass: open Channel']) {
      expect(faders.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('has every section and transport key once, in the song form', () => {
    setup();
    const form = region('Song form and transport');
    for (const name of [/^Intro I\b(?!I)/, /^Intro II\b(?!I)/, /^Intro III/, /^Main A/, /^Main B/, /^Main C/, /^Main D/, /^Ending I\b(?!I)/, /^Ending II\b(?!I)/, /^Ending III/, /^Break/]) {
      once(name);
      expect(form.getByRole('button', { name })).toBeInTheDocument();
    }
    for (const name of [/^Start \/ Stop/, /^Sync Start/, 'Sync Stop', 'Auto Fill', /^Fill Up/, /^Fill Down/, /^Fade\b/, /^Section reset/, 'Accomp (ACMP)']) {
      once(name);
      expect(form.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('has the mixer, eight knobs, sixteen pads in two rows of eight', () => {
    const { container } = setup();
    expect(region('Faders').getAllByRole('slider')).toHaveLength(9);
    for (const name of ['Style volume, level 100', 'Multi Pad volume, level 90', 'Master, level 100']) once(name, 'slider');
    expect(region('Knobs').getAllByRole('button', { name: /^Knob [1-8]:/ }).length + container.querySelectorAll('.yh-knobbank__empty').length).toBe(8);
    expect(container.querySelectorAll('.yh-padbank__cell')).toHaveLength(16);
    expect(container.querySelector('.yh-padbank__pads')).toHaveAttribute('data-columns', '8');
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
    const form = region('Song form and transport');
    await user.click(form.getByRole('button', { name: 'Main D' }));
    expect(form.getByRole('button', { name: /^Main D, next/ })).toBeInTheDocument();
    expect(region('Stage display').getByText('Main D')).toBeInTheDocument();
    await user.click(form.getByRole('button', { name: /^Main D, next/ }));
    expect(form.getByRole('button', { name: 'Main D, playing' })).toBeInTheDocument();
    expect(region('Stage display').getByRole('img', { name: /^Playing Main\sD$/ })).toBeInTheDocument();
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

  it('moves a fader and switches the layer', async () => {
    play();
    const user = userEvent.setup();
    const master = screen.getByRole('slider', { name: 'Master, level 100' });
    master.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('slider', { name: 'Master, level 99' })).toBeInTheDocument();
    await user.click(region('Faders').getByRole('tab', { name: 'Reverb send' }));
    expect(screen.getByRole('slider', { name: 'Right 1 · Stage Grand, Reverb 40' })).toBeInTheDocument();
  });
});
