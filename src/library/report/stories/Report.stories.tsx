import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { Report, type ReportMeasure } from '../view/Report/Report';
import { REPORT } from './report.fixtures';

interface Args {
  measure: ReportMeasure;
}

const meta: Meta<Args> = {
  title: 'Design OS/Report/Report',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A market research report as one document (docs/research-report.md), here a real one: a band’s festival outreach research, 90 leads. Read the brief top to bottom, then scan the leads. Light and dark come from the toolbar.',
      },
    },
  },
  args: { measure: 'normal' },
  argTypes: {
    measure: { control: 'inline-radio', options: ['narrow', 'normal', 'wide'], description: 'The prose’s line length (about 60, 70 or 80 characters); the lead table always takes the full width.' },
  },
  render: ({ measure }) => <Report report={REPORT} measure={measure} />,
};
export default meta;

type Story = StoryObj<Args>;

export const Whole: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: REPORT.title })).toBeTruthy();
    for (const name of ['Brief', 'Summary', 'Segments', 'Findings', 'Leads', 'Sources']) await expect(canvas.getByRole('heading', { level: 2, name })).toBeTruthy();
    await expect(canvasElement.querySelectorAll('[data-part="row"]')).toHaveLength(REPORT.leads.length);
  },
};

/** The same document in a phone-width column: the lead rows stack into blocks. */
export const Narrow: Story = {
  render: ({ measure }) => (
    <div style={{ maxWidth: '24rem' }}>
      <Report report={REPORT} measure={measure} />
    </div>
  ),
};
