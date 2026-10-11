import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusDot } from './StatusDot';

const dotOf = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-hue]')!;

describe('StatusDot', () => {
  it('is a decorative solid glowing md dot by default', () => {
    const { container } = render(<StatusDot />);
    const dot = dotOf(container);
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).toHaveAttribute('data-hue', 'ok');
    expect(dot).toHaveAttribute('data-face', 'solid');
    expect(dot).toHaveAttribute('data-glow', 'true');
    expect(dot).toHaveAttribute('data-size', 'md');
    expect(dot.style.visibility).toBe('');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('never glows when hollow, and not when glow is off', () => {
    const { container, rerender } = render(<StatusDot hue="d" hollow />);
    expect(dotOf(container)).toHaveAttribute('data-face', 'hollow');
    expect(dotOf(container)).toHaveAttribute('data-glow', 'false');
    rerender(<StatusDot size="sm" hue="t" glow={false} />);
    expect(dotOf(container)).toHaveAttribute('data-size', 'sm');
    expect(dotOf(container)).toHaveAttribute('data-hue', 't');
    expect(dotOf(container)).toHaveAttribute('data-glow', 'false');
  });

  it('hidden keeps its box and every data attribute', () => {
    const { container } = render(<StatusDot hue="main" visible={false} />);
    const dot = dotOf(container);
    expect(dot.style.visibility).toBe('hidden');
    expect(dot).toHaveAttribute('data-hue', 'main');
    expect(dot).toHaveAttribute('data-face', 'solid');
  });

  it('gives every section the playing role, never a hue, and no inline tone to the others', () => {
    for (const hue of ['intro', 'main', 'ending', 'brk', 'fill'] as const) {
      const { container, unmount } = render(<StatusDot hue={hue} />);
      expect(dotOf(container).style.getPropertyValue('--yh-status-dot-hue')).toBe('var(--selected)');
      unmount();
    }
    for (const hue of ['ok', 'd', 't'] as const) {
      const { container, unmount } = render(<StatusDot hue={hue} />);
      expect(dotOf(container).getAttribute('style')).toBeNull();
      unmount();
    }
  });

  it('a name makes it an image, solid or hollow', () => {
    const { rerender } = render(<StatusDot hue="ok" name="Running" />);
    const dot = screen.getByRole('img', { name: 'Running' });
    expect(dot).not.toHaveAttribute('aria-hidden');
    rerender(<StatusDot hue="ok" hollow name="Sync start armed" />);
    expect(screen.getByRole('img', { name: 'Sync start armed' })).toHaveAttribute('data-face', 'hollow');
  });

  it('a hidden named dot is silent', () => {
    const { container } = render(<StatusDot hue="ok" name="Running" visible={false} />);
    expect(screen.queryByRole('img')).toBeNull();
    const dot = dotOf(container);
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).not.toHaveAttribute('aria-label');
  });
});
