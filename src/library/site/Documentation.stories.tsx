import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { scenario, captureCheckpoint } from 'story-spec';
import { Documentation } from './Documentation';
import { withLibraryTheme } from '../storybook';

const meta = {
  title: 'Site/Documentation', component: Documentation,
  decorators: [withLibraryTheme],
  args: {
    title: 'Project notes', description: 'Architecture close to the source', home: '/project/',
    current: '/project/architecture/', revision: 'abc1234',
    html: '<h1>Architecture</h1><p>The state machine is independent of rendering.</p>',
    pages: [
      { title: 'Overview', href: '/project/', text: 'Start here' },
      { title: 'Architecture', href: '/project/architecture/', text: 'state machine rendering ownership' },
      { title: 'Development', href: '/project/development/', text: 'build and verify' },
    ],
    references: [{ title: 'API reference', href: '/project/api/index.html' }],
  },
  parameters: { layout: 'fullscreen', spec: {
    capability: 'site-documentation',
    purpose: 'Projects publish source-authored documentation through shared Zen static-site machinery with readable architecture, base-aware navigation, search and generated references.',
  } },
} satisfies Meta<typeof Documentation>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ReadSourceDocumentation: Story = scenario({
  requirement: 'Static reading and navigation',
  shall: 'The site SHALL render source-authored documentation and page navigation as static HTML, identify the current page and expose the documented source revision.',
  when: 'a reader opens an architecture page',
  then: 'the architecture, current navigation entry and source revision are readable',
  check: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Architecture' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Architecture' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByText('Built from source · abc1234')).toBeVisible();
  },
});

export const FindAConcept: Story = scenario({
  walkthrough: {
    id: 'find-documentation', title: 'Find documentation', chapter: 'Getting started', order: 1,
    checkpoints: [
      { id: 'start', caption: 'Enter a topic in Search.', alt: 'Documentation page with an empty search field.',
        callouts: [{ number: 1, rect: [0.0375, 0.32125, 0.2, 0.07875], text: 'Search the documentation' }] },
      { id: 'result', caption: 'Choose the matching page.', alt: 'Search results offering the Architecture page.' },
    ],
  },
  requirement: 'Search generated page text',
  shall: 'Readers SHALL be able to search generated documentation titles and text and follow matching page links with a keyboard.',
  when: 'a reader searches for a concept in the documentation',
  then: 'the matching architecture page is offered as a keyboard-reachable link',
  act: async (context) => {
    const { canvasElement } = context;
    await captureCheckpoint(context, 'start');
    await userEvent.type(within(canvasElement).getByRole('searchbox'), 'ownership');
    await userEvent.tab();
  },
  check: async (context) => {
    const { canvasElement } = context;
    const search = within(within(canvasElement).getByRole('region', { name: 'Documentation search' }));
    await expect(search.getByRole('status')).toHaveTextContent('1 matching pages');
    await expect(search.getByRole('link', { name: 'Architecture' })).toHaveFocus();
    await captureCheckpoint(context, 'result');
  },
});

export const NoMatchingConcept: Story = scenario({
  requirement: 'Search generated page text',
  when: 'a reader searches for a concept absent from the documentation',
  then: 'the search reports no matches without removing the ordinary navigation',
  act: async ({ canvasElement }) => { await userEvent.type(within(canvasElement).getByRole('searchbox'), 'nonexistent'); },
  check: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('No matching pages');
    await expect(within(canvasElement).getByRole('navigation', { name: 'Documentation' })).toBeVisible();
  },
});

export const OpenGeneratedReferences: Story = scenario({
  requirement: 'Project-base and generated references',
  shall: 'The site SHALL publish page, asset and generated-reference links beneath the configured project base, rejecting duplicate routes and conflicting generated mounts during builds.',
  when: 'a reader opens a documentation site hosted beneath a project path',
  then: 'its navigation and generated API reference preserve that project path',
  check: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'API reference ↗' })).toHaveAttribute('href', '/project/api/index.html');
    await expect(canvas.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/project/');
  },
});
