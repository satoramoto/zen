import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RackCell } from './RackCell';

describe('RackCell', () => {
  it('speaks the rack, its slot and what a press does', () => {
    render(<RackCell rack="Sunday drive" slot="A1" tip="nav.rack" />);
    const button = screen.getByRole('button', { name: 'Rack: Sunday drive, on Quick Rack A1. Opens the Rack page' });
    expect(button).toHaveTextContent('Rack·A1Sunday drive');
    expect(button).toHaveAttribute('data-tip', 'nav.rack');
  });

  it('leaves the slot out when there is none', () => {
    const { container } = render(<RackCell rack="Ballad night" />);
    expect(screen.getByRole('button', { name: 'Rack: Ballad night. Opens the Rack page' })).toBeTruthy();
    expect(container.querySelector('.yh-rack-cell__slot')).toBeNull();
    expect(container.querySelector('.yh-rack-cell__separator')).toBeNull();
  });

  it('falls back to "No rack" for an empty name, and takes a name override', () => {
    const { container, rerender } = render(<RackCell rack="  " />);
    expect(screen.getByRole('button', { name: 'Rack: No rack. Opens the Rack page' })).toHaveTextContent('No rack');
    expect(container.querySelector('.yh-rack-cell__name')).toHaveAttribute('data-empty', 'true');
    rerender(<RackCell rack="Sunday drive" name="Open rack" />);
    expect(screen.getByRole('button', { name: 'Open rack' })).toBeTruthy();
  });

  it('calls onPress on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<RackCell rack="Sunday drive" slot="A1" onPress={onPress} />);
    const button = screen.getByRole('button');
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('renders the mark after the name', () => {
    const { container } = render(<RackCell rack="Sunday drive" mark={<i data-testid="dot" />} />);
    expect(container.querySelector('.yh-rack-cell__mark')).toContainElement(screen.getByTestId('dot'));
  });
});
