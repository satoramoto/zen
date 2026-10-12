import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { ActionButton } from '../ActionButton/ActionButton';
import { Modal, Sheet, type SheetSide } from './Modal';

const Page = () => (
  <div style={{ display: 'grid', gap: 'var(--space-2)', color: 'var(--text-2)' }}>
    <p style={{ margin: 0 }}>The view behind: whatever you were doing.</p>
    <ActionButton onPress={() => {}}>A control behind</ActionButton>
  </div>
);

const Rows = ({ n = 6 }: { n?: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span>Setting {i + 1}</span>
        <ActionButton onPress={() => {}} label={`Change setting ${i + 1}`}>
          Change
        </ActionButton>
      </div>
    ))}
  </>
);

const meta = {
  title: 'Design OS/Components/Core/Modal',
  component: Modal,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Delete take',
    onClose: fn(),
    children: 'The take and its stems are deleted for good. Anything that plays it stops.',
  },
  argTypes: { width: { control: { type: 'number', min: 200, max: 900 } } },
  render: (args) => (
    <div style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      <Page />
      <Modal {...args} />
    </div>
  ),
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A question with its actions; the one that does the thing goes first. */
export const WithActions: Story = {
  args: {
    actions: (
      <>
        <ActionButton tone="danger" onPress={() => {}}>
          Delete
        </ActionButton>
        <ActionButton onPress={() => {}}>Keep</ActionButton>
      </>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const dialog = within(canvasElement).getByRole('dialog', { name: 'Delete take' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(dialog).toHaveFocus());
    // Tab goes round the dialog's controls: ×, Delete, Keep, then back to ×.
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** No `actions`: the row is left out; the × is always there. */
export const NoActions: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-part="actions"]')).toBeNull();
    // A click on the pane keeps it; a click on the scrim closes it.
    await userEvent.click(canvas.getByText(/deleted for good/));
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-part="scrim"]')!);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** `label` names it for assistive technology where the title isn't the whole story. */
export const Labelled: Story = {
  args: { title: 'Export', label: 'Export stems', children: 'Each part to its own file.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('dialog', { name: 'Export stems' })).toBeInTheDocument();
  },
};

/** `width` in px. */
export const Wide: Story = { args: { width: 620 } };

function Asking() {
  const [asking, setAsking] = useState(false);
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      <ActionButton onPress={() => setAsking(true)}>Delete take…</ActionButton>
      {asking && (
        <Modal
          title="Delete take"
          onClose={() => setAsking(false)}
          actions={
            <ActionButton tone="danger" onPress={() => setAsking(false)}>
              Delete
            </ActionButton>
          }
        >
          The take and its stems are deleted for good.
        </Modal>
      )}
    </div>
  );
}

/** Open by being mounted: closing unmounts it and focus goes back to the button that opened it. */
export const OpenAndClose: Story = {
  render: () => <Asking />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: 'Delete take…' });
    await userEvent.click(opener);
    await waitFor(() => expect(canvas.getByRole('dialog')).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog')).toBeNull();
    await expect(opener).toHaveFocus();
  },
};

function SheetDemo({ side, modal, rows }: { side: SheetSide; modal: boolean; rows: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      <ActionButton onPress={() => setOpen(true)}>Open sheet</ActionButton>
      <Page />
      {open && (
        <Sheet title={modal ? 'Settings' : 'More effects'} side={side} modal={modal} onClose={() => setOpen(false)}>
          <Rows n={rows} />
        </Sheet>
      )}
    </div>
  );
}

/** Settings: down the right, full height, over a scrim; the head stays while the body scrolls. */
export const SheetRight: StoryObj<typeof Sheet> = {
  render: () => <SheetDemo side="right" modal rows={24} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = canvas.getByRole('dialog', { name: 'Settings' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close settings' }));
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};

/** More effects: a drawer along the bottom, non-modal, so the page behind stays usable. */
export const SheetBottom: StoryObj<typeof Sheet> = {
  render: () => <SheetDemo side="bottom" modal={false} rows={3} />,
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog', { name: 'More effects' });
    await expect(dialog).not.toHaveAttribute('aria-modal');
    await expect(canvasElement.querySelector('[data-part="scrim"]')).toBeNull();
  },
};
