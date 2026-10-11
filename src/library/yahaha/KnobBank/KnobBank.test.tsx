// KnobBank: the page tabs choose by index, each knob's press and steps carry its position, a
// part's knob wears the part's hue and no other does, and an unused slot is quiet and inert.

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KnobBank, type KnobBankProps } from './KnobBank';
import { knobPages, reverbKnobs, styleKnobs } from './KnobBank.fixtures';

afterEach(() => cleanup());

function setup(props: Partial<KnobBankProps> = {}) {
  const onPage = vi.fn<(index: number) => void>();
  const onPress = vi.fn<(index: number) => void>();
  const onStep = vi.fn<(index: number, delta: number) => void>();
  render(
    <KnobBank knobs={styleKnobs} pages={knobPages} page={0} onPage={onPage} onPress={onPress} onStep={onStep} {...props} />,
  );
  return { onPage, onPress, onStep };
}

describe('KnobBank pages', () => {
  it('is a region named by its heading, with one tab per page and the chosen one selected', () => {
    setup({ page: 3 });
    const region = screen.getByRole('region', { name: 'Knobs' });
    const list = within(region).getByRole('tablist', { name: 'Knob page' });
    expect(within(list).getAllByRole('tab').map((t) => t.textContent)).toEqual(knobPages);
    expect(within(list).getByRole('tab', { name: 'Reverb' })).toHaveAttribute('aria-selected', 'true');
    expect(within(list).getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'false');
    expect(within(list).getByRole('tab', { name: 'Reverb' })).toHaveAttribute('data-tip', 'knobs.page');
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

  it('applies the tooltip hook once to each page tab, with knobs.page', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    const calls = tipAction.mock.calls as [HTMLElement, string][];
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(knobPages.length);
    for (const tab of tabs) expect(calls.filter(([node, key]) => node === tab && key === 'knobs.page')).toHaveLength(1);
    expect(tipAction).toHaveBeenCalledTimes(7 + knobPages.length);
  });
});
