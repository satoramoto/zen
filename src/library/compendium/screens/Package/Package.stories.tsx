import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { renderToString } from 'react-dom/server';
import { scenario } from 'story-spec';
import '@satoramoto/zen/zen.css';
import { withLibraryTheme } from '@satoramoto/zen/storybook';
import { Book } from '@satoramoto/zen/compendium';
import { validateEntry } from '@satoramoto/zen/compendium/model';
import { RightTriangle } from '@satoramoto/zen/math/trig';
import { toRadians } from '@satoramoto/zen/math/trig/model';
import { expressionChecker } from '@satoramoto/zen/math/expression';
import { consumerBook } from './consumer.fixture';

const figures = { triangle: RightTriangle };
const checkers = { expression: expressionChecker };
const meta = {
  title: 'Compendium/Screens/Package', component: Book,
  decorators: [withLibraryTheme],
  args: { book: consumerBook, figures, checkers },
  parameters: { spec: {
    capability: 'compendium-package',
    purpose: 'Applications can compose interactive books using supported Zen package entries, with reusable renderers and framework-free authoring and mathematical helpers.',
  } },
} satisfies Meta<typeof Book>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ReadWithTheInstalledPackage: Story = scenario({
  requirement: 'A supported consumer surface',
  shall: 'Zen SHALL expose supported package entries for its book renderer, document builders and validation, trig figures, and expression and trig-model helpers, with TypeScript declarations and the required styles.',
  when: 'a consuming application opens a book built from its own content using the installed Zen package',
  then: 'its chapter, mathematical formulas, interactive trig figures and exercises render through supported imports',
  act: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox'), '1/2+1/2');
    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
  },
  check: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('math')).not.toBeNull();
    expect(canvasElement.querySelector('svg')).not.toBeNull();
    await expect(within(canvasElement).getByText('Correct', { exact: false })).toBeVisible();
  },
});

export const ServerRenderTheOpeningChapter: Story = scenario({
  requirement: 'Server-renderable book components',
  shall: 'The public book components SHALL render initial chapter markup on the server without requiring browser globals at import or render time.',
  when: 'a server renders an application-owned opening chapter through the installed package',
  then: 'it produces readable chapter markup without a browser-global error',
  check: () => {
    // The Node consumer check repeats this without browser globals; the story shows its fixture.
    const html = renderToString(<Book book={consumerBook} figures={figures} checkers={checkers} />);
    expect(html).toContain('Readable before hydration.');
    expect(html).toContain('<math');
    expect(html).toContain('<svg');
  },
});

export const AuthorWithoutARenderer: Story = scenario({
  requirement: 'Framework-free authoring and mathematics',
  shall: 'Public document-model, validation and pure mathematical helper entries SHALL be usable without importing React, Svelte or Storybook runtime modules.',
  when: 'a renderer-free consumer validates chapter data and evaluates a mathematical answer',
  then: 'it receives validation and answer results without loading a rendering framework',
  check: () => {
    expect(validateEntry(consumerBook.chapters[0], { figures: ['triangle'], checkers: ['expression'] })).toEqual([]);
    expect(toRadians(180)).toBe(Math.PI);
    expect(expressionChecker('1/2+1/2', '1')).toEqual({ correct: true });
  },
});

export const SameContractInLocalDevelopment: Story = scenario({
  requirement: 'Installed and local-source compatibility',
  shall: 'Installed builds and the zen-source condition SHALL expose the same book APIs and usable styling; framework-free theme and Svelte entries SHALL retain their existing import boundaries.',
  when: 'the same consumer book is built with installed exports and with local-source exports',
  then: 'both builds expose the same reader capabilities and the existing pure-entry boundary checks still pass',
  check: ({ canvasElement }) => {
    // Run under either condition; check:lib verifies the import graphs separately.
    expect(canvasElement.querySelector('[data-book="consumer"]')).not.toBeNull();
    expect(within(canvasElement).getByRole('navigation', { name: 'Contents' })).toBeVisible();
    expect(getComputedStyle(canvasElement.querySelector('.cmp-book__grid')!).display).toBe('grid');
  },
});
