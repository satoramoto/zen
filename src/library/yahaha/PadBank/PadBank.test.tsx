// PadBank: five banks with Sections first, tabs choose by index with tips by name, a press carries
// the pad's index, an empty pad is quiet and inert, a playing section fills while other on pads
// ring, every pad is square, and the layout and flash pass through.

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PadBank, PadBankRegion, bankOnFace, type PadBankProps } from './PadBank';
import { allPadBanks, allPadsByBank, chordPads, padBanks, quickRackPads, quickRackStorePads, sectionPads } from './PadBank.fixtures';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// jsdom lays nothing out, so squareness is checked on the stylesheet (and in the stories' play
// functions, which measure in a browser). Tests run from the repo root.
const padBankCss = readFileSync(join(process.cwd(), 'src/library/yahaha/PadBank/PadBank.css'), 'utf8');

afterEach(() => cleanup());

/** A label's numeral is tied to its word with a no-break space, and the name keeps it. */
const NB = ' ';

function setup(props: Partial<PadBankProps> = {}) {
  const onBank = vi.fn<(index: number) => void>();
  const onPress = vi.fn<(index: number) => void>();
  const view = render(<PadBankRegion pads={quickRackPads} banks={padBanks} bank={0} onBank={onBank} onPress={onPress} {...props} />);
  return { onBank, onPress, container: view.container };
}

