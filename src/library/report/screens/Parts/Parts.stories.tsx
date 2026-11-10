import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { Brief as BriefView } from '../../components/Brief/Brief';
import { Findings as FindingsView } from '../../components/Findings/Findings';
import { Segments as SegmentsView } from '../../components/Segments/Segments';
import { Sources as SourcesView } from '../../components/Sources/Sources';
import { Summary as SummaryView } from '../../components/Summary/Summary';
import { REPORT } from '../../model/report.fixtures';

const meta: Meta = {
  title: 'Report/Screens/Parts',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj;

/** Market and goal as labelled prose, scope and method as lists that sit side by side and wrap. */
export const Brief: Story = {
  render: () => (
    <div style={{ maxWidth: '70ch' }}>
      <BriefView brief={REPORT.brief} />
    </div>
  ),
};

/** The headline numbers: a numeral over a label, an optional note; one row that wraps. */
export const Summary: Story = { render: () => <SummaryView stats={REPORT.summary} /> };

/** The tiers as a proportional bar and a legend; segment n takes hue slot n. */
export const Segments: Story = {
  render: () => (
    <div style={{ maxWidth: '70ch' }}>
      <SegmentsView segments={REPORT.segments ?? []} />
    </div>
  ),
};

/** Numbered headed paragraphs. */
export const Findings: Story = {
  render: () => (
    <div style={{ maxWidth: '70ch' }}>
      <FindingsView findings={REPORT.findings} />
    </div>
  ),
};

/** A footnote list. */
export const Sources: Story = { render: () => <SourcesView sources={REPORT.sources ?? []} /> };
