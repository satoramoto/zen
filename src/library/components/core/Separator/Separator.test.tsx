import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Separator } from './Separator';

describe('Separator', () => {
  it('is a short decorative line by default (Board)', () => {
    const line = render(<Separator />).container.firstElementChild;
    expect(line).toHaveAttribute('data-length', 'short');
    expect(line).toHaveAttribute('aria-hidden', 'true');
    expect(line).toBeEmptyDOMElement();
  });

  it('the short line stands a step short of the control height', () => {
    const css = readFileSync(join(process.cwd(), 'src/library/components/core/Separator/Separator.css'), 'utf8');
    expect(css).toMatch(/\[data-length='short'\]\s*\{[^}]*height:\s*calc\(var\(--control-h\) - var\(--space-3\)\)/);
  });

  it('spans the row when full', () => {
    expect(render(<Separator length="full" />).container.firstElementChild).toHaveAttribute('data-length', 'full');
  });
});
