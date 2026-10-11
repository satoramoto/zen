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

  it('spans the row when full', () => {
    expect(render(<Separator length="full" />).container.firstElementChild).toHaveAttribute('data-length', 'full');
  });
});
