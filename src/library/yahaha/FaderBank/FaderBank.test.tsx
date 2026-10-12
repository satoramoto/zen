// FaderBank: every change is a callback with the strip's or lamp's id; the names, clusters,
// soft-takeover note and lamp placement follow the strips given.

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FaderBank, FaderBankRegion, type FaderBankProps } from './FaderBank';
import { faderPageTabs, functionLamps, layerTabs, panelStrips, partLamps, reverbStrips, styleStrips } from './FaderBank.fixtures';

function setup(extra: Partial<FaderBankProps> = {}) {
  const props: FaderBankProps = {
    strips: panelStrips,
    pageTabs: faderPageTabs,
    page: 'panel',
    layerTabs,
    layer: 'volume',
    partLamps,
    functionLamps,
    onChoosePage: vi.fn(),
    onChooseLayer: vi.fn(),
    onLevel: vi.fn(),
    onOpen: vi.fn(),
    onLamp: vi.fn(),
    onLampLong: vi.fn(),
    onLampRelease: vi.fn(),
    onPageButton: vi.fn(),
    onPageLong: vi.fn(),
    onPageRelease: vi.fn(),
    ...extra,
  };
  const r = render(<FaderBankRegion {...props} />);
  return { props, ...r, bank: screen.getByRole('region', { name: 'Mixer' }) };
}

const stripOf = (name: string) => screen.getByRole('slider', { name }).closest('.yh-faderbank__strip') as HTMLElement;

