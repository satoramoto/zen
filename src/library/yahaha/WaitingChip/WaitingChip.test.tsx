import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaitingChip } from './WaitingChip';

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

  it('defaults to neutral at the count size', () => {
    render(<WaitingChip label="Main C" />);
    const chip = screen.getByText('Main C');
    expect(chip).toHaveAttribute('data-hue', 't');
    expect(chip).toHaveAttribute('data-size', 'count');
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
