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
});