describe('FaderBank a11y', () => {
  it('is one region named Mixer: the pages are its views, the layers its aside, every strip a slider', () => {
    const { bank } = setup();
    // No title: the tabs name themselves. The bank itself is no second region inside the Mixer.
    expect(screen.queryByRole('heading')).toBeNull();
    expect(bank).not.toHaveTextContent(/Layer/);
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toContainElement(screen.getByRole('slider', { name: 'Master, level 100' }));
    expect(screen.getByRole('tablist', { name: 'Mixer' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Fader layer' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Panel' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Volume' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('slider')).toHaveLength(9);
    expect(screen.getByRole('slider', { name: 'Right 2 · Silk Strings, level 72, hardware fader away (soft takeover)' })).toHaveAttribute(
      'aria-valuenow',
      '72',
    );
  });

  it('names each strip button, and leaves the parked strips without one', () => {
    setup();
    for (const name of [
      'Right 1, Stage Grand: open Channel',
      'Right 2, Silk Strings, edited: open Channel',
      'Right 3, Brass Section, plugin missing: open Channel',
      'Left, Finger Bass: open Channel',
      'Style volume: open the Style fader page',
      'Multi Pad volume: open Multi Pads',
      'Master: open Effects, master compressor and EQ',
    ])
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Fader 7 unused' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(stripOf('Fader 7 unused')).queryByRole('button')).toBeNull();
  });

  it('gives an empty slot the banks\' empty face: no name, no level, no hue, still a named disabled slider', () => {
    const { props } = setup();
    const slider = screen.getByRole('slider', { name: 'Fader 8 unused' });
    const strip = stripOf('Fader 8 unused');
    expect(strip).toHaveAttribute('data-kind', 'parked');
    expect(strip).not.toHaveAttribute('data-hue');
    expect(strip.textContent?.trim()).toBe('');
    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    expect(props.onLevel).not.toHaveBeenCalled();
  });

  it('names the part lamps, the function group and the page button', () => {
    setup();
    expect(screen.getByRole('button', { name: /^Right 3 off\./ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /^Right 1 on\./ })).toHaveAttribute('aria-pressed', 'true');
    const functions = screen.getByRole('group', { name: 'Functions' });
    expect(within(functions).getAllByRole('button')).toHaveLength(4);
    // No caption: the keys name themselves.
    expect(functions.textContent).not.toMatch(/Functions/);
    expect(within(functions).getByRole('button', { name: /^Sound: hold/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Fader page is Panel: click for Style' })).toBeInTheDocument();
  });

  it('passes tooltip keys as data-tip and hands them to tipAction', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    const open = screen.getByRole('button', { name: 'Right 1, Stage Grand: open Channel' });
    expect(open).toHaveAttribute('data-tip', 'mixer.strip.select');
    expect(tipAction).toHaveBeenCalledWith(open, 'mixer.strip.select');
    expect(tipAction).toHaveBeenCalledWith(screen.getByRole('slider', { name: 'Master, level 100' }), 'mixer.master');
    expect(tipAction).toHaveBeenCalledWith(screen.getByRole('button', { name: /^Fader page is/ }), 'mixer.page');
  });

  it('gives each tab its own tooltip key, and no control the tooltip twice', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    for (const tab of screen.getAllByRole('tab')) expect(tab.getAttribute('data-tip')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Reverb send' })).toHaveAttribute('data-tip', 'mixer.layer');
    // The page tabs (Region views) and the layer tabs (aside) both run the app's tooltip.
    expect(tipAction).toHaveBeenCalledWith(screen.getByRole('tab', { name: 'Panel' }), 'mixer.page');
    expect(tipAction).toHaveBeenCalledWith(screen.getByRole('tab', { name: 'Reverb send' }), 'mixer.layer');
    // No control gets the tooltip twice.
    const nodes = tipAction.mock.calls.map(([node]) => node);
    expect(new Set(nodes).size).toBe(nodes.length);
  });

  it('leaves the native title off every strip name, so only the app tooltip shows', () => {
    const { bank } = setup();
    expect(bank.querySelectorAll('[title]')).toHaveLength(0);
  });
});

describe('FaderBank callbacks', () => {
  it('a fader key asks for a level with the strip id', async () => {
    const { props } = setup();
    screen.getByRole('slider', { name: 'Left · Finger Bass, level 80' }).focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(props.onLevel).toHaveBeenCalledWith('left', 81);
  });

  it('the name opens the strip, a tab chooses page or layer', async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(screen.getByRole('button', { name: 'Master: open Effects, master compressor and EQ' }));
    expect(props.onOpen).toHaveBeenCalledWith('master');
    await user.click(screen.getByRole('tab', { name: 'Style' }));
    expect(props.onChoosePage).toHaveBeenCalledWith('style');
    await user.click(screen.getByRole('tab', { name: 'Reverb send' }));
    expect(props.onChooseLayer).toHaveBeenCalledWith('reverb');
  });

  it('a lamp asks for !on with its id; a long lamp holds and releases, a plain one has no hold', async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(screen.getByRole('button', { name: /^Right 3 off\./ }));
    expect(props.onLamp).toHaveBeenCalledWith('right3', true);
    await user.click(screen.getByRole('button', { name: 'Harmony/Arpeggio on/off' }));
    expect(props.onLamp).toHaveBeenCalledWith('harmArp', true);
    fireEvent.contextMenu(screen.getByRole('button', { name: /^Chord Looper/ }));
    expect(props.onLampLong).toHaveBeenCalledWith('looper');
    expect(props.onLampRelease).toHaveBeenCalledWith('looper');
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Left Hold on/off' }));
    expect(props.onLampLong).toHaveBeenCalledTimes(1);
  });

  it('the page button flips on a click and holds without flipping', async () => {
    const user = userEvent.setup();
    const { props } = setup();
    const button = screen.getByRole('button', { name: /^Fader page is Panel/ });
    await user.click(button);
    expect(props.onPageButton).toHaveBeenCalledTimes(1);
    fireEvent.contextMenu(button);
    expect(props.onPageLong).toHaveBeenCalledTimes(1);
    expect(props.onPageRelease).toHaveBeenCalledTimes(1);
    expect(props.onPageButton).toHaveBeenCalledTimes(1);
  });
});

describe('FaderBank body', () => {
  it('renders the chosen page body alone: no tabs, no region of its own', () => {
    render(<FaderBank strips={panelStrips} pageTabs={faderPageTabs} page="panel" layerTabs={layerTabs} layer="volume" partLamps={partLamps} functionLamps={functionLamps} />);
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.getAllByRole('slider')).toHaveLength(9);
  });
});

describe('FaderBank layout', () => {
  it('only the parts wear a hue; groups, empty slots and Master stay neutral', () => {
    setup();
    expect(stripOf('Right 1 · Stage Grand, level 90')).toHaveAttribute('data-hue', '1');
    expect(stripOf('Left · Finger Bass, level 80')).toHaveAttribute('data-hue', '4');
    for (const name of ['Style volume, level 100', 'Multi Pad volume, level 90', 'Fader 7 unused', 'Master, level 100'])
      expect(stripOf(name)).not.toHaveAttribute('data-hue');
  });

  it('marks an off part with the word "off", and the strip as off', () => {
    setup();
    const strip = stripOf('Right 3 · Brass Section, level 64, off');
    expect(strip).toHaveAttribute('data-kind', 'off');
    expect(strip.querySelector('[data-mark="off"]')).toHaveTextContent('off');
    expect(strip.querySelector('[data-mark="missing"]')).not.toBeNull();
  });

  it('puts the marks on their own line under the sound, not beside it', () => {
    setup();
    const name = screen.getByRole('button', { name: 'Right 3, Brass Section, plugin missing: open Channel' });
    const sound = name.querySelector('.yh-faderbank__sound') as HTMLElement;
    expect(sound).toHaveTextContent(/^Brass Section$/);
    expect(sound.querySelector('.yh-partmarks')).toBeNull();
    const line = name.querySelector('.yh-faderbank__marks') as HTMLElement;
    expect(line.parentElement).toBe(name);
    expect(sound.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(line.querySelector('[data-mark="off"]')).not.toBeNull();
  });

  it('keeps the marks line on every strip while any has marks, and drops it when none do', () => {
    const { rerender, props, bank } = setup();
    expect(bank.querySelectorAll('.yh-faderbank__strip .yh-faderbank__marks')).toHaveLength(9);
    const plain = panelStrips.map((s) => ({ ...s, kind: s.kind === 'off' ? ('part' as const) : s.kind, edited: false, missing: false, failed: false }));
    rerender(<FaderBankRegion {...props} strips={plain} />);
    expect(bank.querySelectorAll('.yh-faderbank__marks')).toHaveLength(0);
  });

  it('lets every Fader fill its strip (fillHeight)', () => {
    const { bank } = setup();
    const faders = bank.querySelectorAll('.yh-faderbank__strip > .yh-fader');
    expect(faders).toHaveLength(9);
    for (const fader of faders) expect(fader).toHaveAttribute('data-fill-height');
  });

  it('puts dividers between parts, groups and Master, not before the empty slots', () => {
    const { bank } = setup();
    const grid = bank.querySelector('.yh-faderbank__grid') as HTMLElement;
    expect(grid.querySelectorAll('.yh-faderbank__divider')).toHaveLength(2);
    // 9 strips + 2 dividers; the parked slots keep their own tracks, like the hardware, at three quarters of a strip.
    const tracks: string[] = [''];
    let depth = 0;
    for (const ch of grid.style.gridTemplateColumns) {
      if (ch === ' ' && depth === 0) tracks.push('');
      else tracks[tracks.length - 1] += ch;
      depth += ch === '(' ? 1 : ch === ')' ? -1 : 0;
    }
    expect(tracks).toHaveLength(11);
    expect(tracks.filter((t) => t === 'minmax(0, 1fr)')).toHaveLength(6);
    expect(tracks.filter((t) => t === 'minmax(0, 0.75fr)')).toHaveLength(2);
  });

  it('every key in the bank is one height: part lamps, page button and function lamps are cell keys', () => {
    const { bank } = setup();
    const lamps = bank.querySelectorAll('.yh-lampbutton');
    expect(lamps.length).toBe(partLamps.length + functionLamps.length);
    for (const lamp of lamps) expect(lamp).toHaveClass('yh-lampbutton--cell');
    expect(screen.getByRole('button', { name: /^Fader page/ })).toHaveAttribute('data-size', 'cell');
  });

  it('places each part lamp under its strip and the page button under Master', () => {
    const { bank } = setup();
    const column = (el: Element | null) => (el?.closest('.yh-faderbank__lamp, .yh-faderbank__strip') as HTMLElement).style.gridColumn;
    expect(column(screen.getByRole('button', { name: /^Left on\./ }))).toBe(column(screen.getByRole('slider', { name: /^Left ·/ })));
    expect(column(screen.getByRole('button', { name: /^Fader page/ }))).toBe(column(screen.getByRole('slider', { name: 'Master, level 100' })));
    expect(bank.querySelector('.yh-faderbank__plate')).not.toBeNull();
  });

  it('says a soft takeover in words to assistive tech, with the way to move, and outlines the strip', () => {
    const { rerender, props } = setup();
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent('Soft takeover Right 2 move up to 72');
    expect(note).toHaveClass('yh-faderbank__visually-hidden');
    expect(stripOf(props.strips[1].faderName)).toHaveAttribute('data-away', 'up');
    rerender(<FaderBankRegion {...props} strips={panelStrips.map((s) => (s.id === 'right2' ? { ...s, away: 110 } : s))} />);
    expect(screen.getByRole('status')).toHaveTextContent('Right 2 move down to 72');
    rerender(<FaderBankRegion {...props} strips={panelStrips.map((s) => ({ ...s, away: undefined }))} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('a non-Vol layer shows as its chosen tab and gives only the part strips the layer look', () => {
    setup({ layer: 'reverb', strips: reverbStrips });
    expect(screen.getByRole('tab', { name: 'Reverb send' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('slider', { name: 'Right 1 · Stage Grand, Reverb 40' })).toHaveAttribute('data-layered', 'true');
    expect(screen.getByRole('slider', { name: 'Master, level 100' })).not.toHaveAttribute('data-layered');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('the Style page has no hued strip and still puts the page button under Master', () => {
    setup({ page: 'style', strips: styleStrips });
    expect(document.querySelectorAll('.yh-faderbank__strip[data-hue]')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Fader page is Style: click for Panel' })).toBeInTheDocument();
  });
});
