import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SectionName } from './SectionName';

const nameOf = (container: HTMLElement) => container.querySelector<HTMLElement>('.yh-section-name')!;
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'SectionName.css'), 'utf8');

describe('SectionName', () => {
  it('shows the name with its section kind', () => {
    const { container } = render(<SectionName label="Main B" hue="main" />);
    const name = nameOf(container);
    expect(name).toHaveTextContent('Main B');
    expect(name).toHaveAttribute('data-hue', 'main');
    expect(name).not.toHaveAttribute('data-idle');
  });

  it('sets the variation apart, in the same face as the word', () => {
    const { container } = render(<SectionName label="Intro II" hue="intro" />);
    expect(container.querySelector('.yh-section-name__variant')).toHaveTextContent('II');
    const variant = /\.yh-section-name__variant \{([^}]*)\}/.exec(css)![1];
    expect(variant).not.toMatch(/font-family/);
    expect(variant).toMatch(/tabular-nums/);
  });

  it('marks the stopped band idle; idle wins over state', () => {
    const { container, rerender } = render(<SectionName label="Main A" idle />);
    expect(nameOf(container)).toHaveAttribute('data-idle', 'true');
    expect(nameOf(container)).toHaveAttribute('data-state', 'idle');
    rerender(<SectionName label="Main C" state="next" idle />);
    expect(nameOf(container)).toHaveAttribute('data-state', 'idle');
  });

  it('is neutral in every state: the ink is inherited from its holder, no tone, no glow', () => {
    for (const state of ['playing', 'next', 'idle', 'absent'] as const) {
      const { container, unmount } = render(<SectionName label="Main C" state={state} />);
      expect(nameOf(container)).toHaveAttribute('data-state', state);
      expect(nameOf(container).style.getPropertyValue('--yh-section-tone')).toBe('');
      unmount();
    }
    expect(css).toMatch(/\.yh-section-name \{[^}]*color:\s*inherit/);
    expect(css).not.toMatch(/text-shadow|--selected|--accent/);
  });

  it('shows a dash for an empty name', () => {
    const { container } = render(<SectionName label="  " />);
    expect(nameOf(container)).toHaveTextContent('—');
    expect(container.querySelector('.yh-section-name__variant')).toBeNull();
  });

  it('sets the size as its custom property, and none by default', () => {
    const { container, rerender } = render(<SectionName label="Main B" />);
    expect(nameOf(container).style.getPropertyValue('--yh-section-name-size')).toBe('');
    rerender(<SectionName label="Main B" size="64px" />);
    expect(nameOf(container).style.getPropertyValue('--yh-section-name-size')).toBe('64px');
  });
});
