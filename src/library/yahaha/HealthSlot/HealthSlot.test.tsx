import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HealthSlot } from './HealthSlot';

const hue = (container: HTMLElement) => container.querySelector('[data-hue]');

describe('HealthSlot', () => {
  it('calm: says "Audio health: fine", hides the visible text, has no button', () => {
    const { container } = render(<HealthSlot bufferFrames={256} cpu={0.2} width={100} />);
    expect(screen.getByRole('status')).toHaveTextContent('Audio health: fine');
    expect(hue(container)).toHaveAttribute('data-hue', 'm');
    const text = screen.getByText('Audio', { exact: true });
    expect(text).toHaveAttribute('aria-hidden', 'true');
    expect(text).toHaveAttribute('data-tip', 'app.health');
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.firstElementChild).toHaveStyle({ width: '100px' });
  });

  it('a busy CPU is a button that opens Settings › System on click', async () => {
    const onOpen = vi.fn();
    const { container } = render(<HealthSlot cpu={0.74} bufferFrames={256} onOpen={onOpen} />);
    expect(screen.getByRole('status')).toHaveTextContent('Audio health: CPU 74%');
    expect(hue(container)).toHaveAttribute('data-hue', 'ending');
    const button = screen.getByRole('button', { name: 'CPU 74%' });
    expect(button).toHaveAttribute('data-tip', 'app.health');
    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledWith({ page: 'settings', tab: 'system' });
  });

  it('a failed plugin opens its Channel page and outranks no audio', async () => {
    const onOpen = vi.fn();
    const { rerender } = render(<HealthSlot failedPart={2} cpu={0.2} onOpen={onOpen} />);
    expect(screen.getByRole('status')).toHaveTextContent('Audio health: R3 failed');
    await userEvent.click(screen.getByRole('button', { name: 'R3 failed' }));
    expect(onOpen).toHaveBeenCalledWith({ page: 'channel', part: 2 });
    rerender(<HealthSlot failedPart={3} synthOn={false} onOpen={onOpen} />);
    expect(screen.getByRole('button', { name: 'L failed' })).toBeInTheDocument();
  });

  it('Audio off stays neutral and opens on Enter', async () => {
    const onOpen = vi.fn();
    const { container } = render(<HealthSlot synthOn={false} onOpen={onOpen} />);
    expect(screen.getByRole('status')).toHaveTextContent('Audio health: Audio off');
    expect(hue(container)).toHaveAttribute('data-hue', 'm');
    screen.getByRole('button', { name: 'Audio off' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith({ page: 'settings', tab: 'system' });
  });

  it('dropouts open on Space, singular for one', async () => {
    const onOpen = vi.fn();
    const { rerender } = render(<HealthSlot dropouts={2} bufferFrames={256} onOpen={onOpen} />);
    screen.getByRole('button', { name: '2 dropouts' }).focus();
    await userEvent.keyboard(' ');
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith({ page: 'settings', tab: 'system' });
    rerender(<HealthSlot dropouts={1} bufferFrames={256} />);
    expect(screen.getByRole('button', { name: '1 dropout' })).toBeInTheDocument();
  });

  it('the buffer hint names the next size, whole in the live region and the name', () => {
    const { rerender } = render(<HealthSlot dropouts={3} bufferFrames={128} cpu={0.74} width={100} />);
    expect(screen.getByRole('status')).toHaveTextContent('Audio health: 3 dropouts · buffer 256?');
    expect(screen.getByRole('button', { name: '3 dropouts · buffer 256?' })).toHaveAttribute('data-tip', 'app.health');
    rerender(<HealthSlot dropouts={3} bufferFrames={1024} />);
    expect(screen.getByRole('button', { name: '3 dropouts' })).toBeInTheDocument();
  });

  it('tip null turns the tooltip off', () => {
    const { container, rerender } = render(<HealthSlot cpu={0.74} tip={null} />);
    expect(container.querySelector('[data-tip]')).toBeNull();
    rerender(<HealthSlot tip={null} />);
    expect(container.querySelector('[data-tip]')).toBeNull();
    rerender(<HealthSlot tip="custom.key" />);
    expect(screen.getByText('Audio', { exact: true })).toHaveAttribute('data-tip', 'custom.key');
  });

  it('runs the tip action on the element that shows, moving it on a state change, destroying on unmount', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { rerender, unmount } = render(<HealthSlot tipAction={tipAction} />);
    expect(tipAction).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenLastCalledWith(screen.getByText('Audio', { exact: true }), 'app.health');

    rerender(<HealthSlot cpu={0.74} tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenCalledTimes(2);
    expect(tipAction).toHaveBeenLastCalledWith(screen.getByRole('button', { name: 'CPU 74%' }), 'app.health');

    rerender(<HealthSlot cpu={0.74} tip="other.key" tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(2);
    expect(tipAction).toHaveBeenLastCalledWith(screen.getByRole('button', { name: 'CPU 74%' }), 'other.key');

    rerender(<HealthSlot cpu={0.74} tip={null} tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(3);
    expect(tipAction).toHaveBeenCalledTimes(3);

    rerender(<HealthSlot cpu={0.74} tipAction={tipAction} />);
    unmount();
    expect(destroy).toHaveBeenCalledTimes(4);
  });

  it('pairs every state with a shape, not colour alone', () => {
    const { container, rerender } = render(<HealthSlot />);
    const state = () => container.firstElementChild?.getAttribute('data-state');
    expect(state()).toBe('calm');
    rerender(<HealthSlot synthOn={false} />);
    expect(state()).toBe('off');
    rerender(<HealthSlot cpu={0.9} />);
    expect(state()).toBe('trouble');
    expect(container.querySelector('.yh-health-slot__mark')).toHaveAttribute('aria-hidden', 'true');
  });
});
