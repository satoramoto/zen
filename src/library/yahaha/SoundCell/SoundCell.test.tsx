import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SoundCell } from './SoundCell';

const board = { part: 'R1', partName: 'Right 1', hue: 'r1' as const, number: '1', sound: 'Stage Grand' };

describe('SoundCell', () => {
  it('names both buttons for a listener', () => {
    render(<SoundCell {...board} />);
    expect(screen.getByRole('button', { name: 'Right 1: open Channel' })).toHaveTextContent('R1');
    expect(
      screen.getByRole('button', { name: 'Right 1 sound: 1 Stage Grand. Opens the quick sound list' }),
    ).toHaveTextContent('1Stage Grand');
  });

  it('leaves the number out of the spoken name when there is none, and takes an override', () => {
    const { rerender } = render(<SoundCell {...board} number="" />);
    expect(screen.getByRole('button', { name: 'Right 1 sound: Stage Grand. Opens the quick sound list' })).toBeTruthy();
    rerender(<SoundCell {...board} soundName="Piano" />);
    expect(screen.getByRole('button', { name: 'Piano' })).toBeTruthy();
  });

  it('calls onPart and onSound on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onPart = vi.fn();
    const onSound = vi.fn();
    render(<SoundCell {...board} onPart={onPart} onSound={onSound} />);
    await user.click(screen.getByRole('button', { name: /open Channel/ }));
    expect(onPart).toHaveBeenCalledTimes(1);
    expect(onSound).not.toHaveBeenCalled();

    const sound = screen.getByRole('button', { name: /quick sound list/ });
    await user.click(sound);
    sound.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onSound).toHaveBeenCalledTimes(3);
  });

  it('marks the part off and its hue, keeps the title and tips', () => {
    const { container } = render(<SoundCell {...board} hue="r3" off partTip="mixer.strip.select" soundTip="x.sound" />);
    const cell = container.querySelector('.yh-sound-cell')!;
    expect(cell).toHaveAttribute('data-off', 'true');
    expect(cell).toHaveAttribute('data-hue', 'r3');
    const part = screen.getByRole('button', { name: /open Channel/ });
    expect(part).toHaveAttribute('title', 'Right 1');
    expect(part).toHaveAttribute('data-tip', 'mixer.strip.select');
    expect(screen.getByRole('button', { name: /quick sound list/ })).toHaveAttribute('data-tip', 'x.sound');
  });

  it('renders marks after the name', () => {
    const { container } = render(<SoundCell {...board} marks={<i data-testid="mark" />} />);
    expect(container.querySelector('.yh-sound-cell__marks')).toContainElement(screen.getByTestId('mark'));
  });
});
