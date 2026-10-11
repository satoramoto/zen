import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsRow } from './SettingsRow';

/** Stand-in lamp: a pressable button named by the row's label. */
function Lamp({ name, on, disabled, ontoggle }: { name: string; on: boolean; disabled?: boolean; ontoggle: (on: boolean) => void }) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={on}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && ontoggle(!on)}
    >
      On
    </button>
  );
}

/** Stand-in slider: arrows step the value by one. */
function Slider({ name, value, onchange }: { name: string; value: number; onchange: (v: number) => void }) {
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={name}
      aria-valuenow={value}
      aria-valuetext={`${value} ms`}
      onKeyDown={(e) => e.key === 'ArrowRight' && onchange(value + 1)}
    />
  );
}

describe('SettingsRow', () => {
  it('Board: label, then control, then hint; the lamp toggles off', async () => {
    const ontoggle = vi.fn();
    const { container } = render(
      <SettingsRow label="Upper" hint="Chords from the right hand">
        <Lamp name="Upper" on ontoggle={ontoggle} />
      </SettingsRow>,
    );
    expect(screen.getByText('Upper')).toBeInTheDocument();
    expect(screen.getByText('Chords from the right hand')).toBeInTheDocument();
    const lamp = screen.getByRole('button', { name: 'Upper' });
    expect(lamp).toHaveAttribute('aria-pressed', 'true');
    const text = container.textContent ?? '';
    expect(text.indexOf('Upper')).toBeLessThan(text.indexOf('On'));
    expect(text.indexOf('On')).toBeLessThan(text.indexOf('Chords from the right hand'));
    await userEvent.click(lamp);
    expect(ontoggle).toHaveBeenCalledWith(false);
  });

  it('is a group named by its label and described by its hint', () => {
    render(<SettingsRow label="Upper" hint="Chords from the right hand" />);
    const group = screen.getByRole('group', { name: 'Upper' });
    expect(group).toHaveAccessibleDescription('Chords from the right hand');
  });

  it('DisabledLamp: the lamp is disabled and a click asks nothing', async () => {
    const ontoggle = vi.fn();
    render(
      <SettingsRow label="Manual Bass" hint="Works with Upper on">
        <Lamp name="Manual Bass" on={false} disabled ontoggle={ontoggle} />
      </SettingsRow>,
    );
    const lamp = screen.getByRole('button', { name: 'Manual Bass' });
    expect(lamp).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Works with Upper on')).toBeInTheDocument();
    await userEvent.click(lamp);
    expect(ontoggle).not.toHaveBeenCalled();
  });

  it('Tabs: no hint drawn when empty, and the control keeps its own clicks', async () => {
    const onchoose = vi.fn();
    const { container } = render(
      <SettingsRow label="Main timing" hint="">
        <div role="tablist" aria-label="Main timing">
          <button type="button" role="tab" aria-selected={false} onClick={() => onchoose('immediate')}>
            Immediate
          </button>
          <button type="button" role="tab" aria-selected onClick={() => onchoose('nextBar')}>
            Next bar
          </button>
        </div>
      </SettingsRow>,
    );
    expect(screen.getByText('Main timing', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Next bar' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Immediate' }));
    expect(onchoose).toHaveBeenCalledWith('immediate');
    expect(container.querySelector('.yh-settings-row__hint')).toBeNull();
    expect(screen.getByRole('group', { name: 'Main timing' })).not.toHaveAttribute('aria-describedby');
  });

  it('Slider: the control keeps its keys', async () => {
    const onchange = vi.fn();
    render(
      <SettingsRow label="Chord settle">
        <Slider name="Chord settle" value={10} onchange={onchange} />
      </SettingsRow>,
    );
    const slider = screen.getByRole('slider', { name: 'Chord settle' });
    expect(slider).toHaveAttribute('aria-valuetext', '10 ms');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onchange).toHaveBeenCalledWith(11);
  });

  it('sets the label column from labelWidth and keeps the full text for truncation', () => {
    const { container } = render(<SettingsRow label="Fingered on bass" hint="Lowest note" labelWidth={96} />);
    const row = container.querySelector<HTMLElement>('.yh-settings-row')!;
    expect(row.style.getPropertyValue('--yh-settings-label-w')).toBe('96px');
    expect(container.querySelector('.yh-settings-row__label')).toHaveAttribute('title', 'Fingered on bass');
    expect(container.querySelector('.yh-settings-row__hint')).toHaveAttribute('title', 'Lowest note');
  });
});
