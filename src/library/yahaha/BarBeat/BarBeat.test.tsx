import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarBeat, beatState } from './BarBeat';

const states = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-state]')).map((s) => s.getAttribute('data-state'));

describe('BarBeat', () => {
  it('speaks the beat as one image and hides the segments', () => {
    const { container } = render(<BarBeat beat={2} beats={4} hue="main" />);
    const bar = screen.getByRole('img', { name: 'Beat 2 of 4' });
    expect(bar).toHaveAttribute('data-hue', 'main');
    for (const s of container.querySelectorAll('[data-state]')) expect(s).toHaveAttribute('aria-hidden', 'true');
    expect(states(container)).toEqual(['past', 'current', 'future', 'future']);
  });

  it('stopped: every segment at rest', () => {
    const { container } = render(<BarBeat beat={0} beats={4} />);
    expect(screen.getByRole('img', { name: 'Stopped' })).toBeInTheDocument();
    expect(states(container)).toEqual(['future', 'future', 'future', 'future']);
  });

  it('a 3/4 bar on its last beat', () => {
    const { container } = render(<BarBeat beat={3} beats={3} hue="ending" />);
    expect(screen.getByRole('img', { name: 'Beat 3 of 3' })).toHaveAttribute('data-hue', 'ending');
    expect(states(container)).toEqual(['past', 'past', 'current']);
  });

  it('keeps at least one segment', () => {
    const { container } = render(<BarBeat beat={0} beats={0} />);
    expect(states(container)).toHaveLength(1);
  });

  it('defaults to a stopped 4-beat bar in main', () => {
    const { container } = render(<BarBeat />);
    expect(screen.getByRole('img', { name: 'Stopped' })).toHaveAttribute('data-hue', 'main');
    expect(states(container)).toHaveLength(4);
  });

  it('beatState orders past, current and future', () => {
    expect([1, 2, 3].map((n) => beatState(n, 2))).toEqual(['past', 'current', 'future']);
    expect(beatState(1, -1)).toBe('future');
  });
});
