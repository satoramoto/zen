import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { HueLegend, SECTION_HUE, type HueLegendItem } from './HueLegend';

const SECTIONS: HueLegendItem[] = [
  { label: 'Intro', hue: 'intro' },
  { label: 'Main', hue: 'main' },
  { label: 'Fill', hue: 'fill' },
];

describe('HueLegend', () => {
  it('lists the four parts left to right under one name by default (Board)', () => {
    render(<HueLegend />);
    const list = screen.getByRole('list', { name: 'Part colours' });
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Right 1', 'Right 2', 'Right 3', 'Left']);
  });

  it('gives each part its categorical hue (r1..l → 1..4)', () => {
    render(<HueLegend items={[{ label: 'L', part: 'l' }, { label: 'R1', part: 'r1' }, { label: 'R3', part: 'r3' }, { label: 'R2', part: 'r2' }]} />);
    expect(screen.getAllByRole('listitem').map((li) => li.getAttribute('data-hue'))).toEqual(['4', '1', '3', '2']);
  });

  it('still renders old section items, with no hue', () => {
    render(<HueLegend items={SECTIONS} label="Section colours" />);
    const items = within(screen.getByRole('list', { name: 'Section colours' })).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['Intro', 'Main', 'Fill']);
    expect(items.map((li) => li.getAttribute('data-hue'))).toEqual([null, null, null]);
    expect(Object.values(SECTION_HUE).every((h) => h === undefined)).toBe(true);
  });

  it('keeps the chips out of the accessible text', () => {
    const { container } = render(<HueLegend />);
    const chips = container.querySelectorAll('.yh-huelegend__chip');
    expect(chips).toHaveLength(4);
    for (const chip of chips) expect(chip).toHaveAttribute('aria-hidden', 'true');
  });

  it('is not a control', () => {
    render(<HueLegend />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
