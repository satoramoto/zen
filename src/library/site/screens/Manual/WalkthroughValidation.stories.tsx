import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { scenario } from 'story-spec';

/** The bounded integration runner serves its fresh results here, never a checked-in success fixture. */
async function evidence(name: string) {
  const response = await fetch(`/manual-evidence/${name}.json`, { cache: 'no-store' });
  await expect(response.ok, `Missing fresh evidence: ${name}`).toBe(true);
  return response.json();
}
const meta = {
  title: 'Site/Screens/WalkthroughValidation',
  render: () => <p>These scenarios check evidence from the bounded web and native capture runners.</p>,
  parameters: { spec: {
    capability: 'manual-walkthroughs',
    purpose: 'Turn verified interactions with web and native applications into portable screenshot-led walkthroughs that documentation builders can publish without recreating the application.',
  } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const ReadEvidenceFromEitherRenderer: Story = scenario({
  requirement: 'Portable walkthrough evidence',
  shall: 'Each walkthrough SHALL provide a versioned bundle with stable task and scenario identities, chapter and order, ordered screenshot steps, concise captions, accessible image descriptions, dimensions, optional numbered callouts, source identity and capture environment. Web and native producers SHALL use the same contract.',
  when: 'a reader opens a walkthrough produced by a web or native scenario',
  then: 'the task, ordered screenshots, captions and source environment are available in the same presentation',
  check: async () => {
    for (const adapter of ['web', 'native']) {
      const result = await evidence(adapter);
      await expect(result.validated).toBe(true);
      await expect(result.bundle.run.adapter).toBe(adapter);
      await expect(result.bundle.steps.length).toBeGreaterThanOrEqual(2);
      for (const step of result.bundle.steps) {
        await expect(step.caption.length).toBeGreaterThan(0);
        await expect(step.alt.length).toBeGreaterThan(0);
      }
    }
  },
});
export const FinishAVerifiedWalkthrough: Story = scenario({
  requirement: 'Publish only completed runs',
  shall: 'A walkthrough SHALL become publishable only after every required checkpoint is captured and the scenario assertions pass. Assertion failure, capture failure or timeout SHALL fail the run without publishing partial evidence or substituting a previous successful run.',
  when: 'a scenario finishes with passing assertions and all required captures',
  then: 'its complete walkthrough is available for publication',
  check: async () => {
    const result = await evidence('web');
    await expect(result.exitCode).toBe(0);
    await expect(result.bundle.run.status).toBe('completed');
    await expect(result.captured).toEqual(result.required);
  },
});
export const FailAfterAnEarlierScreenshot: Story = scenario({
  requirement: 'Publish only completed runs',
  when: 'a scenario fails or times out after capturing an earlier step',
  then: 'the run reports failure and cannot publish that partial walkthrough or silently reuse an older success',
  check: async () => {
    const result = await evidence('web-failure');
    await expect(result.captured.length).toBeGreaterThan(0);
    await expect(result.exitCode).not.toBe(0);
    await expect(result.publishable).toBe(false);
    await expect(result.reusedPrevious).toBe(false);
  },
});
export const RejectStaleEvidence: Story = scenario({
  requirement: 'Match evidence to its sources',
  shall: 'Publication SHALL verify bundle version, source revision and content identity against the requested build, required screenshot presence and integrity, unique task and step identities, valid callout geometry and bundle-contained asset paths. Invalid evidence SHALL produce an actionable error naming the affected task or asset.',
  when: 'a build receives captures whose source identity differs from the requested product and scenario sources',
  then: 'publication fails and identifies the walkthrough that needs regeneration',
  check: async () => {
    const result = await evidence('stale');
    await expect(result.exitCode).not.toBe(0);
    await expect(result.error).toContain(result.taskId);
    await expect(result.error).toMatch(/source|stale|regenerate/i);
  },
});
export const RejectAnInvalidBundle: Story = scenario({
  requirement: 'Match evidence to its sources',
  when: 'a build receives an unsupported bundle, duplicate identity, invalid callout or missing, altered or out-of-bundle screenshot',
  then: 'publication fails with an error identifying the invalid evidence',
  check: async () => {
    const result = await evidence('invalid');
    for (const name of ['version', 'duplicate', 'callout', 'missing', 'altered', 'traversal', 'symlink']) {
      await expect(result[name].exitCode, name).not.toBe(0);
      await expect(result[name].error, name).toContain(result[name].taskId);
    }
  },
});
export const EnableAmbientMotionInPichii: Story = scenario({
  requirement: 'Native walkthroughs exercise the native application',
  shall: 'Native walkthroughs SHALL drive the real application\'s input and rendering path, check the resulting state and capture rendered frames at ordered checkpoints. They SHALL record the rendering environment and terminate all owned capture processes on success, failure or timeout.',
  when: 'the native walkthrough navigates to the motion setting and enables it',
  then: 'verified native screenshots show the starting state, setting and enabled result with the rendering environment recorded and the capture process closed',
  check: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/bounded web and native/)).toBeVisible();
    const result = await evidence('native');
    await expect(result.bundle.steps.map((step: { id: string }) => step.id)).toEqual(['start', 'setting', 'enabled']);
    await expect(result.finalState.motion).toBe(true);
    await expect(result.bundle.run.renderer.length).toBeGreaterThan(0);
    await expect(result.ownedProcessesRemaining).toEqual([]);
  },
});
export const StopAStalledNativeCapture: Story = scenario({
  requirement: 'Native walkthroughs exercise the native application',
  when: 'a native walkthrough exceeds its bounded completion time',
  then: 'it reports failure, closes its owned processes and leaves no publishable partial walkthrough',
  check: async () => {
    const result = await evidence('native-timeout');
    await expect(result.timedOut).toBe(true);
    await expect(result.exitCode).not.toBe(0);
    await expect(result.publishable).toBe(false);
    await expect(result.ownedProcessesRemaining).toEqual([]);
  },
});
