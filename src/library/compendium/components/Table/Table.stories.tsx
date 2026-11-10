import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Document } from '../../layouts/Document/Document';
import { paragraph, ref, scrub, section, table, tex, type Entry } from '../../model/document';
import { Formula } from '../Formula/Formula';
import { Table } from './Table';

/** A ruled table in the reading column: formula cells, row heads, and (in a page) a live cell. */
const meta = {
  title: 'Compendium/Components/Table',
  component: Table,
  decorators: [withLibraryTheme],
  args: {
    label: 'The special angles',
    head: ['θ', <Formula tex={String.raw`\sin\theta`} />, <Formula tex={String.raw`\cos\theta`} />, <Formula tex={String.raw`\tan\theta`} />],
    rows: [
      ['30°', <Formula tex={String.raw`\frac12`} />, <Formula tex={String.raw`\frac{\sqrt3}{2}`} />, <Formula tex={String.raw`\frac{1}{\sqrt3}`} />],
      ['45°', <Formula tex={String.raw`\frac{\sqrt2}{2}`} />, <Formula tex={String.raw`\frac{\sqrt2}{2}`} />, <Formula tex="1" />],
      ['60°', <Formula tex={String.raw`\frac{\sqrt3}{2}`} />, <Formula tex={String.raw`\frac12`} />, <Formula tex={String.raw`\sqrt3`} />],
    ],
    rowHeads: true,
  },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Column heads and row heads are real heads; formula cells typeset. */
export const SpecialAngles: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = canvas.getByRole('table');
    expect(canvas.getByRole('region', { name: 'The special angles' })).toBeInTheDocument();
    expect(within(t).getAllByRole('columnheader')).toHaveLength(4);
    expect(within(t).getAllByRole('rowheader')).toHaveLength(3);
    expect(t.querySelectorAll('math').length).toBeGreaterThanOrEqual(9);
  },
};

const LIVE: Entry = {
  id: 'live',
  title: 'A live cell',
  summary: 'A table whose cell shows a quantity the text scrubs.',
  quantities: { theta: { value: 30, min: 0, max: 360, unit: '°', label: 'θ' } },
  sections: [
    section(
      'Signs',
      paragraph('Set θ to ', scrub('theta'), '.'),
      table('Where θ is', [['Quantity'], ['Value']], [[['θ'], [ref('theta')]], [[tex(String.raw`\sin\theta`)], ['the figure’s']]], { rowHeads: true }),
    ),
  ],
};

/** In a page, a `ref` cell follows the scrub. */
export const Live: Story = {
  render: () => <Document entry={LIVE} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(within(canvas.getByRole('table')).getByText('30°')).toBeInTheDocument();
    const s = canvasElement.querySelector<HTMLElement>('.cmp-scrub')!;
    s.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(within(canvas.getByRole('table')).getByText('31°')).toBeInTheDocument());
  },
};
