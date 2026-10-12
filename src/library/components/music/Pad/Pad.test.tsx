import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pad, padTone, tieLastWord } from './Pad';

const PAD_CSS = 'src/library/components/music/Pad/Pad.css';

describe('Pad', () => {
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
    const css = readFileSync(join(process.cwd(), PAD_CSS), 'utf8');
    const rule = (selector: string) => {
      const at = css.indexOf(`${selector} {`);
      expect(at, `${selector} has a rule`).toBeGreaterThan(-1);
      return css.slice(at, css.indexOf('}', at));
    };
    expect(rule(".yh-pad.yh-pad[data-tag='top']")).toMatch(/padding-top:\s*calc\(var\(--yh-pad-tag-h\)/);
    expect(rule('.yh-pad__tag--corner')).toMatch(/top:\s*calc\(var\(--yh-pad-tag-h\) \* -0\.[5-9]\)/);
  });

  it('inks state fills with their own text tokens and draws a role slot in its role hue', () => {
    const css = readFileSync(join(process.cwd(), PAD_CSS), 'utf8');
    const rule = (selector: string) => {
      const at = css.indexOf(`${selector} {`);
      expect(at, `${selector} has a rule`).toBeGreaterThan(-1);
      return css.slice(at, css.indexOf('}', at));
    };
    const success = rule(".yh-pad[data-tone='success']");
    expect(success).toContain('--yh-pad-ink: var(--success-text)');
    expect(success).toContain('--yh-pad-ring-ink: var(--success-text)');
    expect(rule(".yh-pad[data-state='armed']")).toContain('--yh-pad-ring-ink: var(--warning-text)');
    for (const n of [1, 2]) {
      const role = rule(`.yh-pad[data-tone='role-${n}']`);
      expect(role).toContain(`--yh-pad-fill: var(--role-${n})`);
      expect(role).toContain(`--yh-pad-ink: var(--role-${n}-text)`);
    }
    expect(css).not.toContain("data-tone='action'");
    expect(css).not.toContain('--transport');
    render(<Pad label="Sync Start" family="util" state="armed" role={2} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'role-2');
  });

  it('marks the flash phase only on waiting pads', () => {
    const { rerender } = render(<Pad label="Main C" state="next" lit={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-lit', 'false');
    rerender(<Pad label="Main C" state="playing" lit={false} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-lit');
  });

  it('maps families onto contract tones', () => {
    expect(padTone('main', 'playing')).toBe('neutral');
    expect(padTone('util', 'idle')).toBe('neutral');
    expect(padTone('start', 'running')).toBe('success');
    expect(padTone('start', 'idle')).toBe('neutral');
    // Running is a state: it stays success on a pad with a role too.
    expect(padTone('start', 'running', 2)).toBe('success');
    expect(padTone('start', 'idle', 2)).toBe('role-2');
    expect(padTone('util', 'armed', 2)).toBe('role-2');
    expect(padTone('util', 'playing', 1)).toBe('role-1');
    expect(padTone('main', 'idle', 2)).toBe('neutral');
    // A hue slot wins over the family and the role.
    expect(padTone('util', 'playing', undefined, 1)).toBe('hue-1');
    expect(padTone('util', 'idle', undefined, 2)).toBe('hue-2');
    expect(padTone('util', 'dark', 2, 3)).toBe('hue-3');
    expect(padTone('start', 'running', undefined, 4)).toBe('hue-4');
  });

  it('renders the hue slot as data-hue and the hue tone', () => {
    const { rerender } = render(<Pad label="QUICK 2" family="util" hue={2} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-hue', '2');
    expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'hue-2');
    rerender(<Pad label="Main B" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-hue');
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

  it('rings NEXT in the accent by default; accentNext={false} opts out', () => {
    const { container, rerender } = render(<Pad label="Main C" state="next" />);
    const pad = within(container).getByRole('button');
    expect(pad).toHaveAttribute('data-next', 'accent');
    rerender(<Pad label="Main C" state="next" accentNext={false} />);
    expect(pad).not.toHaveAttribute('data-next');
  });

  it('ties a short last word to its word, so a numeral never wraps alone', () => {
    expect(tieLastWord('Main B')).toBe('Main B');
    expect(tieLastWord('Intro III')).toBe('Intro III');
    expect(tieLastWord('QUICK 1')).toBe('QUICK 1');
    expect(tieLastWord('Sync Start')).toBe('Sync Start');
    expect(tieLastWord('Start / Stop')).toBe('Start / Stop');
    expect(tieLastWord('Fill')).toBe('Fill');
    render(<Pad label="Main B" index="10" />);
    expect(screen.getByRole('button', { name: 'Main B (pad 10)' }).querySelector('.yh-pad__label')!.textContent).toBe('Main B');
  });

  it('onFace="ring" draws on as a ring and a dot; a role is neutral at rest; disabled is dashed', () => {
    const css = readFileSync(join(process.cwd(), PAD_CSS), 'utf8');
    const rule = (selector: string) => {
      const at = css.indexOf(`${selector} {`);
      expect(at, `${selector} has a rule`).toBeGreaterThan(-1);
      return css.slice(at, css.indexOf('}', at));
    };
    const ring = rule(".yh-pad[data-on-face='ring'][data-state='playing']");
    // The raised key face stays (the theme's key material), not the solid fill.
    expect(ring).toContain('background: var(--mat-key-texture), var(--mat-key-fill)');
    expect(ring).toContain('border-color: var(--yh-pad-fill)');
    // The lit dot is the pad's colour, through the material's lamp (`--lit`).
    const dot = rule(".yh-pad[data-on-face='ring'][data-state='playing']::after");
    expect(dot).toContain('--lit: var(--yh-pad-fill)');
    expect(dot).toContain('background: var(--lit)');
    expect(rule(".yh-pad[data-tone='role-1']")).not.toContain('--yh-pad-edge');
    expect(rule(".yh-pad[data-tone='role-2']")).not.toContain('--yh-pad-edge');
    expect(rule(".yh-pad[aria-disabled='true']:not([data-state='playing'], [data-state='running'])")).toMatch(
      /border-style: dashed;[\s\S]*color: var\(--text-3\)/,
    );
    expect(css).toMatch(/--yh-wait-ring:\s*calc\(var\(--border-width\) \* 2\)/);
    render(<Pad label="Auto Fill" family="util" state="playing" onFace="ring" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-on-face', 'ring');
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
    const { unmount } = render(<Pad label="QUICK 1" family="util" hue={1} tip="padpage.racks" tipAction={tipAction} />);
    const pad = screen.getByRole('button');
    expect(pad).toHaveAttribute('data-tip', 'padpage.racks');
    expect(pad).toHaveAttribute('data-tone', 'hue-1');
    expect(tipAction).toHaveBeenCalledWith(pad, 'padpage.racks');
    unmount();
    expect(destroy).toHaveBeenCalled();
  });
});
