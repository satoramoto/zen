// PadBank: four banks without Sections, tabs choose by index with tips by name, a press carries
// the pad's index, an empty pad is quiet and inert, and the layout and flash pass through.

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PadBank, type PadBankProps } from './PadBank';
import { chordPads, padBanks, quickRackPads, quickRackStorePads } from './PadBank.fixtures';

afterEach(() => cleanup());

/** A label's numeral is tied to its word with a no-break space, and the name keeps it. */
const NB = ' ';

function setup(props: Partial<PadBankProps> = {}) {
  const onBank = vi.fn<(index: number) => void>();
  const onPress = vi.fn<(index: number) => void>();
  const view = render(<PadBank pads={quickRackPads} banks={padBanks} bank={0} onBank={onBank} onPress={onPress} {...props} />);
  return { onBank, onPress, container: view.container };
}

describe('PadBank banks', () => {
  it('is a region named by its heading, with the four banks as tabs and no Sections', () => {
    setup({ bank: 2 });
    const region = screen.getByRole('region', { name: 'Pads' });
    const list = within(region).getByRole('tablist', { name: 'Pad bank' });
    expect(within(list).getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Quick Racks',
      'Chord',
      'Multi Pads',
      'Setup',
    ]);
    expect(within(list).queryByRole('tab', { name: 'Sections' })).toBeNull();
    expect(within(list).getByRole('tab', { name: 'Multi Pads' })).toHaveAttribute('aria-selected', 'true');
  });

  it('each tab takes its tooltip by name, so a list with Sections still lines up', () => {
    setup({ banks: ['Sections', ...padBanks], bank: 1 });
    const tip = (name: string) => screen.getByRole('tab', { name }).getAttribute('data-tip');
    expect(tip('Sections')).toBe('padpage.sections');
    expect(tip('Quick Racks')).toBe('padpage.racks');
    expect(tip('Multi Pads')).toBe('padpage.multi_pads');
    expect(tip('Setup')).toBe('padpage.setup');
  });

  it('bankTips override by index', () => {
    setup({ bankTips: ['x.one'] });
    expect(screen.getByRole('tab', { name: 'Quick Racks' })).toHaveAttribute('data-tip', 'x.one');
    expect(screen.getByRole('tab', { name: 'Chord' })).toHaveAttribute('data-tip', 'padpage.chord');
  });

  it('a tab click or an arrow key asks for that bank by index', async () => {
    const { onBank } = setup();
    await userEvent.click(screen.getByRole('tab', { name: 'Setup' }));
    expect(onBank).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Quick Racks' }), { key: 'ArrowLeft' });
    expect(onBank).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Quick Racks' }), { key: 'ArrowRight' });
    expect(onBank).toHaveBeenLastCalledWith(1);
  });

  it('without banks, the bank name is the one tab, chosen', () => {
    setup({ banks: [], bankName: 'Quick Racks', bank: 3 });
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });
});

