import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SendReadout } from './SendReadout';

describe('SendReadout', () => {
  it('speaks the three sends and where it goes', () => {
    render(<SendReadout reverb={40} chorus={12} delay={0} tip="display.band_sends" />);
    const button = screen.getByRole('button', { name: 'Band sends: reverb 40, chorus 12, delay 0. Opens Effects' });
    expect(button).toHaveAttribute('data-tip', 'display.band_sends');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('uses the lead word in the name, and a given name over it', () => {
    const { rerender } = render(<SendReadout reverb={1} chorus={2} delay={3} label="Song" />);
    expect(screen.getByRole('button', { name: 'Song sends: reverb 1, chorus 2, delay 3. Opens Effects' })).toBeInTheDocument();
    rerender(<SendReadout reverb={1} chorus={2} delay={3} name="Effects" />);
    expect(screen.getByRole('button', { name: 'Effects' })).toBeInTheDocument();
  });

  it('shows each level and marks a send at 0 as off', () => {
    render(<SendReadout reverb={40} chorus={12} delay={0} />);
    const sends = screen.getByRole('button').querySelectorAll('.yh-send-readout-send');
    expect([...sends].map((s) => s.textContent)).toEqual(['Reverb40', 'Chorus12', 'Delay0']);
    expect([...sends].map((s) => s.hasAttribute('data-off'))).toEqual([false, false, true]);
  });

  it('presses on a click, Enter and Space', async () => {
    const onPress = vi.fn();
    render(<SendReadout reverb={40} chorus={12} delay={0} onPress={onPress} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });
});
