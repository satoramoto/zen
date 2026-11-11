import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { scenario } from 'story-spec';

/** The integration runner supplies the freshly built static manual, including its no-JS checks. */
async function evidence(name: string) {
  const response = await fetch(`/manual-evidence/${name}.json`, { cache: 'no-store' });
  await expect(response.ok, `Missing fresh evidence: ${name}`).toBe(true);
  return response.json();
}
const meta = {
  title: 'Site/Screens/Manual',
  // Played by scripts/check-manual-stories.mjs, which serves the evidence and the built manual
  // they read; no other run can, so they are not tests to Storybook's runners.
  tags: ['!test'],
  render: () => <iframe title="Generated visual manual" src="/manual-preview/manual/find-documentation/" style={{ width: '100%', height: '85vh', border: 0 }} />,
  parameters: { layout: 'fullscreen', spec: { capability: 'site-documentation' } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const FollowAVisualTask: Story = scenario({
  requirement: 'Screenshot-led manual pages',
  shall: 'The site SHALL render verified walkthrough bundles as static task pages grouped by chapter and explicit order, with prominent screenshots, short captions, accessible descriptions and source provenance. Pages SHALL remain readable without JavaScript at desktop and narrow widths. Optional numbered callouts SHALL scale with their screenshot and have matching text explanations.',
  when: 'a reader opens a generated manual task at desktop or narrow width with JavaScript disabled',
  then: 'the ordered screenshots, captions, descriptions and provenance remain readable without horizontal page overflow',
  check: async () => {
    const result = await evidence('reading');
    for (const width of [390, 1440]) {
      await expect(result[width].javascriptEnabled).toBe(false);
      await expect(result[width].overflow).toBe(false);
      await expect(result[width].imagesLoaded).toBe(2);
      await expect(result[width].captions).toHaveLength(2);
      await expect(result[width].provenanceVisible).toBe(true);
    }
  },
});
export const LocateAHighlightedControl: Story = scenario({
  requirement: 'Screenshot-led manual pages',
  when: 'a reader views a resized screenshot with numbered callouts',
  then: 'each callout stays aligned with its target and has a matching numbered text explanation',
  check: async () => {
    const result = await evidence('callouts');
    for (const width of [390, 1440]) {
      await expect(result[width].maxPositionError).toBeLessThan(2);
      await expect(result[width].labels).toEqual(result[width].explanations);
      await expect(result[width].labels.length).toBeGreaterThan(0);
    }
  },
});
export const FindAManualTask: Story = scenario({
  requirement: 'Discover generated manual tasks',
  shall: 'Generated manual tasks SHALL participate in documentation navigation and keyboard-accessible search using their titles and captions. Task, screenshot and source links SHALL respect configured project-base routing where applicable, and conflicting task routes SHALL fail the build.',
  when: 'a reader searches for words in a walkthrough title or caption',
  then: 'a keyboard-reachable result opens the matching task beneath the configured project base with working screenshots',
  check: async () => {
    const result = await evidence('search');
    await expect(result.keyboardReached).toBe(true);
    await expect(result.url).toContain('/project/manual/find-documentation/');
    await expect(result.brokenResources).toEqual([]);
  },
});
export const RejectAConflictingTaskRoute: Story = scenario({
  requirement: 'Discover generated manual tasks',
  when: 'a walkthrough route collides with another task or source documentation page',
  then: 'the build fails and names the conflicting route',
  check: async () => {
    const result = await evidence('collision');
    await expect(result.exitCode).not.toBe(0);
    await expect(result.error).toContain('manual/find-documentation');
  },
});
export const RefreshACaptionFromItsScenario: Story = scenario({
  requirement: 'Generate manuals from validated evidence',
  shall: 'The site SHALL consume the shared walkthrough contract without executing product scenarios during page rendering or requiring the product UI framework. It SHALL validate evidence against the requested build sources and regenerate pages from the current bundle, rejecting failed, incomplete or stale captures.',
  when: 'an author updates a scenario caption, regenerates its passing walkthrough and rebuilds the site',
  then: 'the manual displays the updated caption without editing a second tutorial',
  check: async () => {
    const result = await evidence('caption-refresh');
    await expect(result.after).not.toBe(result.before);
    await expect(result.renderedCaption).toBe(result.after);
    await expect(result.sourceDigestAfter).not.toBe(result.sourceDigestBefore);
  },
});
export const RefuseAnUnverifiedManual: Story = scenario({
  requirement: 'Generate manuals from validated evidence',
  when: 'a site build receives failed, incomplete or stale walkthrough evidence',
  then: 'the build fails with the affected task identified instead of publishing a misleading manual',
  check: async () => {
    const result = await evidence('unverified');
    for (const name of ['failed', 'incomplete', 'stale']) {
      await expect(result[name].exitCode).not.toBe(0);
      await expect(result[name].error).toContain('find-documentation');
    }
  },
});
