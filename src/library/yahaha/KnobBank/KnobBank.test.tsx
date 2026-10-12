// KnobBank: the page tabs choose by index, each knob's press and steps carry its position, a
// part's knob wears the part's hue and no other does, and an unused slot is quiet and inert.

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KnobBank, KnobBankRegion, type KnobBankProps } from './KnobBank';
import { knobPages, reverbKnobs, styleKnobs } from './KnobBank.fixtures';

afterEach(() => cleanup());

function setup(props: Partial<KnobBankProps> = {}) {
  const onPage = vi.fn<(index: number) => void>();
  const onPress = vi.fn<(index: number) => void>();
  const onStep = vi.fn<(index: number, delta: number) => void>();
  render(
    <KnobBankRegion knobs={styleKnobs} pages={knobPages} page={0} onPage={onPage} onPress={onPress} onStep={onStep} {...props} />,
  );
  return { onPage, onPress, onStep };
}

describe('KnobBank pages', () => {
  it('is one region named Knobs, with one tab per page and the chosen one selected', () => {
    setup({ page: 3 });
    const region = screen.getByRole('region', { name: 'Knobs' });
    const list = within(region).getByRole('tablist', { name: 'Knobs' });
    expect(within(list).getAllByRole('tab').map((t) => t.textContent)).toEqual(knobPages);
    expect(within(list).getByRole('tab', { name: 'Reverb' })).toHaveAttribute('aria-selected', 'true');
    expect(within(list).getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'false');
    expect(within(list).getByRole('tab', { name: 'Reverb' })).toHaveAttribute('data-tip', 'knobs.page');
  });

  it('has no title and no region inside the region: the bank is the tab panel', () => {
    setup();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toContainElement(screen.getByRole('button', { name: /^Knob 1:/ }));
  });

  it('the bank alone draws the knobs and no tabs', () => {
    render(<KnobBank knobs={styleKnobs} pages={knobPages} page={0} />);
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('a tab click or an arrow key asks for that page by index', async () => {
    const { onPage } = setup();
    await userEvent.click(screen.getByRole('tab', { name: 'Reverb' }));
    expect(onPage).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Style' }), { key: 'ArrowRight' });
    expect(onPage).toHaveBeenLastCalledWith(1);
  });

  it('without pages, the page label is the one tab, chosen', () => {
    setup({ pages: [], pageLabel: 'Swap R1', page: 4 });
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Swap R1');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });
});

describe('KnobBank knobs', () => {
  it('names each knob by position, name, code and value', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Knob 1: Dynamics (DynCtrl) 127' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knob 2: Retrig rate (RtgRate) 1/8' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knob 6: Swing (Swing) 0%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knob 8: Tempo (Tempo) 104' })).toHaveAttribute('data-tip', 'knobs.knob');
  });

  it('draws the plain name but not the Genos code, which stays in the spoken name', () => {
    setup();
    const dynamics = screen.getByRole('button', { name: 'Knob 1: Dynamics (DynCtrl) 127' });
    expect(dynamics).toHaveTextContent('Dynamics');
    expect(dynamics).not.toHaveTextContent('DynCtrl');
    expect(dynamics.querySelector('.yh-knob__code')).toBeNull();
  });

  it('a press and a step carry the knob position', async () => {
    const { onPress, onStep } = setup();
    const swing = screen.getByRole('button', { name: /^Knob 6:/ });
    await userEvent.click(swing);
    expect(onPress).toHaveBeenCalledWith(5);
    fireEvent.keyDown(swing, { key: 'ArrowUp' });
    expect(onStep).toHaveBeenLastCalledWith(5, 1);
    fireEvent.keyDown(screen.getByRole('button', { name: /^Knob 8:/ }), { key: 'ArrowDown' });
    expect(onStep).toHaveBeenLastCalledWith(7, -1);
  });

  it('an unused slot is a quiet mark, still named, not a control', () => {
    const { onPress } = setup();
    expect(screen.getAllByRole('button')).toHaveLength(7);
    const empty = screen.getByRole('img', { name: 'Knob 7: unused' });
    expect(empty).not.toHaveTextContent('---');
    fireEvent.click(empty);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('always draws eight slots, like the hardware: missing knobs are unused, extras ignored', () => {
    const { onPress } = setup({ knobs: styleKnobs.slice(0, 3) });
    const region = screen.getByRole('region', { name: 'Knobs' });
    expect(region.querySelectorAll('.yh-knobbank__slot')).toHaveLength(8);
    expect(within(region).getAllByRole('button')).toHaveLength(3);
    for (const n of [4, 5, 6, 7, 8]) expect(within(region).getByRole('img', { name: `Knob ${n}: unused` })).toBeInTheDocument();
    fireEvent.click(within(region).getByRole('img', { name: 'Knob 8: unused' }));
    expect(onPress).not.toHaveBeenCalled();
    cleanup();
    setup({ knobs: [...styleKnobs, ...styleKnobs] });
    const full = screen.getByRole('region', { name: 'Knobs' });
    expect(full.querySelectorAll('.yh-knobbank__slot')).toHaveLength(8);
    expect(within(full).getAllByRole('button')).toHaveLength(7);
    expect(within(full).queryByRole('button', { name: /^Knob 9:/ })).toBeNull();
  });

  it('an unused slot is drawn as a full ring with no value or name, and is skipped by Tab', async () => {
    setup({ pages: [] });
    const empty = screen.getByRole('img', { name: 'Knob 7: unused' });
    expect(empty.querySelector('svg path')).not.toBeNull();
    expect(empty.textContent).toBe('');
    expect(empty).not.toHaveAttribute('tabindex');
    screen.getByRole('button', { name: /^Knob 6:/ }).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Knob 8:/ }));
  });

  it('only a knob that belongs to a part wears a hue, the part’s', () => {
    setup({ knobs: reverbKnobs, page: 3 });
    const hue = (n: number) => screen.getByRole('button', { name: new RegExp(`^Knob ${n}:`) }).getAttribute('data-hue');
    expect([1, 2, 3, 4].map(hue)).toEqual(['1', '2', '3', '4']);
    expect(hue(5)).toBeNull();
    expect(hue(8)).toBeNull();
    cleanup();
    setup();
    for (const button of screen.getAllByRole('button')) expect(button).not.toHaveAttribute('data-hue');
  });

  it('passes the tooltip hook to every knob with its key', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    const calls = tipAction.mock.calls as [HTMLElement, string][];
    expect(calls.filter(([, key]) => key === 'knobs.knob')).toHaveLength(7);
    expect(tipAction).toHaveBeenCalledWith(expect.any(HTMLElement), 'knobs.knob');
  });

  it('gives each page tab the knobs.page key and runs the hook on it, once per node', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(knobPages.length);
    for (const tab of tabs) {
      expect(tab).toHaveAttribute('data-tip', 'knobs.page');
      expect(tipAction).toHaveBeenCalledWith(tab, 'knobs.page');
    }
    expect(tipAction).toHaveBeenCalledTimes(7 + tabs.length);
  });
});
