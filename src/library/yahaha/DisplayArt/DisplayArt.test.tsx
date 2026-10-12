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
    // On light the near hill stops at 24% accent; the sun sits low, clear of the tempo; the fade runs to 85%.
    expect(css).toMatch(/--yh-displayart-near:\s*color-mix\(in oklab, var\(--accent\) calc\(8% \+ 16% \* var\(--scheme-light\)\)/);
    expect(/\.yh-displayart__sun \{([^}]*)\}/.exec(css)![1]).toMatch(/top:\s*5\d%/);
    expect(/\.yh-displayart__fade \{([^}]*)\}/.exec(css)![1]).toMatch(/transparent 85%\)/);
  });
});
