import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarBeat, beatState } from './BarBeat';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// jsdom gives import.meta.url a non-file scheme and vitest skips CSS; tests run from the repo root.
const css = readFileSync(join(process.cwd(), 'src/library/yahaha/BarBeat/BarBeat.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const states = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-state]')).map((s) => s.getAttribute('data-state'));

const tone = (bar: HTMLElement) => bar.style.getPropertyValue('--yh-bar-beat-tone');

describe('BarBeat', () => {
  it('speaks the beat as one image and hides the segments', () => {
    const { container } = render(<BarBeat beat={2} beats={4} />);
    screen.getByRole('img', { name: 'Beat 2 of 4' });
    for (const s of container.querySelectorAll('[data-state]')) expect(s).toHaveAttribute('aria-hidden', 'true');
    expect(states(container)).toEqual(['past', 'current', 'future', 'future']);
  });

  it('wears the playing role, never a section hue, whatever section is passed', () => {
    for (const hue of ['intro', 'main', 'ending', 'brk', 'fill'] as const) {
      const { unmount } = render(<BarBeat beat={1} hue={hue} />);
      const bar = screen.getByRole('img');
      expect(tone(bar)).toBe('var(--selected)');
      expect(bar).not.toHaveAttribute('data-hue');
      unmount();
    }
  });

  it('stopped: every segment at rest', () => {
    const { container } = render(<BarBeat beat={0} beats={4} />);
    expect(screen.getByRole('img', { name: 'Stopped' })).toBeInTheDocument();
    expect(states(container)).toEqual(['future', 'future', 'future', 'future']);
  });

  it('a 3/4 bar on its last beat', () => {
    const { container } = render(<BarBeat beat={3} beats={3} />);
    expect(screen.getByRole('img', { name: 'Beat 3 of 3' })).toBeInTheDocument();
    expect(states(container)).toEqual(['past', 'past', 'current']);
  });

  it('keeps at least one segment', () => {
    const { container } = render(<BarBeat beat={0} beats={0} />);
    expect(states(container)).toHaveLength(1);
  });

  it('defaults to a stopped 4-beat bar in the playing role', () => {
    const { container } = render(<BarBeat />);
    expect(tone(screen.getByRole('img', { name: 'Stopped' }))).toBe('var(--selected)');
    expect(states(container)).toHaveLength(4);
  });

  it('rests on a tint of the text, not the strong border (equal to the text on some packs)', () => {
    const rule = /\.yh-bar-beat__segment\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toContain('color-mix(in srgb, var(--text-1) 16%, var(--surface-0))');
    expect(rule).not.toContain('--border-strong');
  });

  it('thickness sets the resting line inline; without it the CSS default stands', () => {
    const { rerender } = render(<BarBeat beat={1} thickness="6px" />);
    const bar = screen.getByRole('img');
    expect(bar.style.getPropertyValue('--yh-bar-beat-line')).toBe('6px');
    rerender(<BarBeat beat={1} />);
    expect(bar.style.getPropertyValue('--yh-bar-beat-line')).toBe('');
  });

  it('beatState orders past, current and future', () => {
    expect([1, 2, 3].map((n) => beatState(n, 2))).toEqual(['past', 'current', 'future']);
    expect(beatState(1, -1)).toBe('future');
  });
});
