import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AxisPicker } from './AxisPicker';

const MEASURES = ['Speed', 'Brightness', 'Density'];
// The menu is a `popover`, which jsdom (no top layer) never shows, so its queries include hidden.
const hidden = true;

describe('AxisPicker', () => {
  it('shows the measure on a combobox named by its label, with the ends either side', () => {
    const { container } = render(<AxisPicker items={MEASURES} index={1} onChange={() => {}} label="Across" low="slow" high="fast" />);
    const chip = screen.getByRole('combobox', { name: 'Across' });
    expect(chip).toHaveTextContent('Brightness');
    expect(chip).toHaveAttribute('aria-expanded', 'false');
    const root = container.querySelector('[data-part="root"]')!;
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    expect(root.querySelector('[data-part="low"]')).toHaveTextContent('slow');
    expect(root.querySelector('[data-part="high"]')).toHaveTextContent('fast');
    // Low first, then the chip, then high.
    expect([...root.children].map((el) => el.getAttribute('data-part'))).toEqual(['low', 'trigger', 'high']);
  });

  it('vertical says so on the root', () => {
    const { container } = render(<AxisPicker items={MEASURES} index={0} onChange={() => {}} label="Up" orientation="vertical" low="dark" high="bright" />);
    expect(container.querySelector('[data-part="root"]')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('with no ends is just the chip', () => {
    const { container } = render(<AxisPicker items={MEASURES} index={0} onChange={() => {}} label="Colour" />);
    const root = container.querySelector('[data-part="root"]')!;
    expect(root).toHaveAttribute('data-bare');
    expect(root.querySelector('[data-part="low"], [data-part="high"]')).toBeNull();
  });

  it('opens to a listbox of every measure', async () => {
    const user = userEvent.setup();
    render(<AxisPicker items={MEASURES} index={0} onChange={() => {}} label="Across" />);
    const chip = screen.getByRole('combobox', { name: 'Across' });
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('listbox', { name: 'Across', hidden });
    expect(list).toHaveAttribute('data-part', 'menu');
    expect(screen.getAllByRole('option', { hidden }).map((o) => o.textContent)).toEqual(MEASURES);
    expect(screen.getByRole('option', { name: 'Speed', hidden })).toHaveAttribute('aria-selected', 'true');
  });

  it('choosing another calls onChange once with its index; the same one does not', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AxisPicker items={MEASURES} index={0} onChange={onChange} label="Across" />);
    const chip = screen.getByRole('combobox', { name: 'Across' });
    await user.click(chip);
    await user.click(screen.getByRole('option', { name: 'Density', hidden }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
    await waitFor(() => expect(chip).toHaveAttribute('aria-expanded', 'false'));

    await user.click(chip);
    await user.click(screen.getByRole('option', { name: 'Speed', hidden }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('Escape closes and keeps focus on the chip', async () => {
    const user = userEvent.setup();
    render(<AxisPicker items={MEASURES} index={0} onChange={() => {}} label="Across" />);
    const chip = screen.getByRole('combobox', { name: 'Across' });
    await user.click(chip);
    expect(screen.getByRole('listbox', { hidden })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(chip).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.queryByRole('listbox', { hidden })).toBeNull();
    expect(chip).toHaveFocus();
  });
});
