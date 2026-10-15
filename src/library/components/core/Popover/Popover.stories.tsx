import { useCallback, useRef, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Popover, type Dismissal, type PopupBox } from './Popover';

interface HarnessProps {
  /** Where the trigger sits on the canvas: under it, over it when it's near the bottom, clamped at the right. */
  place: 'top-left' | 'bottom-left' | 'top-right';
  /** Hang it off a box measured once instead of the live trigger. */
  box?: boolean;
  /** Open on first render. */
  open?: boolean;
  rows?: number;
  /** Put a find box and two buttons in the panel, for the keyboard. */
  controls?: boolean;
  onDismiss?: (how: Dismissal) => void;
}

/** A controlled find box and two buttons: what Esc and Tab are tried on. */
function Controls() {
  const [find, setFind] = useState('');
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <input aria-label="Find" value={find} onChange={(e) => setFind(e.target.value)} />
      <span>{`Finding: ${find || 'nothing'}`}</span>
      <button type="button">Apply</button>
      <button type="button">Reset</button>
    </div>
  );
}

const SPOTS: Record<HarnessProps['place'], CSSProperties> = {
  'top-left': { top: 'var(--space-6)', left: 'var(--space-6)' },
  'bottom-left': { bottom: 'var(--space-4)', left: 'var(--space-6)' },
  'top-right': { top: 'var(--space-6)', right: 'var(--space-2)' },
};

/** A trigger with a panel hanging off it: the only shape a Popover is used in. */
function Harness({ place, box = false, open: initial = true, rows = 4, controls = false, onDismiss }: HarnessProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(initial);
  const [anchor, setAnchor] = useState<PopupBox | null>(null);
  const [last, setLast] = useState<Dismissal | null>(null);
  const dismiss = useCallback(
    (how: Dismissal) => {
      setOpen(false);
      setLast(how);
      onDismiss?.(how);
    },
    [onDismiss],
  );
  const toggle = () => {
    const r = trigger.current?.getBoundingClientRect();
    if (r) setAnchor({ left: r.left, top: r.top, bottom: r.bottom, width: r.width });
    setOpen((o) => !o);
  };
  const hang = box ? anchor : trigger;
  return (
    <div style={{ position: 'relative', height: '100vh', minHeight: 360, color: 'var(--text-1)', fontFamily: 'var(--font-sans)' }}>
      <p style={{ margin: 0, padding: 'var(--space-4)', color: 'var(--text-3)', fontSize: 'var(--size-caption)' }}>
        Last dismissal: {last ?? 'none'}
      </p>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        onClick={toggle}
        style={{ position: 'absolute', ...SPOTS[place], height: 'var(--control-h)', padding: '0 var(--space-4)' }}
      >
        Details
      </button>
      {open && hang && (
        <Popover anchor={hang} onDismiss={dismiss} role="dialog" label="Details" id="details">
          <div style={{ padding: 'var(--space-3)', minWidth: 'max(var(--lib-popover-anchor), 180px)', display: 'grid', gap: 'var(--space-2)' }}>
            {controls ? (
              <Controls />
            ) : (
              Array.from({ length: rows }, (_, i) => <div key={i}>Row {i + 1}</div>)
            )}
          </div>
        </Popover>
      )}
    </div>
  );
}

const meta = {
  title: 'Design OS/Components/Core/Popover',
  component: Harness,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { place: 'top-left', onDismiss: fn() },
  argTypes: {
    place: { control: 'inline-radio', options: Object.keys(SPOTS) },
    box: { control: 'boolean' },
    rows: { control: { type: 'number', min: 1, max: 40 } },
  },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Under its trigger, drawn as the theme's float layer. A pointer elsewhere dismisses it, and says so. */
export const Under: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByRole('dialog', { name: 'Details' });
    await expect(panel).toHaveAttribute('data-layer', 'float');
    await expect(panel.parentElement).toHaveAttribute('popover', 'manual');
    await userEvent.click(canvas.getByText(/Last dismissal/));
    await expect(args.onDismiss).toHaveBeenLastCalledWith('pointer');
  },
};

/** Escape dismisses and is kept from the host; a press on the trigger doesn't count as elsewhere. */
export const Escape: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('dialog')).toBeInTheDocument());
    await userEvent.keyboard('{Escape}');
    await expect(args.onDismiss).toHaveBeenLastCalledWith('escape');
  },
};

/** Esc in the find box clears its text first (the field hears it); only the next Esc closes. */
export const EscapeClearsField: Story = {
  args: { controls: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const find = canvas.getByRole('textbox', { name: 'Find' });
    await userEvent.click(find);
    await userEvent.type(find, 'kick');
    await expect(canvas.getByText('Finding: kick')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(find).toHaveValue('');
    await expect(canvas.getByText('Finding: nothing')).toBeInTheDocument();
    await expect(canvas.getByRole('dialog')).toBeInTheDocument();
    await expect(args.onDismiss).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await expect(args.onDismiss).toHaveBeenLastCalledWith('escape');
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/** While focus is in the panel, Tab and ⇧Tab go round its controls and never leave it. */
export const TabStaysInside: Story = {
  args: { controls: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const find = canvas.getByRole('textbox', { name: 'Find' });
    const apply = canvas.getByRole('button', { name: 'Apply' });
    const reset = canvas.getByRole('button', { name: 'Reset' });
    await userEvent.click(find);
    await userEvent.tab();
    await expect(apply).toHaveFocus();
    await userEvent.tab();
    await expect(reset).toHaveFocus();
    await userEvent.tab();
    await expect(find).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(reset).toHaveFocus();
    await expect(canvas.getByRole('dialog')).toBeInTheDocument();
    await expect(args.onDismiss).not.toHaveBeenCalled();
  },
};

/** Near the bottom of the window: there's more room above, so it flips over its trigger. */
export const Flipped: Story = {
  args: { place: 'bottom-left', rows: 6 },
  play: async ({ canvasElement }) => {
    const panel = within(canvasElement).getByRole('dialog');
    await waitFor(() => expect(panel.parentElement).toHaveAttribute('data-above'));
  },
};

/** At the right edge: clamped inside the window rather than hanging off it. */
export const Clamped: Story = {
  args: { place: 'top-right' },
};

/** Taller than the room: the panel scrolls inside the height left under the trigger. */
export const Scrolls: Story = {
  args: { rows: 40 },
};

/** Hung off a box measured when it opened (press the trigger): a scroll or resize dismisses it as stale. */
export const FromBox: Story = {
  args: { box: true, open: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Details' }));
    await expect(await canvas.findByRole('dialog')).toBeInTheDocument();
  },
};
