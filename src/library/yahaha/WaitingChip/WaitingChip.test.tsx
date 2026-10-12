import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WaitingChip } from './WaitingChip';

// jsdom gives import.meta.url a non-file scheme and vitest skips CSS; tests run from the repo root.
const css = readFileSync(join(process.cwd(), 'src/library/yahaha/WaitingChip/WaitingChip.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('WaitingChip style hue', () => {
  it("tints a queued style's arrow in the style's role hue", () => {
    const rule = /\.yh-waiting-chip\[data-hue='a'\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/--yh-waiting-chip-hue:\s*var\(--style\)/);
  });
});

describe('WaitingChip', () => {
  it('draws the label with its hooks and nothing focusable', () => {
    const { container } = render(<WaitingChip label="Main C" hue="main" size="count" />);
    const chip = screen.getByText('Main C');
    expect(chip).toHaveAttribute('data-face', 'waiting');
    expect(chip).toHaveAttribute('data-hue', 'main');
    expect(chip).toHaveAttribute('data-size', 'count');
    expect(chip).toHaveTextContent(/^Main C$/);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('a[href], button, input, select, textarea, [tabindex]')).toBeNull();
  });

  it('draws the default arrow in --accent (next) and scales the line cap with the density', () => {
    const root = css.match(/\.yh-waiting-chip\s*\{([^}]*)\}/)![1];
    expect(root).toMatch(/--yh-waiting-chip-hue:\s*var\(--accent\)/);
    expect(root).toMatch(/--yh-waiting-chip-max:\s*calc\(var\(--control-h\) \* 6\)/);
    expect(css).not.toMatch(/\d+px/);
  });

  it('defaults to neutral at the count size', () => {
    render(<WaitingChip label="Main C" />);
    const chip = screen.getByText('Main C');
    expect(chip).toHaveAttribute('data-hue', 't');
    expect(chip).toHaveAttribute('data-size', 'count');
  });

  it('a waiting section reads the "next" role, never a hue; a style and neutral need no inline tone', () => {
    for (const hue of ['intro', 'main', 'ending', 'brk', 'fill'] as const) {
      const { unmount } = render(<WaitingChip label="Next" hue={hue} />);
      expect(screen.getByText('Next').style.getPropertyValue('--yh-waiting-chip-hue')).toBe('var(--accent)');
      unmount();
    }
    for (const hue of ['a', 't'] as const) {
      const { unmount } = render(<WaitingChip label="Next" hue={hue} />);
      expect(screen.getByText('Next').getAttribute('style')).toBeNull();
      unmount();
    }
  });

  it('a queued style on the line', () => {
    render(<WaitingChip label="Coastal Highway" hue="a" size="line" />);
    const chip = screen.getByText('Coastal Highway');
    expect(chip).toHaveAttribute('data-hue', 'a');
    expect(chip).toHaveAttribute('data-size', 'line');
  });

  it('an empty or whitespace-only label renders nothing', () => {
    const { container, rerender } = render(<WaitingChip label="" hue="main" />);
    expect(container.querySelector('[data-face]')).toBeNull();
    expect(container).toBeEmptyDOMElement();
    rerender(<WaitingChip label="   " />);
    expect(container).toBeEmptyDOMElement();
  });

  it('draws the label untrimmed, with the arrow hidden from assistive tech', () => {
    const { container } = render(<WaitingChip label=" Break " hue="brk" />);
    const chip = container.querySelector('[data-face]')!;
    expect(chip.textContent).toBe(' Break ');
    expect(chip.querySelector('.yh-waiting-chip__arrow')).toHaveAttribute('aria-hidden', 'true');
  });
});
