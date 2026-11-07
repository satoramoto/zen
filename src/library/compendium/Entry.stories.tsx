import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { Document, type FigureRegistry } from './Document';
import { HARMONIC, HARMONIC_ENTRIES } from './harmonic.entry';
import { HarmonicString } from './HarmonicString';
import { formulasIn } from './model/document';
import { validateEntry } from './model/validate';

/** The figures this page can draw. */
const FIGURES: FigureRegistry = { 'harmonic-string': HarmonicString };

/**
 * A Compendium entry drawn from its data (`harmonic.entry.ts`, a `Document`): the reading
 * column with its marks, sidenotes, peeks and formulas (TeX, typeset to MathML), and the wide
 * blocks: a live figure resolved by name, a code sample, a proof graph, a timeline.
 */
const meta = {
  title: 'Design OS/Compendium/Entry',
  component: Document,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { entry: HARMONIC, figures: FIGURES, entries: HARMONIC_ENTRIES },
  argTypes: { measure: { control: { type: 'range', min: 44, max: 76, step: 1 } } },
} satisfies Meta<typeof Document>;
export default meta;

export const Entry: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(validateEntry(HARMONIC, { figures: Object.keys(FIGURES), entries: Object.keys(HARMONIC_ENTRIES) })).toEqual([]);
    // The page draws what the data says: every formula is a MathML element (the displayed ones on
    // their own line), every peek a button, every note a sidenote, the figure resolved by name.
    const formulas = [...formulasIn(HARMONIC)];
    expect(canvasElement.querySelectorAll('math')).toHaveLength(formulas.length);
    expect(canvasElement.querySelectorAll('math[display="block"]')).toHaveLength(formulas.filter((f) => f.display).length);
    const runs = HARMONIC.sections.flatMap((s) => s.blocks.flatMap((b) => (b.kind === 'paragraph' ? b.runs : [])));
    expect(canvas.getAllByRole('button', { name: /overtones|Pythagorean tuning|diverges/ })).toHaveLength(runs.filter((r) => typeof r !== 'string' && 'peek' in r).length);
    expect(canvasElement.querySelectorAll('.cmp-sidenote')).toHaveLength(runs.filter((r) => typeof r !== 'string' && 'note' in r).length);
    await expect(canvas.findByRole('figure', { name: /overtones/i })).resolves.toBeInTheDocument();
    expect(canvasElement.querySelector('[data-missing-figure], [data-missing-entry]')).toBeNull();
  },
};

/** A name the page has no figure for draws a notice where the figure would be, not a crash. */
export const MissingFigure: StoryObj<typeof meta> = {
  args: { figures: {} },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-missing-figure="harmonic-string"]')).toHaveTextContent('No figure');
  },
};
