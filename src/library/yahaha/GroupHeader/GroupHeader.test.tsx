import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupHeader } from './GroupHeader';

type Tab = { id: string; label: string; tip?: string };

/** Stand-in tab run, as the stories use. */
function Tabs({ label, tabs, chosen, onchoose }: { label: string; tabs: Tab[]; chosen: string; onchoose: (id: string) => void }) {
  return (
    <span role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" role="tab" aria-selected={tab.id === chosen} data-tip={tab.tip} onClick={() => onchoose(tab.id)}>
          {tab.label}
        </button>
      ))}
    </span>
  );
}

const PAGES: Tab[] = [
  { id: 'panel', label: 'Panel', tip: 'mixer.page' },
  { id: 'style', label: 'Style', tip: 'mixer.page' },
];
const LAYERS: Tab[] = [
  { id: 'volume', label: 'Vol', tip: 'mixer.layer' },
  { id: 'pan', label: 'Pan', tip: 'mixer.layer' },
];
const KNOB_PAGES = ['Style', 'Rack', 'Pan', 'Reverb', 'Chorus', 'Delay'].map((label, i) => ({ id: String(i), label, tip: 'knobs.page' }));
const PAD_BANKS = ['Sections', 'Quick Racks', 'Chord', 'Multi Pads', 'Setup'].map((label, i) => ({
  id: String(i),
  label,
  tip: ['padpage.sections', 'padpage.racks', 'padpage.chord', 'padpage.multi_pads', 'padpage.setup'][i],
}));
const LEGEND = ['Intro', 'Main', 'Ending', 'Break', 'Fill'];

describe('GroupHeader', () => {
  it('Board: a level-2 heading, both tab runs, no counter; each run reports its own choice', async () => {
    const onchoosePage = vi.fn();
    const onchooseLayer = vi.fn();
    render(
      <GroupHeader title="Faders" width={646}>
        <Tabs label="Fader page (master button)" tabs={PAGES} chosen="panel" onchoose={onchoosePage} />
        <span>Layer</span>
        <Tabs label="Fader layer" tabs={LAYERS} chosen="volume" onchoose={onchooseLayer} />
      </GroupHeader>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Faders' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Fader page (master button)' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Fader layer' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Panel' })).toHaveAttribute('data-tip', 'mixer.page');
    expect(screen.queryByText(/Page|Bank/)).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Style' }));
    expect(onchoosePage).toHaveBeenCalledTimes(1);
    expect(onchoosePage).toHaveBeenCalledWith('style');
    await userEvent.click(screen.getByRole('tab', { name: 'Pan' }));
    expect(onchooseLayer).toHaveBeenCalledTimes(1);
    expect(onchooseLayer).toHaveBeenCalledWith('pan');
  });

  it('Knobs: the chosen page and a click on another', async () => {
    const onchooseBank = vi.fn();
    render(
      <GroupHeader title="Knobs" width={666}>
        <Tabs label="Knob page" tabs={KNOB_PAGES} chosen="0" onchoose={onchooseBank} />
      </GroupHeader>,
    );
    expect(screen.getByRole('heading', { name: 'Knobs' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Reverb' }));
    expect(onchooseBank).toHaveBeenCalledWith('3');
  });

  it('Pads: the legend sits in order after the tabs, at the right end', () => {
    const { container } = render(
      <GroupHeader
        title="Pads"
        width={666}
        end={LEGEND.map((word) => (
          <span key={word}>{word}</span>
        ))}
      >
        <Tabs label="Pad bank" tabs={PAD_BANKS} chosen="0" onchoose={() => {}} />
      </GroupHeader>,
    );
    expect(screen.getByRole('heading', { name: 'Pads' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sections' })).toHaveAttribute('data-tip', 'padpage.sections');
    const text = container.textContent ?? '';
    const order = LEGEND.map((word) => text.lastIndexOf(word));
    expect(order.every((at) => at >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(text.indexOf('Setup')).toBeLessThan(order[0]);
  });

  it('names the heading with its detail and keeps level and id', () => {
    render(<GroupHeader title="Faders" detail="Reverb" level={3} id="faders-head" />);
    const heading = screen.getByRole('heading', { level: 3, name: 'Faders · Reverb' });
    expect(heading).toHaveAttribute('id', 'faders-head');
  });

  it('draws the counter as one run after the legend', () => {
    const { container } = render(<GroupHeader title="Knobs" end={<span>Legend</span>} count={{ label: 'Page', value: '1/6' }} />);
    const count = container.querySelector('.yh-group-header__count')!;
    expect(count).toHaveTextContent('Page 1/6');
    expect(container.textContent!.indexOf('Legend')).toBeLessThan(container.textContent!.indexOf('Page'));
  });

  it('fills its container unless given a width, and draws nothing extra for a bare title', () => {
    const { container, rerender } = render(<GroupHeader title="Transport" />);
    const row = container.querySelector<HTMLElement>('.yh-group-header')!;
    expect(row.style.width).toBe('');
    expect(container.querySelector('.yh-group-header__body')).toBeNull();
    expect(container.querySelector('.yh-group-header__end')).toBeNull();
    expect(container.querySelector('.yh-group-header__count')).toBeNull();
    rerender(<GroupHeader title="Transport" width={88} />);
    expect(row.style.width).toBe('88px');
  });
});
