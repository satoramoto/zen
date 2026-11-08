import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { CHECKERS } from '../../book/checkers';
import { FIGURES } from '../../book/figures';
import { HARMONIC } from '../../book/harmonic.entry';
import { HARMONIC_BOOK } from '../../book/harmonic.book';
import { bookIndex } from '../../model/book';
import { formulasIn, runsIn } from '../../model/document';
import { validateEntry } from '../../model/validate';
import { Document } from './Document';

const ENTRIES = bookIndex(HARMONIC_BOOK);

/**
 * An entry drawn from its data: the reading column with its marks, sidenotes, peeks and
 * formulas (TeX, typeset to MathML), and the wide blocks: a live figure resolved by name, a
 * code sample, a proof graph, a timeline. Peeks resolve against the sample book's index.
 */
const meta = {
  title: 'Compendium/Layout/Document',
  component: Document,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { entry: HARMONIC, figures: FIGURES, entries: ENTRIES, checkers: CHECKERS },
  argTypes: { measure: { control: { type: 'range', min: 44, max: 76, step: 1 } } },
} satisfies Meta<typeof Document>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The harmonic series: the page draws what the data says. */
export const Entry: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(validateEntry(HARMONIC, { figures: Object.keys(FIGURES), entries: Object.keys(ENTRIES), checkers: Object.keys(CHECKERS) })).toEqual([]);
    // Every formula is a MathML element (the displayed ones on their own line), every peek a
    // button, every note a sidenote, the figure resolved by name.
    const formulas = [...formulasIn(HARMONIC)];
    // A hint's or solution's formula is drawn only on request.
    const hidden = HARMONIC.sections
      .flatMap((s) => s.blocks)
      .filter((b) => b.kind === 'exercise')
      .flatMap((b) => [...(b.hint ?? []), ...(b.solution ?? [])])
      .filter((r) => typeof r !== 'string' && 'tex' in r).length;
    expect(canvasElement.querySelectorAll('math')).toHaveLength(formulas.length - hidden);
    expect(canvasElement.querySelectorAll('math[display="block"]')).toHaveLength(formulas.filter((f) => f.display).length);
    const runs = [...runsIn(HARMONIC)].map((r) => r.run);
    expect(canvas.getAllByRole('button', { name: /overtones|Pythagorean tuning|diverges/ })).toHaveLength(runs.filter((r) => typeof r !== 'string' && 'peek' in r).length);
    expect(canvasElement.querySelectorAll('.cmp-sidenote')).toHaveLength(runs.filter((r) => typeof r !== 'string' && 'note' in r).length);
    await expect(canvas.findByRole('figure', { name: /overtones/i })).resolves.toBeInTheDocument();
    expect(canvasElement.querySelector('[data-missing-figure], [data-missing-entry], [data-missing-quantity]')).toBeNull();
  },
};

/** A name the page has no figure for draws a notice where the figure would be, not a crash. */
export const MissingFigure: Story = {
  args: { figures: {} },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-missing-figure="harmonic-string"]')).toHaveTextContent('No figure');
  },
};