describe('PadBank banks', () => {
  it('is a region named Pads, with the five banks as tabs, Sections first', () => {
    setup({ banks: allPadBanks, bank: 3 });
    const region = screen.getByRole('region', { name: 'Pads' });
    const list = within(region).getByRole('tablist', { name: 'Pads' });
    expect(within(list).getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Sections',
      'Quick Racks',
      'Chord',
      'Multi Pads',
      'Setup',
    ]);
    expect(within(list).getByRole('tab', { name: 'Multi Pads' })).toHaveAttribute('aria-selected', 'true');
  });

  it('has no title and no region inside the region: the bank is the tab panel', () => {
    setup();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toContainElement(screen.getByRole('button', { name: 'Store (pad 15)' }));
  });

  it('the bank alone draws the pads and no tabs', () => {
    render(<PadBank pads={quickRackPads} banks={padBanks} bank={0} />);
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('an on pad takes the ring face, not the solid fill', () => {
    const { container } = setup();
    const pads = container.querySelectorAll('.yh-padbank__cell .yh-pad');
    expect(pads.length).toBeGreaterThan(0);
    for (const pad of pads) expect(pad).toHaveAttribute('data-on-face', 'ring');
  });

  it('drops the ARMED chips when more than two pads are armed, keeps them for one or two', () => {
    const { container } = setup({ pads: quickRackStorePads });
    expect(quickRackStorePads.filter((p) => p.state === 'armed').length).toBeGreaterThan(2);
    expect(container.querySelector('.yh-padbank')).toHaveAttribute('data-armed', 'many');
    cleanup();
    const two = quickRackPads.map((pad, i) => (i < 2 ? { ...pad, state: 'armed' as const } : pad));
    const view = setup({ pads: two });
    expect(view.container.querySelector('.yh-padbank')).not.toHaveAttribute('data-armed');
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

  it('gives each bank tab its tooltip key, and the hook once to each tab and each pad', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    const calls = tipAction.mock.calls as [HTMLElement, string][];
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    for (const tab of tabs) {
      expect(tab.getAttribute('data-tip')).toBeTruthy();
      expect(tipAction).toHaveBeenCalledWith(tab, tab.getAttribute('data-tip'));
    }
    const keyed = quickRackPads.filter((p) => !p.empty && p.tip !== undefined).length;
    expect(calls.filter(([node]) => node.matches('.yh-pad'))).toHaveLength(keyed);
    expect(tipAction).toHaveBeenCalledTimes(keyed + tabs.length);
  });

  it('a pad lit for a part wears that part’s tone; the banks’ own pads are neutral', () => {
    setup({ pads: quickRackPads.map((p, i) => (i === 0 ? { ...p, family: 'l' } : p)) });
    expect(screen.getByRole('button', { name: `Rack${NB}1 (pad 1)` })).toHaveAttribute('data-tone', 'hue-4');
    expect(screen.getByRole('button', { name: `Rack${NB}2 (pad 2)` })).toHaveAttribute('data-tone', 'neutral');
  });
});

describe('PadBank Sections bank', () => {
  const setupSections = () => setup({ pads: sectionPads, banks: allPadBanks, bank: 0 });

  it('is the first bank, with its tooltip key', () => {
    expect(allPadBanks[0]).toBe('Sections');
    expect(allPadsByBank[0]).toBe(sectionPads);
    setupSections();
    const tab = screen.getByRole('tab', { name: 'Sections' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('data-tip', 'padpage.sections');
  });

  it('has the Launchkey’s sixteen pads in order, named, with what plays and runs pressed', () => {
    setupSections();
    const pads = screen.getAllByRole('button');
    expect(pads.map((pad) => pad.querySelector('.yh-pad__label')?.textContent?.replace(/\s/g, ' '))).toEqual([
      'Intro I',
      'Intro II',
      'Intro III',
      'Sync Start',
      'Ending I',
      'Ending II',
      'Ending III',
      'Auto Fill',
      'Main A',
      'Main B',
      'Main C',
      'Main D',
      'Break',
      'Tap',
      'Sync Stop',
      'Start / Stop',
    ]);
    const pressed = pads.filter((pad) => pad.getAttribute('aria-pressed') === 'true').map((pad) => pad.getAttribute('aria-label'));
    expect(pressed).toEqual(['Main B, playing', 'Start / Stop, running (pad 16; the transport Start / Stop is the same control)']);
    expect(screen.getByRole('button', { name: `Intro${NB}I (pad 1)` })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Tap (pad 14)' })).toHaveAttribute('data-tip', 'tempo.tap');
  });

  it('absent sections are dark and spoken “not in this style”; next is the accent ring', () => {
    setupSections();
    for (const name of ['Intro III (not in this style)', 'Ending III (not in this style)']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('data-state', 'dark');
    }
    const next = screen.getByRole('button', { name: 'Main C, queued after bar 4 (flashing)' });
    expect(next).toHaveAttribute('data-state', 'next');
    expect(next).toHaveAttribute('data-next', 'accent');
  });

  it('a playing section fills (it is sounding); every other family rings', () => {
    setupSections();
    expect(screen.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('data-on-face', 'fill');
    for (const name of [`Intro${NB}I (pad 1)`, 'Break (pad 13)', `Ending${NB}II (pad 6)`]) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('data-on-face', 'fill');
    }
    for (const name of ['Sync Start (pad 4)', 'Auto Fill (pad 8)', 'Tap (pad 14)', 'Sync Stop (pad 15)']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('data-on-face', 'ring');
    }
    expect(['intro', 'main', 'ending', 'brk', 'fill'].map((f) => bankOnFace(f as never))).toEqual(Array(5).fill('fill'));
    expect(['util', 'start', 'r1', 'r2', 'r3', 'l'].map((f) => bankOnFace(f as never))).toEqual(Array(6).fill('ring'));
  });

  it('transport pads are neutral at rest; Start / Stop running is success', () => {
    setupSections();
    for (const name of ['Sync Start (pad 4)', 'Auto Fill (pad 8)', 'Tap (pad 14)', 'Sync Stop (pad 15)']) {
      const pad = screen.getByRole('button', { name });
      expect(pad).toHaveAttribute('data-tone', 'role-2');
      expect(pad).toHaveAttribute('data-state', 'idle');
    }
    expect(screen.getByRole('button', { name: /^Start \/ Stop, running/ })).toHaveAttribute('data-tone', 'success');
    expect(screen.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('data-tone', 'neutral');
  });
});

describe('PadBank shape', () => {
  /** The declarations of the first rule whose selector is exactly `selector`. */
  const rule = (selector: string) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = padBankCss.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`));
    if (!match) throw new Error(`no rule for ${selector}`);
    return match[1].replace(/\s+/g, ' ');
  };

  it('sizes columns and rows by one cell side, so every pad is a square', () => {
    const pads = rule('.yh-padbank__pads');
    expect(pads).toContain('grid-template-columns: repeat(var(--yh-padbank-cols), var(--yh-padbank-cell));');
    expect(pads).toContain('grid-auto-rows: var(--yh-padbank-cell);');
    // The side is the tighter of the room's width over the columns and its height over the rows.
    expect(pads).toMatch(/--yh-padbank-cell: max\( 0px, min\( \(100cqw - .*\) \/ var\(--yh-padbank-cols\), \(100cqh - .*\) \/ var\(--yh-padbank-rows\) \) \);/);
    expect(rule('.yh-padbank__cell')).toContain('aspect-ratio: 1;');
  });

  it('measures a sized room and hangs the grid under the tabs, centred across', () => {
    const room = rule('.yh-padbank__room');
    expect(room).toContain('container-type: size;');
    expect(room).toContain('place-content: start center;');
  });

  it('keeps at least --space-2 between pads', () => {
    expect(rule('.yh-padbank__pads')).toContain('--yh-padbank-gap: clamp(var(--space-2),');
  });

  it('the room and the grid carry the column count', () => {
    const { container } = setup({ columns: 4 });
    expect(container.querySelector('.yh-padbank__room')).toHaveAttribute('data-columns', '4');
    expect(container.querySelector('.yh-padbank__room > .yh-padbank__pads')).toHaveAttribute('data-columns', '4');
  });
});
