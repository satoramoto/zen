import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeScope, resolveTheme } from '../../theme';
import { packs } from '../../themes/packs';
import { SongForm, type SongFormProps } from './SongForm';
import { songFormBoard, songFormFillPending, songFormSparse, songFormStopped, songFormSyncArmed } from './SongForm.fixtures';

const renderForm = (props: SongFormProps = songFormBoard) => render(<SongForm {...props} />);

describe('Yahaha SongForm', () => {
  it('lays the sections out in the song’s order, Break and Auto Fill apart', () => {
    renderForm();
    const form = screen.getByRole('group', { name: 'Sections' });
    const order = Array.from(form.querySelectorAll('[data-section]')).map((n) => n.getAttribute('data-section'));
    expect(order).toEqual([
      'intro1', 'intro2', 'intro3', 'mainA', 'mainB', 'mainC', 'mainD', 'ending1', 'ending2', 'ending3', 'break',
    ]);
    const mods = screen.getByRole('group', { name: 'Modifiers' });
    expect(within(mods).getByRole('button', { name: 'Break' })).toBeInTheDocument();
    expect(within(mods).getByRole('button', { name: 'Auto Fill' })).toBeInTheDocument();
    // No Tap and no tempo here: they live in the Display.
    expect(screen.queryByRole('button', { name: /tap/i })).toBeNull();
  });

  it('marks what plays now and what comes next, by name and pressed state', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('aria-pressed', 'true');
    const next = screen.getByRole('button', { name: 'Main C, next, after bar 4' });
    expect(next).toHaveAttribute('aria-pressed', 'false');
    expect(next.closest('[data-section]')).toHaveAttribute('data-state', 'next');
    expect(screen.getByRole('status')).toHaveTextContent('Main Cafter bar 4');
  });

  it('draws one half alone when asked', () => {
    const { unmount } = renderForm({ ...songFormBoard, part: 'form' });
    expect(screen.getByRole('region', { name: 'Song form' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Transport' })).toBeNull();
    unmount();
    renderForm({ ...songFormBoard, part: 'transport' });
    expect(screen.getByRole('region', { name: 'Transport' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Transport' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Sections' })).toBeNull();
  });

  it('says the stopped band’s section is where it starts', () => {
    renderForm(songFormStopped);
    expect(screen.getByRole('button', { name: 'Main A, starts here' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('queues a pressed section, and ignores an absent one', async () => {
    const onSection = vi.fn();
    renderForm({ ...songFormSparse, onSection });
    await userEvent.click(screen.getByRole('button', { name: 'Ending I' }));
    await userEvent.click(screen.getByRole('button', { name: 'Main C, not in this style' }));
    await userEvent.click(screen.getByRole('button', { name: 'Break, not in this style' }));
    expect(onSection.mock.calls).toEqual([['ending1']]);
    expect(screen.getByRole('button', { name: 'Intro III, not in this style' }).closest('[data-section]')).toHaveAttribute(
      'data-state',
      'absent',
    );
  });

  it('announces absent sections as unavailable, keeps them focusable, and ignores Enter on them', async () => {
    const onSection = vi.fn();
    const user = userEvent.setup();
    renderForm({ ...songFormBoard, onSection });
    const intro3 = screen.getByRole('button', { name: 'Intro III, not in this style' });
    const ending3 = screen.getByRole('button', { name: 'Ending III, not in this style' });
    expect(intro3).toHaveAttribute('aria-disabled', 'true');
    expect(ending3).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Intro II' })).not.toHaveAttribute('aria-disabled');
    intro3.focus();
    expect(intro3).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.click(ending3);
    expect(onSection).not.toHaveBeenCalled();
  });

  it('rings the queued section in the accent', () => {
    renderForm();
    const next = screen.getByRole('button', { name: 'Main C, next, after bar 4' });
    expect(next).toHaveAttribute('data-next', 'accent');
    expect(next).toHaveAttribute('data-fill');
  });

  it('Start / Stop is the tall key: filled primary while stopped, outlined in the running colour while running', () => {
    const { rerender } = render(<SongForm {...songFormStopped} />);
    const stopped = screen.getByRole('button', { name: 'Start / Stop, stopped' });
    expect(stopped).toHaveAttribute('data-tall');
    expect(stopped).toHaveAttribute('data-variant', 'primary');
    expect(stopped).toHaveAttribute('data-face', 'off');

    rerender(<SongForm {...songFormBoard} />);
    const running = screen.getByRole('button', { name: /^Start \/ Stop, running/ });
    expect(running).toHaveAttribute('data-tall');
    // Not the filled running face: an outline in --success, quieter than the hero's section name.
    expect(running).toHaveAttribute('data-variant', 'secondary');
    expect(running).toHaveAttribute('data-hue', 'ok');
    expect(running).toHaveAttribute('data-face', 'off');
    expect(running).not.toHaveAttribute('data-bar');
  });

  it('the keys that move time wear the transport tone; running stays success, the rest neutral', () => {
    const { container, rerender } = render(<SongForm {...songFormStopped} />);
    expect(screen.getByRole('button', { name: 'Start / Stop, stopped' })).toHaveAttribute('data-hue', 'transport');
    const key = (k: string) => container.querySelector(`.yh-songform__key[data-key='${k}'] button`);
    for (const k of ['sync-start', 'sync-stop', 'fill-up', 'fill-down']) expect(key(k), k).toHaveAttribute('data-hue', 'transport');
    for (const k of ['accomp', 'fade', 'reset']) expect(key(k), k).toHaveAttribute('data-hue', 't');
    expect(screen.getByRole('button', { name: 'Auto Fill' })).toHaveAttribute('data-hue', 'transport');
    rerender(<SongForm {...songFormBoard} />);
    expect(screen.getByRole('button', { name: /^Start \/ Stop, running/ })).toHaveAttribute('data-hue', 'ok');
  });

  it('waiting keys flash with the queued section', () => {
    const { rerender } = render(<SongForm {...songFormFillPending} lit={false} />);
    expect(screen.getByRole('button', { name: /^Fill Up: .*queued$/ })).toHaveAttribute('data-lit', 'false');
    rerender(<SongForm {...songFormSyncArmed} fading lit={false} />);
    expect(screen.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('data-lit', 'false');
    expect(screen.getByRole('button', { name: 'Fade in, waiting for Start' })).toHaveAttribute('data-lit', 'false');
    rerender(<SongForm {...songFormSyncArmed} lit />);
    expect(screen.getByRole('button', { name: 'Sync Start, armed' })).not.toHaveAttribute('data-lit');
  });

  it('Start / Stop says the action and calls back; held while running, it stops with a fade', async () => {
    const onStartStop = vi.fn();
    const onStopWithFade = vi.fn();
    const { rerender } = render(<SongForm {...songFormStopped} onStartStop={onStartStop} onStopWithFade={onStopWithFade} />);
    const stopped = screen.getByRole('button', { name: 'Start / Stop, stopped' });
    expect(stopped).toHaveTextContent('Start');
    expect(stopped).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(stopped);
    expect(onStartStop).toHaveBeenCalledTimes(1);

    rerender(<SongForm {...songFormBoard} onStartStop={onStartStop} onStopWithFade={onStopWithFade} />);
    const running = screen.getByRole('button', { name: /Start \/ Stop, running/ });
    expect(running).toHaveTextContent('Stop');
    expect(running).toHaveAttribute('aria-pressed', 'true');
    await userEvent.pointer({ keys: '[MouseRight]', target: running });
    expect(onStopWithFade).toHaveBeenCalledTimes(1);
  });

  it('every control works from the keyboard', async () => {
    const calls: string[] = [];
    const log = (name: string) => (...args: unknown[]) => calls.push([name, ...args].join(':'));
    const user = userEvent.setup();
    renderForm({
      ...songFormBoard,
      onSection: log('section'),
      onAutoFill: log('autoFill'),
      onStartStop: log('startStop'),
      onSyncStart: log('syncStart'),
      onSyncStop: log('syncStop'),
      onAccomp: log('accomp'),
      onFillUp: log('fillUp'),
      onFillDown: log('fillDown'),
      onFade: log('fade'),
      onReset: log('reset'),
    });
    // Tab through every control, pressing each with Enter (sections) or Space (the rest).
    for (let i = 0; i < 30; i++) {
      await user.tab();
      if (document.activeElement === document.body) break;
      await user.keyboard(i % 2 ? ' ' : '{Enter}');
    }
    expect(calls).toEqual([
      'section:intro1',
      'section:intro2',
      // Intro III is absent: no call.
      'section:mainA',
      'section:mainB',
      'section:mainC',
      'section:mainD',
      'section:ending1',
      'section:ending2',
      // Ending III is absent.
      'section:break',
      'autoFill:true',
      'startStop',
      'syncStart:true',
      'syncStop:true',
      'accomp:false',
      'fillUp',
      'fillDown',
      'fade',
      'reset',
    ]);
  });

  it('switches report the state asked for, and show their own', () => {
    renderForm({ ...songFormSyncArmed, syncStop: true, autoFill: true });
    expect(screen.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('data-face', 'waiting');
    expect(screen.getByRole('button', { name: 'Sync Stop' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Auto Fill' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Accomp (ACMP)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Starts with the first chord');
  });

  it('a queued fill waits on its key and reads in the cue', () => {
    renderForm(songFormFillPending);
    expect(screen.getByRole('button', { name: 'Fill Up: a fill, then the next Main up, queued' })).toHaveAttribute(
      'data-face',
      'waiting',
    );
    expect(screen.getByRole('button', { name: 'Fill Down: a fill, then the next Main down' })).toHaveAttribute(
      'data-face',
      'off',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Fill, then Main C');
  });

  it('Fade is on while fading out, and waits while a fade-in waits for Start', () => {
    const { rerender } = render(<SongForm {...songFormBoard} fading />);
    expect(screen.getByRole('button', { name: 'Fade, fading' })).toHaveAttribute('data-face', 'on');
    rerender(<SongForm {...songFormStopped} fading />);
    const waiting = screen.getByRole('button', { name: 'Fade in, waiting for Start' });
    expect(waiting).toHaveAttribute('data-face', 'waiting');
    expect(waiting).toHaveAttribute('aria-pressed', 'true');
  });

  it('no section takes a part hue', () => {
    const { container } = renderForm();
    for (const pad of container.querySelectorAll('.yh-pad')) expect(pad.getAttribute('data-tone')).toBe('neutral');
  });

  it('renders under every theme pack', () => {
    for (const pack of packs) {
      const { facets } = resolveTheme({ theme: pack.id });
      const { unmount } = render(
        <ThemeScope facets={facets}>
          <SongForm {...songFormBoard} />
        </ThemeScope>,
      );
      expect(screen.getByRole('region', { name: 'Song form and transport' })).toBeInTheDocument();
      unmount();
    }
  });
});
