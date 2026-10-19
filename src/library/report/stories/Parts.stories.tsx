import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { Brief as BriefView } from '../view/Brief/Brief';
import { Findings as FindingsView } from '../view/Findings/Findings';
import { Segments as SegmentsView } from '../view/Segments/Segments';
import { Sources as SourcesView } from '../view/Sources/Sources';
import { Summary as SummaryView } from '../view/Summary/Summary';
import { REPORT } from './report.fixtures';

const meta: Meta = {
  title: 'Design OS/Report/Parts',
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
