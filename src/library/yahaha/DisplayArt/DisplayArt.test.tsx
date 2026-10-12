import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DisplayArt } from './DisplayArt';

describe('DisplayArt', () => {
  it('is decorative, with the fade on by default (Board)', () => {
    const { container } = render(<DisplayArt />);
    const art = container.firstElementChild;
    expect(art).toHaveAttribute('aria-hidden', 'true');
    expect(art).toHaveTextContent('');
    expect(container.querySelector('.yh-displayart__fade')).not.toBeNull();
    expect(container.querySelectorAll('[data-hill]')).toHaveLength(2);
  });

  it('drops the fade when bare (Bare)', () => {
    const { container } = render(<DisplayArt fade={false} />);
    expect(container.querySelector('.yh-displayart__fade')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-fade', 'false');
  });

  it('switches every mix of the picture on --scheme-light', () => {
    // jsdom resolves no colours, so this checks the source; browser shots check the result.
    const css = readFileSync(join(process.cwd(), 'src/library/yahaha/DisplayArt/DisplayArt.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const part of ['sky', 'far', 'near', 'sun']) {
      expect(css, `--yh-displayart-${part}`).toMatch(
        new RegExp(`--yh-displayart-${part}:\\s*color-mix\\(in oklab, var\\(--accent\\) calc\\([^)]*var\\(--scheme-light\\)\\)`),
      );
    }
  });
});
