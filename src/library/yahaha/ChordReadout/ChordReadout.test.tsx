/**
 * ChordReadout, ported from yahaha/src/ui/ChordReadout/ChordReadout.test.ts: the fingering's
 * tooltip as `data-tip` (no native title) with the whole text as `data-tip-text`, the whole text in
 * the accessible name, and the hero stepping down until it fits.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChordReadout } from './ChordReadout';

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
  });

  it('held mutes the chord and says so', () => {
    const { container } = render(<ChordReadout chord="C" extension="maj7" notes={AM7} fingering="Fingered" held />);
    const readout = screen.getByRole('img', { name: 'Chord Cmaj7, held: A C E G, Fingered' });
    expect(readout).toHaveAttribute('data-held', 'true');
    expect(container.querySelector('.yh-chord-readout__held')).toHaveTextContent('held');
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
