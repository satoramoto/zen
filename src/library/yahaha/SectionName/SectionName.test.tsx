import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SECTION_STATE_COLOUR } from '../hues';
import { SectionName } from './SectionName';

const nameOf = (container: HTMLElement) => container.querySelector<HTMLElement>('.yh-section-name')!;
const tone = (container: HTMLElement) => nameOf(container).style.getPropertyValue('--yh-section-tone');

describe('SectionName', () => {
  it('shows the name with its section kind', () => {
    const { container } = render(<SectionName label="Main B" hue="main" />);
    const name = nameOf(container);
    expect(name).toHaveTextContent('Main B');
    expect(name).toHaveAttribute('data-hue', 'main');
    expect(name).not.toHaveAttribute('data-idle');
  });

  it('sets the variation apart for numerals', () => {
    const { container } = render(<SectionName label="Intro II" hue="intro" />);
    expect(container.querySelector('.yh-section-name__variant')).toHaveTextContent('II');
  });

  it('marks the stopped band idle', () => {
    const { container } = render(<SectionName label="Main A" idle />);
    expect(nameOf(container)).toHaveAttribute('data-idle', 'true');
    expect(nameOf(container)).toHaveAttribute('data-state', 'idle');
    expect(tone(container)).toBe('var(--text-2)');
  });

  it('a playing section wears --selected whatever its kind: no section takes a hue', () => {
    for (const hue of ['intro', 'main', 'ending', 'brk', 'fill'] as const) {
      const { container, unmount } = render(<SectionName label="X" hue={hue} />);
      expect(nameOf(container)).toHaveAttribute('data-state', 'playing');
      expect(tone(container)).toBe('var(--selected)');
      unmount();
    }
  });

  it('colours each state by SECTION_STATE_COLOUR; idle wins over state', () => {
    for (const state of ['playing', 'next', 'idle', 'absent'] as const) {
      const { container, unmount } = render(<SectionName label="Main C" state={state} />);
      expect(tone(container)).toBe(SECTION_STATE_COLOUR[state]);
      unmount();
    }
    const { container } = render(<SectionName label="Main C" state="next" idle />);
    expect(tone(container)).toBe('var(--text-2)');
  });

  it('shows a dash for an empty name', () => {
    const { container } = render(<SectionName label="  " />);
    expect(nameOf(container)).toHaveTextContent('—');
    expect(container.querySelector('.yh-section-name__variant')).toBeNull();
  });

  it('sets the size as its custom property, keeping the tone, and none by default', () => {
    const { container, rerender } = render(<SectionName label="Main B" />);
    expect(nameOf(container).style.getPropertyValue('--yh-section-name-size')).toBe('');
    rerender(<SectionName label="Main B" size="64px" />);
    expect(nameOf(container).style.getPropertyValue('--yh-section-name-size')).toBe('64px');
    expect(tone(container)).toBe(SECTION_STATE_COLOUR.playing);
  });
});
