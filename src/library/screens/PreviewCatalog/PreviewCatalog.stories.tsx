import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { scenario } from 'story-spec';

const retiredGroups = ['Overview', 'Thinking with Type', 'Grid Systems', 'Interaction of Color', 'Refactoring UI', 'On Web Typography', 'Practical Typography'];
// Stories tagged browser here need a laid-out page: they play in a real browser, not on zen-stories' virtual DOM.
const meta = {
  title: 'Core/Screens/Preview catalog',
  render: () => <iframe title="Root preview" style={{ width: '100%', height: 240, border: 0 }} />,
  parameters: { spec: {
    capability: 'preview-catalog',
    purpose: 'Keep Zen’s development preview focused on maintained component and application examples after retirement of the original field guide.',
  } },
  tags: ['browser'],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const BrowseTheMaintainedCatalog: Story = scenario({
  requirement: 'Maintained story catalog',
  shall: 'The Storybook catalog SHALL omit the retired field guide while preserving all unrelated story IDs and previews.',
  when: 'a reader opens the Storybook catalog',
  then: 'the Overview and six field-guide book groups are absent while the existing unrelated stories remain available',
  check: async () => {
    const response = await fetch('./index.json');
    await expect(response.ok).toBe(true);
    const { entries } = await response.json() as { entries: Record<string, { title: string }> };
    const titles = Object.values(entries).map(entry => entry.title);
    for (const group of retiredGroups) await expect(titles.some(title => title === group || title.startsWith(`${group}/`))).toBe(false);
    for (const group of ['Core', 'Music', 'Math', 'Compendium', 'Harness', 'Yahaha']) {
      await expect(titles.some(title => title.startsWith(`${group}/`))).toBe(true);
    }
  },
});

// Played by scripts/check-preview-catalog.mjs, which serves the root page it reads (`?rootPreview=`):
// not a test to Storybook's runners.
export const VisitTheOldGuideAddress: Story = { ...scenario({
  requirement: 'Root preview retirement',
  shall: 'The root preview SHALL display a minimal retirement notice instead of loading the field guide, without changing the existing preview port configuration.',
  when: 'a reader opens the root preview URL',
  then: 'a readable retirement notice appears without book navigation or interactive field-guide examples',
  check: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTitle('Root preview') as HTMLIFrameElement;
    const url = new URLSearchParams(location.search).get('rootPreview') ?? 'http://127.0.0.1:4191';
    const response = await fetch(url);
    await expect(response.ok).toBe(true);
    frame.srcdoc = await response.text();
    await waitFor(async () => {
      const body = frame.contentDocument!.body;
      await expect(within(body).getByRole('heading', { name: 'Zen' })).toBeVisible();
      await expect(within(body).getByText('The interactive field guide has been retired.')).toBeVisible();
      await expect(body.querySelector('.field-guide, .book-nav, script[src*="/src/main.tsx"]')).toBeNull();
    });
  },
}), tags: ['!test'] };