describe('PadBank pads', () => {
  it('names each pad by label and number, and says which are on', () => {
    setup();
    expect(screen.getByRole('button', { name: `Rack${NB}1 (pad 1)` })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: `Rack${NB}2 (pad 2)` })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Store (pad 15)' })).toBeInTheDocument();
  });

  it('a press carries the pad index', async () => {
    const { onPress } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Bank + (pad 14)' }));
    expect(onPress).toHaveBeenCalledWith(13);
    screen.getByRole('button', { name: `Rack${NB}6 (pad 6)` }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onPress).toHaveBeenLastCalledWith(5);
  });

  it('an empty pad is a quiet mark, still named, not a key', () => {
    const { onPress } = setup({ pads: chordPads, bank: 1 });
    expect(screen.getAllByRole('button')).toHaveLength(8);
    const empty = screen.getByRole('img', { name: 'Pad 3: empty' });
    // No text at all (not the old "—" key): toHaveTextContent('') would pass for any text.
    expect(empty.textContent).toBe('');
    fireEvent.click(empty);
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Manual Bass (pad 9)' })).toBeInTheDocument();
  });

  it('always draws sixteen cells, like the hardware: missing pads are empty, extras ignored', () => {
    const { onPress, container } = setup({ pads: quickRackPads.slice(0, 5) });
    expect(container.querySelectorAll('.yh-padbank__cell')).toHaveLength(16);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    for (const n of [6, 12, 16]) expect(screen.getByRole('img', { name: `Pad ${n}: empty` })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('img', { name: 'Pad 12: empty' }));
    expect(onPress).not.toHaveBeenCalled();
    cleanup();
    const many = setup({ pads: [...quickRackPads, ...quickRackPads] });
    expect(many.container.querySelectorAll('.yh-padbank__cell')).toHaveLength(16);
    expect(screen.queryByRole('button', { name: /\(pad 17\)$/ })).toBeNull();
  });

  it('sixteen cells make two rows of eight or a 4 × 4 grid, whatever is given', () => {
    const { container } = setup({ pads: [], columns: 4 });
    const grid = container.querySelector('.yh-padbank__pads');
    expect(grid).toHaveAttribute('data-columns', '4');
    expect(grid?.children).toHaveLength(16);
    expect(screen.getAllByRole('img', { name: /^Pad \d+: empty$/ })).toHaveLength(16);
  });

  it('an empty pad is a full face with no label, skipped by Tab', async () => {
    setup({ pads: chordPads, bank: 1, banks: [] });
    const empty = screen.getByRole('img', { name: 'Pad 8: empty' });
    expect(empty).not.toHaveAttribute('tabindex');
    expect(empty.closest('.yh-padbank__cell')).toHaveAttribute('data-empty', 'true');
    // Pads 1–8 of the Chord bank are empty: Tab goes from the bank tab straight to pad 9.
    screen.getByRole('tab').focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Manual Bass (pad 9)' }));
  });

  it('a dark pad (an empty Quick Rack slot) is still a key', () => {
    setup();
    expect(screen.getByRole('button', { name: `Rack${NB}8 (pad 8)` })).toHaveAttribute('data-state', 'dark');
  });

  it('lays out 8 or 4 a row', () => {
    const { container } = setup();
    expect(container.querySelector('.yh-padbank__pads')).toHaveAttribute('data-columns', '8');
    cleanup();
    const four = setup({ columns: 4 });
    expect(four.container.querySelector('.yh-padbank__pads')).toHaveAttribute('data-columns', '4');
  });

  it('passes the flash phase to waiting pads', () => {
    setup({ pads: quickRackStorePads, lit: false });
    expect(screen.getByRole('button', { name: 'Store (pad 15)' })).toHaveAttribute('data-lit', 'false');
    expect(screen.getByRole('button', { name: `Rack${NB}3 (pad 3)` })).toHaveAttribute('data-lit', 'false');
    expect(screen.getByRole('button', { name: `OTS${NB}1 (pad 9)` })).not.toHaveAttribute('data-lit');
  });

  it('each pad fills its cell through the Pad’s fillCell', () => {
    const { container } = setup();
    const pads = container.querySelectorAll('.yh-padbank__cell .yh-pad');
    expect(pads).toHaveLength(quickRackPads.filter((p) => !p.empty).length);
    for (const pad of pads) expect(pad).toHaveAttribute('data-fill', 'true');
  });

  it('applies the tooltip hook once to each bank tab and each pad, with its key', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    const calls = tipAction.mock.calls as [HTMLElement, string][];
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    for (const tab of tabs) {
      const onTab = calls.filter(([node]) => node === tab);
      expect(onTab).toHaveLength(1);
      expect(onTab[0][1]).toBe(tab.getAttribute('data-tip'));
    }
    const keyed = quickRackPads.filter((p) => !p.empty && p.tip !== undefined).length;
    expect(calls.filter(([node]) => node.matches('.yh-pad'))).toHaveLength(keyed);
    expect(tipAction).toHaveBeenCalledTimes(tabs.length + keyed);
  });

  it('a pad lit for a part wears that part’s tone; the banks’ own pads are neutral', () => {
    setup({ pads: quickRackPads.map((p, i) => (i === 0 ? { ...p, family: 'l' } : p)) });
    expect(screen.getByRole('button', { name: `Rack${NB}1 (pad 1)` })).toHaveAttribute('data-tone', 'hue-4');
    expect(screen.getByRole('button', { name: `Rack${NB}2 (pad 2)` })).toHaveAttribute('data-tone', 'neutral');
  });
});
