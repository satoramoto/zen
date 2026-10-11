import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChosenTabs } from './ChosenTabs';
import { displayPageTabs, faderPageTabs, layerTabs } from './ChosenTabs.fixtures';

describe('ChosenTabs', () => {
  it('page tabs are buttons with aria-current, and a click only calls through', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(<ChosenTabs tabs={displayPageTabs} chosen="stage" size="page" onChoose={onChoose} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(displayPageTabs.map((t) => t.label));
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    const stage = screen.getByRole('button', { name: 'Stage' });
    expect(stage).toHaveAttribute('aria-current', 'page');
    expect(stage).toHaveAttribute('data-face', 'chosen');
    expect(stage).toHaveAttribute('data-tip', 'view.stage');
    for (const button of buttons.filter((b) => b !== stage)) {
      expect(button).not.toHaveAttribute('aria-current');
      expect(button).toHaveAttribute('data-face', 'off');
    }
    for (const button of buttons) expect(button).not.toHaveAttribute('tabindex');

    await user.click(screen.getByRole('button', { name: 'Effects' }));
    expect(onChoose).toHaveBeenLastCalledWith('effects');
    expect(stage).toHaveAttribute('aria-current', 'page');
    await user.click(stage);
    expect(onChoose).toHaveBeenLastCalledWith('stage');
    screen.getByRole('button', { name: 'Looper' }).focus();
    await user.keyboard('{Enter}');
    expect(onChoose).toHaveBeenLastCalledWith('looper');
    await user.keyboard(' ');
    expect(onChoose).toHaveBeenLastCalledWith('looper');
    expect(onChoose).toHaveBeenCalledTimes(4);
  });

  it('a tablist names short labels and marks the chosen one selected', () => {
    render(<ChosenTabs tabs={layerTabs} chosen="volume" label="Fader layer" />);
    expect(screen.getByRole('tablist', { name: 'Fader layer' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.getAttribute('aria-label') ?? tab.textContent?.trim())).toEqual([
      'Volume',
      'Pan',
      'Reverb send',
      'Chorus send',
      'Delay send',
    ]);
    expect(screen.getByRole('tab', { name: 'Volume' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Pan' })).toHaveAttribute('aria-selected', 'false');
  });

  it('roves focus with automatic activation, wrapping, and keeps the keys from the window', async () => {
    const onChoose = vi.fn();
    const spy = vi.fn();
    const user = userEvent.setup();
    window.addEventListener('keydown', spy);
    try {
      render(<ChosenTabs tabs={layerTabs} chosen="volume" label="Fader layer" onChoose={onChoose} />);
      const tab = (name: string) => screen.getByRole('tab', { name });
      const volume = tab('Volume');
      expect(volume).toHaveAttribute('tabindex', '0');
      volume.focus();
      await user.keyboard('{ArrowRight}');
      expect(onChoose).toHaveBeenLastCalledWith('pan');
      expect(tab('Pan')).toHaveFocus();
      expect(tab('Pan')).toHaveAttribute('tabindex', '0');
      expect(volume).toHaveAttribute('tabindex', '-1');
      expect(volume).toHaveAttribute('aria-selected', 'true');
      await user.keyboard('{End}');
      expect(onChoose).toHaveBeenLastCalledWith('delay');
      expect(tab('Delay send')).toHaveFocus();
      await user.keyboard('{ArrowRight}');
      expect(onChoose).toHaveBeenLastCalledWith('volume');
      expect(volume).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(onChoose).toHaveBeenLastCalledWith('delay');
      await user.keyboard('{Home}');
      expect(onChoose).toHaveBeenLastCalledWith('volume');
      await user.keyboard('{Home}');
      expect(volume).toHaveFocus();
      expect(onChoose).toHaveBeenCalledTimes(5);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('keydown', spy);
    }
  });

  it('returns the tab stop to the chosen tab when focus leaves the run', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ChosenTabs tabs={layerTabs} chosen="volume" label="Fader layer" />
        <button type="button">After</button>
      </>,
    );
    screen.getByRole('tab', { name: 'Volume' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Pan' })).toHaveAttribute('tabindex', '0');
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Volume' })).toHaveAttribute('tabindex', '0');
  });

  it('skips a disabled tab for clicks and arrows', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(
      <ChosenTabs
        tabs={[faderPageTabs[0], { ...faderPageTabs[1], disabled: true }]}
        chosen="panel"
        label="Fader page (master button)"
        onChoose={onChoose}
      />,
    );
    const panel = screen.getByRole('tab', { name: 'Panel' });
    const style = screen.getByRole('tab', { name: 'Style' });
    expect(style).toHaveAttribute('aria-disabled', 'true');
    expect(style).toHaveAttribute('data-face', 'disabled');
    expect(style).toHaveAttribute('tabindex', '-1');
    expect(panel).not.toHaveAttribute('aria-disabled');
    expect(panel).toHaveAttribute('data-face', 'chosen');
    await user.click(style);
    expect(onChoose).not.toHaveBeenCalled();
    panel.focus();
    await user.keyboard('{ArrowRight}');
    expect(panel).toHaveFocus();
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('gives the first enabled tab the tab stop when nothing is chosen', () => {
    render(<ChosenTabs tabs={[{ ...layerTabs[0], disabled: true }, ...layerTabs.slice(1)]} chosen={null} />);
    expect(screen.getByRole('tab', { name: 'Pan' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Volume' })).toHaveAttribute('tabindex', '-1');
  });
});
