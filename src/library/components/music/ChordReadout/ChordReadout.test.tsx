/**
 * ChordReadout, ported from yahaha/src/ui/ChordReadout/ChordReadout.test.ts: the fingering's
 * tooltip as `data-tip` (no native title) with the whole text as `data-tip-text`, the whole text in
 * the accessible name, and the hero stepping down until it fits.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChordReadout } from './ChordReadout';

// Tests run from the repo root.
const css = readFileSync(join(process.cwd(), 'src/library/yahaha/ChordReadout/ChordReadout.css'), 'utf8');

const LONG = 'AI Full Keyboard · Keyboard transpose +2 · played Gm7 over the whole keyboard';
const AM7 = [{ note: 'A' }, { note: 'C' }, { note: 'E' }, { note: 'G' }];

describe('ChordReadout fingering', () => {
  it('takes the tooltip key and no native title', () => {
    const { container } = render(<ChordReadout chord="Gm" extension="7" fingering={LONG} tip="fingering.select" />);
    const fingering = container.querySelector('.yh-chord-readout__fingering') as HTMLElement;
    expect(fingering.textContent).toBe(LONG);
    expect(fingering).not.toHaveAttribute('title');
    expect(fingering.dataset.tip).toBe('fingering.select');
  });

  it('gives the tip the whole fingering as free text and updates it with the chord', () => {
    const { container, rerender } = render(<ChordReadout chord="Gm" extension="7" fingering={LONG} tip="fingering.select" />);
    const fingering = container.querySelector('.yh-chord-readout__fingering') as HTMLElement;
    expect(fingering.dataset.tipText).toBe(LONG);
    rerender(<ChordReadout chord="C" extension="" fingering="Fingered" tip="fingering.select" />);
    expect(fingering.dataset.tipText).toBe('Fingered');
  });

  it('sets no tip without a key', () => {
    const { container } = render(<ChordReadout chord="Gm" extension="7" fingering={LONG} />);
    const fingering = container.querySelector('.yh-chord-readout__fingering') as HTMLElement;
    expect(fingering).not.toHaveAttribute('data-tip');
    expect(fingering).not.toHaveAttribute('data-tip-text');
  });

  it('says the whole fingering in its accessible name', () => {
    render(<ChordReadout chord="Gm" extension="7" fingering={LONG} />);
    expect(screen.queryByRole('img', { name: `Chord Gm7, ${LONG}` })).not.toBeNull();
  });
});

describe('ChordReadout', () => {
  it('says the chord, its notes and the fingering', () => {
    render(<ChordReadout chord="Am" extension="7" notes={AM7} fingering="Fingered On Bass" label="Chord" />);
    const readout = screen.getByRole('img', { name: 'Chord Am7: A C E G, Fingered On Bass' });
    expect(readout).toHaveAttribute('data-held', 'false');
    expect(readout).toHaveTextContent('Am7');
    // The label is spoken, not drawn: the chord symbol names itself.
    expect(readout).not.toHaveTextContent('Chord');
    expect(readout.querySelector('.yh-chord-readout__label')).toBeNull();
  });

  it('held keeps the chord readable, a dashed rule under it, and says so', () => {
    const { container } = render(<ChordReadout chord="C" extension="maj7" notes={AM7} fingering="Fingered" held />);
    const readout = screen.getByRole('img', { name: 'Chord Cmaj7, held: A C E G, Fingered' });
    expect(readout).toHaveAttribute('data-held', 'true');
    expect(container.querySelector('.yh-chord-readout__held')).toHaveTextContent('held');
    const held = /\.yh-chord-readout--held \.yh-chord-readout__chord \{([^}]*)\}/.exec(css)![1];
    expect(held).toMatch(/text-decoration-style:\s*dashed/);
    expect(held).toMatch(/var\(--border-strong\)/);
    expect(held).not.toMatch(/color:\s*var\(--text-3\)/);
  });

  it('draws the slash bass in the chord\'s ink, and no faint text', () => {
    expect(/\.yh-chord-readout__bass \{([^}]*)\}/.exec(css)![1]).toMatch(/color:\s*var\(--text-1\)/);
    expect(css).not.toMatch(/--text-4/);
  });

  it('no chord draws a dash and says none', () => {
    const { container } = render(<ChordReadout chord="" fingering="Fingered" />);
    expect(screen.getByRole('img', { name: 'Chord none, Fingered' })).toBeInTheDocument();
    expect(container.querySelector('.yh-chord-readout__chord')).toHaveTextContent('—');
    expect(container.querySelector('.yh-chord-readout__tones')).toBeNull();
  });

  it('keeps a slash bass on the line and the rest of the extension raised', () => {
    const { container } = render(<ChordReadout chord="C♯m" extension="maj9(♯11)/G♯" />);
    expect(container.querySelector('.yh-chord-readout__ext')).toHaveTextContent('maj9(♯11)');
    expect(container.querySelector('.yh-chord-readout__bass')).toHaveTextContent('/G♯');
    expect(container.querySelector('.yh-chord-readout__chord')).toHaveTextContent('C♯mmaj9(♯11)/G♯');
  });

  it('steps the hero down until the chord fits its column', () => {
    // Pretend the chord is 300px wide at full size and shrinks with each step, in a 200px column.
    const widths: Record<string, number> = { full: 300, '4': 250, '5': 190, '6': 160, '8': 130 };
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return widths[this.dataset.fit ?? 'full'] ?? 0;
    });
    const client = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    try {
      const { container } = render(<ChordReadout chord="C♯m" extension="maj9(♯11)/G♯" />);
      expect(container.querySelector('.yh-chord-readout__chord')).toHaveAttribute('data-fit', '5');
    } finally {
      scroll.mockRestore();
      client.mockRestore();
    }
  });
});

describe('ChordReadout options', () => {
  const rootOf = (container: HTMLElement) => container.querySelector<HTMLElement>('.yh-chord-readout')!;

  it('applies the tooltip action to the fingering with the key, and destroys it on key change and unmount', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { container, rerender, unmount } = render(<ChordReadout chord="Am" fingering="Fingered" tip="fingering.select" tipAction={tipAction} />);
    const fingering = rootOf(container).querySelector('.yh-chord-readout__fingering');
    expect(tipAction).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenCalledWith(fingering, 'fingering.select');
    rerender(<ChordReadout chord="Am" fingering="Fingered" tip="fingering.other" tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenLastCalledWith(fingering, 'fingering.other');
    unmount();
    expect(destroy).toHaveBeenCalledTimes(2);
  });

  it('applies no tooltip action without a key', () => {
    const tipAction = vi.fn();
    render(<ChordReadout chord="Am" fingering="Fingered" tipAction={tipAction} />);
    expect(tipAction).not.toHaveBeenCalled();
  });

  it('sets the hero size as its custom property, and none by default', () => {
    const { container, rerender } = render(<ChordReadout chord="Am" />);
    expect(rootOf(container).style.getPropertyValue('--yh-chord-readout-hero')).toBe('');
    rerender(<ChordReadout chord="Am" size="96px" />);
    expect(rootOf(container).style.getPropertyValue('--yh-chord-readout-hero')).toBe('96px');
  });
});
