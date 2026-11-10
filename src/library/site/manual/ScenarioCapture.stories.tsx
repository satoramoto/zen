import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { scenario } from 'story-spec';

async function evidence(name: string) {
  const response = await fetch(`/manual-evidence/${name}.json`, { cache: 'no-store' });
  await expect(response.ok, `Missing fresh evidence: ${name}`).toBe(true);
  return response.json();
}
const meta = {
  title: 'Site/ScenarioCapture',
  render: () => <p>Capture checkpoints share the scenario's existing actions and assertions.</p>,
  parameters: { spec: { capability: 'scenario-stories' } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const SelectATaskForTheManual: Story = scenario({
  requirement: 'Opt-in visual walkthrough declarations',
  shall: 'Scenario authors SHALL be able to opt a story into a manual with stable task identity, title, chapter, order and captioned capture checkpoints while retaining one When and one Then. Existing stories without walkthrough declarations SHALL retain their typing, play order, documentation and spec-sync behavior.',
  when: 'an author opts a scenario into a walkthrough and runs manual generation',
  then: 'the selected task appears with its declared title and order while stories without walkthrough declarations are omitted',
  check: async () => {
    const result = await evidence('selection');
    await expect(result.selected).toEqual(['find-documentation']);
    await expect(result.tasks).toEqual([{ id: 'find-documentation', title: 'Find documentation', chapter: 'Getting started', order: 1 }]);
  },
});
export const KeepOrdinaryScenariosCompatible: Story = scenario({
  requirement: 'Opt-in visual walkthrough declarations',
  when: 'an existing scenario without walkthrough metadata is type-checked, played and synchronized',
  then: 'its story type, Given/When/Then execution, documentation and generated specification remain compatible',
  check: async () => {
    const result = await evidence('compatibility');
    await expect(result.typecheckExitCode).toBe(0);
    await expect(result.steps).toEqual(['Given', 'When', 'Then']);
    await expect(result.specUnchanged).toBe(true);
    await expect(result.docsUnchanged).toBe(true);
  },
});
export const FindDocumentationWithSearch: Story = scenario({
  requirement: 'Capture the actions already verified by a story',
  shall: 'Walkthrough checkpoints SHALL capture the current rendered state at awaited points within the existing scenario play. Capture SHALL reuse the story\'s actions and assertions, preserve their order and wait for a stable rendered frame; ordinary Storybook plays SHALL not require a capture service.',
  when: 'the opted-in documentation search scenario runs through its capture adapter',
  then: 'the walkthrough shows the initial search and verified matching result from that same play with concise captions',
  check: async () => {
    const result = await evidence('web');
    await expect(result.bundle.steps.map((step: { id: string }) => step.id)).toEqual(['start', 'result']);
    await expect(result.playCount).toBe(1);
    await expect(result.exitCode).toBe(0);
  },
});
export const PlayWithoutACaptureAdapter: Story = scenario({
  requirement: 'Capture the actions already verified by a story',
  when: 'a walkthrough-enabled story runs in ordinary Storybook without a capture adapter',
  then: 'its actions and assertions finish normally without waiting for a screenshot service',
  check: async () => {
    const result = await evidence('no-adapter');
    await expect(result.exitCode).toBe(0);
    await expect(result.actions).toBe(1);
    await expect(result.checks).toBe(1);
    await expect(result.captures).toBe(0);
  },
});
