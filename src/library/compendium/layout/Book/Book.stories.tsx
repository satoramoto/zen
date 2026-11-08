import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { CHECKERS } from '../../book/checkers';
import { FIGURES } from '../../book/figures';
import { FOURIER_FIGURES } from '../../book/fourier/figures';
import { FOURIER_BOOK } from '../../book/fourier/fourier.book';
import { HARMONIC_BOOK } from '../../book/harmonic.book';
import { bookIndex } from '../../model/book';
import { validateEntry } from '../../model/validate';
import { Book } from './Book';

/**
 * The interactive textbook: contents down the side, the open chapter as a Document, a pager
 * under it. Two sample books: the Fourier series book, seven chapters each driven by a figure
 * from the math area (the litmus test: can the compendium carry that story?), and a short one on
 * the harmonic series that exercises every part (a scrub and figure sharing a quantity, a
 * step-wise proof, checked exercises).
 */
const meta = {
  title: 'Compendium/Book',
  component: Book,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { book: HARMONIC_BOOK, figures: FIGURES, checkers: CHECKERS, onProgress: fn(), onChapter: fn() },
} satisfies Meta<typeof Book>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The Fourier book: every chapter validates against it; every chapter has a figure bound to a quantity the text scrubs. */
export const Fourier: Story = {
  args: { book: FOURIER_BOOK, figures: FOURIER_FIGURES },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const index = Object.keys(bookIndex(args.book));
    for (const chapter of args.book.chapters) expect(validateEntry(chapter, { figures: Object.keys(FOURIER_FIGURES), entries: index })).toEqual([]);
    const contents = within(canvas.getByRole('navigation', { name: 'Contents' }));
    expect(contents.getAllByRole('listitem')).toHaveLength(7);
    // The first chapter: the scrub in the text and the epicycle figure share the arrow count.
    const scrub = canvasElement.querySelector<HTMLElement>('.cmp-scrub')!;
    expect(scrub).toHaveAttribute('aria-valuenow', '21');
    expect(canvas.getByRole('img', { name: /21 arrows drawing the heart/ })).toBeInTheDocument();
    scrub.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvas.getByRole('img', { name: /23 arrows drawing the heart/ })).toBeInTheDocument());
    expect(canvas.getByText('(23 − 1) ÷ 2')).toBeInTheDocument();
  },
};

/** Each Fourier chapter opens with its figure and its exercises in place. */
export const FourierChapters: Story = {
  args: { book: FOURIER_BOOK, figures: FOURIER_FIGURES },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    for (const chapter of args.book.chapters.slice(1)) {
      await userEvent.click(canvas.getByRole('button', { name: `${chapter.title} →` }));
      expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(chapter.title);
      expect(canvasElement.querySelector('[data-missing-figure], [data-missing-entry], [data-missing-quantity]')).toBeNull();
      expect(canvas.getAllByRole('figure').length).toBeGreaterThan(0);
    }
    // The last chapter's exercise checks.
    await userEvent.type(canvas.getByRole('textbox', { name: 'Your answer' }), '0{Enter}');
    expect(canvas.getByText(/correct/i)).toBeInTheDocument();
  },
};

/** The harmonic series book: every chapter validates; the contents list them with their exercise counts. */
export const HarmonicSeries: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const index = Object.keys(bookIndex(args.book));
    for (const chapter of args.book.chapters) expect(validateEntry(chapter, { figures: Object.keys(FIGURES), entries: index, checkers: Object.keys(CHECKERS) })).toEqual([]);
    const contents = within(canvas.getByRole('navigation', { name: 'Contents' }));
    expect(contents.getAllByRole('listitem')).toHaveLength(args.book.chapters.length);
    expect(contents.getByRole('button', { name: /overtones/i }).closest('li')).toHaveTextContent('0/2');
    expect(contents.getByRole('button', { name: /the harmonic series/i })).toHaveAttribute('aria-current', 'page');
    // The expression checker, registered by the book: a spelling the grammar folds, equal across the range.
    const field = canvas.getByRole('textbox', { name: 'Your answer' });
    await userEvent.type(field, 'n^2{Enter}');
    expect(canvas.getByText(/not yet/i)).toBeInTheDocument();
    await userEvent.clear(field);
    await userEvent.type(field, '1 ÷ n{Enter}');
    expect(canvas.getByText(/correct/i)).toBeInTheDocument();
    expect(contents.getByRole('button', { name: /the harmonic series/i }).closest('li')).toHaveTextContent('1/1');
  },
};

