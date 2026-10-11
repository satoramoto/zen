import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SectionName } from './SectionName';

describe('SectionName', () => {
  it('shows the name with its section kind', () => {
    const { container } = render(<SectionName label="Main B" hue="main" />);
    const name = container.querySelector('.yh-section-name')!;
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
    expect(container.querySelector('.yh-section-name')).toHaveAttribute('data-idle', 'true');
  });

  it('shows a dash for an empty name', () => {
    const { container } = render(<SectionName label="  " />);
    expect(container.querySelector('.yh-section-name')).toHaveTextContent('—');
    expect(container.querySelector('.yh-section-name__variant')).toBeNull();
  });
});
