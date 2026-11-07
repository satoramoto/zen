import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { SAMPLE_FILES } from '../../fixtures/sample';
import { parseSpec } from '../../model/spec';
import { ZEN_FILES } from '../../stories/zen';
import { Spec } from './Spec';

/** A capability's spec as a document: purpose, then each requirement with its scenarios. */
const meta = {
  title: 'Openspec/Spec',
  component: Spec,
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
  args: { spec: parseSpec('user-auth', SAMPLE_FILES['specs/user-auth/spec.md']) },
} satisfies Meta<typeof Spec>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every requirement is a labelled region; every scenario lists its steps with keyword badges. */
export const UserAuth: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole('region', { name: /^Requirement:/ })).toHaveLength(args.spec.requirements.length);
    const wrong = canvas.getByLabelText('Scenario: Wrong password');
    expect(within(wrong).getAllByRole('listitem').map((li) => li.textContent?.slice(0, 5))).toEqual(['WHENa', 'THENt', 'ANDno']);
  },
};

/** The spec that describes these stories, from zen's own openspec folder. */
export const OpenspecViewer: Story = {
  name: 'openspec-viewer (zen)',
  args: { spec: parseSpec('openspec-viewer', ZEN_FILES['specs/openspec-viewer/spec.md'] ?? '# openspec-viewer Specification\n') },
};
