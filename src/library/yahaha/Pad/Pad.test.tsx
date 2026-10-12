import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pad, padTone } from './Pad';

describe('Yahaha Pad', () => {
  it('presses on a pointer click', async () => {
    const onPress = vi.fn();
    render(<Pad label="Main B" index="10" onPress={onPress} />);
    await userEvent.click(screen.getByRole('button', { name: 'Main B (pad 10)' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('presses on Enter and Space', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<Pad label="Main B" index="10" onPress={onPress} />);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('names itself from label and index, or from name', () => {
    const { rerender } = render(<Pad label="Intro I" index="1" />);
    expect(screen.getByRole('button', { name: 'Intro I (pad 1)' })).toBeInTheDocument();
    expect(screen.queryByText('1')).toBeNull();
    rerender(<Pad label="Intro I" />);
    expect(screen.getByRole('button', { name: 'Intro I' })).toBeInTheDocument();
    rerender(<Pad label="Intro III" index="3" name="Intro III (not in this style)" />);
    expect(screen.getByRole('button', { name: 'Intro III (not in this style)' })).toBeInTheDocument();
  });

  it('is pressed while playing or running, not otherwise', () => {
    const { rerender } = render(<Pad label="Main B" state="playing" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    rerender(<Pad label="Start / Stop" family="start" state="running" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    for (const state of ['idle', 'dark', 'next', 'armed'] as const) {
      rerender(<Pad label="Main B" state={state} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('shows NEXT or ARMED out of the accessible name, in the corner with tagCorner', () => {
    const { rerender } = render(<Pad label="Main C" index="11" state="next" />);
    expect(screen.getByText('NEXT')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Main C (pad 11)' })).toBeInTheDocument();
    rerender(<Pad label="Ending I" state="armed" tagCorner />);
    expect(screen.getByText('ARMED')).toHaveClass('yh-pad__tag--corner');
    rerender(<Pad label="Main C" state="idle" />);
    expect(screen.queryByText('NEXT')).toBeNull();
  });

  it('keeps the NEXT / ARMED chip off the label: a clear row on top, or hung on the top edge', () => {
    const { rerender } = render(<Pad label="Main C" state="next" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-tag', 'top');
    rerender(<Pad label="C" state="next" tagCorner />);
    expect(screen.getByRole('button')).toHaveAttribute('data-tag', 'corner');
    rerender(<Pad label="C" state="playing" tagCorner />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-tag');

    // jsdom lays nothing out, so check the rules that do it (the Pad story TagClearance measures
    // them in a browser): the top chip's row is reserved above the label, and the corner chip
    // sits mostly above the pad's top edge rather than over its centred label.
    const css = readFileSync(join(process.cwd(), 'src/library/yahaha/Pad/Pad.css'), 'utf8');
    const rule = (selector: string) => {
      const at = css.indexOf(`${selector} {`);
      expect(at, `${selector} has a rule`).toBeGreaterThan(-1);
      return css.slice(at, css.indexOf('}', at));
    };
    expect(rule(".yh-pad.yh-pad[data-tag='top']")).toMatch(/padding-top:\s*calc\(var\(--yh-pad-tag-h\)/);
    expect(rule('.yh-pad__tag--corner')).toMatch(/top:\s*calc\(var\(--yh-pad-tag-h\) \* -0\.[5-9]\)/);
  });

  it('marks the flash phase only on waiting pads', () => {
    const { rerender } = render(<Pad label="Main C" state="next" lit={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-lit', 'false');
    rerender(<Pad label="Main C" state="playing" lit={false} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-lit');
  });

  it('maps families onto contract tones', () => {
    expect(padTone('main', 'playing', false)).toBe('neutral');
    expect(padTone('util', 'idle', false)).toBe('neutral');
    expect(padTone('start', 'running', false)).toBe('success');
    expect(padTone('start', 'idle', false)).toBe('neutral');
    expect(padTone('start', 'running', true)).toBe('action');
    expect(padTone('util', 'armed', true)).toBe('action');
    expect(padTone('main', 'idle', true)).toBe('neutral');
    expect(padTone('r1', 'playing', false)).toBe('hue-1');
    expect(padTone('r2', 'idle', false)).toBe('hue-2');
    expect(padTone('r3', 'dark', false)).toBe('hue-3');
    expect(padTone('l', 'idle', false)).toBe('hue-4');
  });

  it('disabled: stays focusable, is aria-disabled, and ignores click, Enter and Space', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    const { container, rerender } = render(<Pad label="Auto Fill" index="12" disabled onPress={onPress} />);
    const pad = within(container).getByRole('button', { name: 'Auto Fill (pad 12)' });
    expect(pad).toHaveAttribute('aria-disabled', 'true');
    expect(pad).not.toBeDisabled();
    await user.tab();
    expect(pad).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(pad);
    expect(onPress).not.toHaveBeenCalled();
    rerender(<Pad label="Auto Fill" index="12" onPress={onPress} />);
    expect(pad).not.toHaveAttribute('aria-disabled');
    await user.click(pad);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('accentNext marks the pad to ring NEXT in the accent; off by default', () => {
    const { container, rerender } = render(<Pad label="Main C" state="next" />);
    const pad = within(container).getByRole('button');
    expect(pad).not.toHaveAttribute('data-next');
    rerender(<Pad label="Main C" state="next" accentNext />);
    expect(pad).toHaveAttribute('data-next', 'accent');
  });

  it('fillCell marks the pad to fill its cell; off by default', () => {
    const { container, rerender } = render(<Pad label="Main C" />);
    const pad = within(container).getByRole('button');
    expect(pad).not.toHaveAttribute('data-fill');
    rerender(<Pad label="Main C" fillCell />);
    expect(pad).toHaveAttribute('data-fill', 'true');
  });

  it('renders tip as data-tip and applies the tip action', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { unmount } = render(<Pad label="QUICK 1" family="r1" tip="padpage.racks" tipAction={tipAction} />);
    const pad = screen.getByRole('button');
    expect(pad).toHaveAttribute('data-tip', 'padpage.racks');
    expect(pad).toHaveAttribute('data-tone', 'hue-1');
    expect(tipAction).toHaveBeenCalledWith(pad, 'padpage.racks');
    unmount();
    expect(destroy).toHaveBeenCalled();
  });
});
