import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { HueLegend, type HueLegendItem } from './HueLegend';

const ITEMS: HueLegendItem[] = [
  { label: 'Intro', hue: 'intro' },
  { label: 'Main', hue: 'main' },
  { label: 'Ending', hue: 'ending' },
  { label: 'Break', hue: 'brk' },
  { label: 'Fill', hue: 'fill' },
];

describe('HueLegend', () => {
  it('lists the words left to right under one name (Board)', () => {
    render(<HueLegend items={ITEMS} />);
    const list = screen.getByRole('list', { name: 'Section colours' });
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Intro', 'Main', 'Ending', 'Break', 'Fill']);
  });

  it('gives four sections the four categorical hues and Fill none', () => {
    render(<HueLegend items={ITEMS} />);
    const hues = screen.getAllByRole('listitem').map((li) => li.getAttribute('data-hue'));
    expect(hues).toEqual(['1', '2', '3', '4', null]);
  });

  it('keeps the chips out of the accessible text', () => {
    const { container } = render(<HueLegend items={ITEMS} />);
    const chips = container.querySelectorAll('.yh-huelegend__chip');
    expect(chips).toHaveLength(5);
    for (const chip of chips) expect(chip).toHaveAttribute('aria-hidden', 'true');
  });

  it('is not a control', () => {
    render(<HueLegend items={ITEMS} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