/** The pager and the contents turn chapters; the host hears which. */
export const TurnsChapters: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Overtones →' }));
    expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Overtones');
    expect(args.onChapter).toHaveBeenLastCalledWith('overtones');
    await userEvent.click(canvas.getByRole('button', { name: 'Divergence →' }));
    expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Divergence');
    expect(canvas.queryByRole('button', { name: /→$/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: '← Overtones' }));
    expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Overtones');
    const contents = within(canvas.getByRole('navigation', { name: 'Contents' }));
    await userEvent.click(contents.getByRole('button', { name: /the harmonic series/i }));
    expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('The harmonic series');
  },
};

/** A scrub in the text and the figure hold one quantity: step the number, the figure's slider follows, and back. */
export const LinkedQuantity: Story = {
  args: { initial: 'overtones' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Two sliders share the quantity: the scrub in the text (a span) and the figure's own.
    const scrub = canvasElement.querySelector<HTMLElement>('.cmp-scrub')!;
    const figureSlider = canvas.getAllByRole('slider').find((s) => s !== scrub)!;
    expect(scrub).toHaveAttribute('aria-valuenow', '3');
    expect(figureSlider).toHaveAttribute('aria-valuenow', '3');
    expect(canvas.getByText('3 loops')).toBeInTheDocument();
    scrub.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(scrub).toHaveAttribute('aria-valuenow', '5');
    expect(canvas.getByText('5 loops')).toBeInTheDocument();
    await waitFor(() => expect(figureSlider).toHaveAttribute('aria-valuenow', '5'));
    await waitFor(() => expect(canvas.getByRole('img', { name: /mode 5/i })).toBeInTheDocument());
    // The figure's own slider is the other way in.
    figureSlider.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(scrub).toHaveAttribute('aria-valuenow', '4'));
  },
};

/** Answering an exercise marks it done in the contents and reports the whole progress. */
export const Progress: Story = {
  args: { initial: 'overtones' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const contents = within(canvas.getByRole('navigation', { name: 'Contents' }));
    expect(contents.getByRole('button', { name: /overtones/i }).closest('li')).toHaveTextContent('0/2');
    const fields = canvas.getAllByRole('textbox', { name: 'Your answer' });
    await userEvent.type(fields[0], '4{Enter}');
    expect(contents.getByRole('button', { name: /overtones/i }).closest('li')).toHaveTextContent('1/2');
    expect(args.onProgress).toHaveBeenLastCalledWith({ 'overtones/nodes': true });
    await userEvent.type(fields[1], 'perfect fifth{Enter}');
    expect(contents.getByRole('button', { name: /overtones/i }).closest('li')).toHaveTextContent('2/2');
    // Turning away and back keeps it.
    await userEvent.click(canvas.getByRole('button', { name: 'Divergence →' }));
    await userEvent.click(canvas.getByRole('button', { name: '← Overtones' }));
    expect(canvas.getAllByText(/correct/i)).toHaveLength(2);
  },
};

/** Progress restored from the host: the chapter opens with its exercises already ticked. */
export const Restored: Story = {
  args: { initial: 'divergence', progress: { 'divergence/past-two': true, 'divergence/past-three': true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(within(canvas.getByRole('navigation', { name: 'Contents' })).getByRole('button', { name: /divergence/i }).closest('li')).toHaveTextContent('2/3');
    expect(canvas.getAllByText(/correct/i)).toHaveLength(2);
  },
};

/** The proof on the divergence page reveals step by step inside the page. */
export const StepsInPage: Story = {
  args: { initial: 'divergence' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = within(canvas.getByRole('region', { name: 'Why the harmonic series diverges' }));
    expect(region.getAllByRole('listitem')).toHaveLength(1);
    await userEvent.click(region.getByRole('button', { name: 'Show all' }));
    expect(region.getAllByRole('listitem')).toHaveLength(5);
  },
};
