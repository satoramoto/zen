import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PartMarks } from './PartMarks';
import { marksText, visibleMarks } from './marks';

const marksIn = (container: HTMLElement) => [...container.querySelectorAll('[data-mark]')];

describe('PartMarks', () => {
  it('draws the edited dot alone, hidden from assistive tech (Board)', () => {
    const { container } = render(<PartMarks edited />);
    const marks = marksIn(container);
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveAttribute('data-mark', 'edited');
    expect(marks[0].parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws missing in the warning role and failed in the danger role, never a section hue', () => {
    const missing = marksIn(render(<PartMarks missing />).container);
    expect(missing).toHaveLength(1);
    expect(missing[0]).toHaveAttribute('data-mark', 'missing');
    expect(missing[0]).toHaveAttribute('data-tone', 'warning');

    const failed = marksIn(render(<PartMarks failed />).container);
    expect(failed).toHaveLength(1);
    expect(failed[0]).toHaveAttribute('data-mark', 'failed');
    expect(failed[0]).toHaveAttribute('data-tone', 'danger');
  });

  it('applies the precedence: missing over failed, bass over off', () => {
    const { container } = render(<PartMarks edited missing failed off bass />);
    expect(marksIn(container).map((m) => m.getAttribute('data-mark'))).toEqual(['edited', 'missing', 'bass']);
  });

  it('writes the words "off" and "bass"', () => {
    expect(render(<PartMarks off />).container).toHaveTextContent('off');
    expect(render(<PartMarks bass />).container).toHaveTextContent('bass');
  });

  it('renders nothing with no facts', () => {
    expect(render(<PartMarks />).container).toBeEmptyDOMElement();
  });

  it('renders tip and runs the tip action while a mark shows, destroying on key change and when marks go', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { container, rerender, unmount } = render(<PartMarks edited tip="part.marks" tipAction={tipAction} />);
    const root = container.querySelector('.yh-partmarks');
    expect(root).toHaveAttribute('data-tip', 'part.marks');
    expect(tipAction).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenCalledWith(root, 'part.marks');

    rerender(<PartMarks edited tip="part.other" tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenLastCalledWith(container.querySelector('.yh-partmarks'), 'part.other');

    rerender(<PartMarks tip="part.other" tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(2);
    expect(tipAction).toHaveBeenCalledTimes(2);

    rerender(<PartMarks failed tip="part.other" tipAction={tipAction} />);
    expect(tipAction).toHaveBeenCalledTimes(3);
    unmount();
    expect(destroy).toHaveBeenCalledTimes(3);
  });

  it('marks the strip size', () => {
    const { container } = render(<PartMarks edited size="strip" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'strip');
  });
});

describe('visibleMarks', () => {
  it('draws each mark alone', () => {
    expect(visibleMarks({ edited: true })).toEqual(['edited']);
    expect(visibleMarks({ missing: true })).toEqual(['missing']);
    expect(visibleMarks({ failed: true })).toEqual(['failed']);
    expect(visibleMarks({ off: true })).toEqual(['off']);
    expect(visibleMarks({ bass: true })).toEqual(['bass']);
  });

  it('draws in order', () => {
    expect(visibleMarks({ edited: true, failed: true, off: true })).toEqual(['edited', 'failed', 'off']);
  });
});

describe('marksText', () => {
  it('speaks the marks in Stage order', () => {
    expect(marksText({ edited: true })).toBe(', edited');
    expect(marksText({ missing: true, failed: true, off: true })).toBe(', off, plugin missing');
    expect(marksText({ failed: true })).toBe(', plugin failed');
    expect(marksText({ off: true, bass: true })).toBe(', bass');
    expect(marksText({})).toBe('');
  });
});
