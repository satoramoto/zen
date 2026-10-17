import { useCallback, useRef, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Icon } from '../../../primitives/Icon';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { Popover, useHoverIntent, type Dismissal, type PopupBox } from './Popover';

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

/** Sidebar rows: an icon in the faint step, a name, a count in the caption step. */
function Rows({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name, i) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: 'var(--control-h)' }}>
          <Icon tone="faint">
            <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          </Icon>
          <Text tone="secondary" style={{ flex: 1 }}>{name}</Text>
          <Text tone="muted" tabular>{(i + 1) * 7}</Text>
        </div>
      ))}
    </>
  );
}

/**
 * A raised sidebar over a busy picture, with a menu open from it hanging out over the picture. The
 * menu is the sidebar's material, only popping over: the same tint and text steps, a step more
 * blur, a soft shadow and no edge. The component sets none of it; the layers do.
 */
function OverSidebarHarness() {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);
  const dismiss = useCallback(() => setOpen(false), []);
  const picture = 'linear-gradient(120deg, var(--hue-1), var(--hue-2) 35%, var(--role-1) 65%, var(--hue-4))';
  return (
    <div style={{ position: 'relative', height: '100vh', minHeight: 420, background: picture, fontFamily: 'var(--font-sans)' }}>
      <Surface layer="raised" style={{ position: 'absolute', top: 'var(--space-2)', bottom: 'var(--space-2)', left: 'var(--space-2)', width: 240, padding: 'var(--space-3)', display: 'grid', alignContent: 'start', gap: 'var(--space-1)' }}>
        <Text tone="muted" size="caption" weight="strong">Library</Text>
        <Rows names={['All presets', 'Favourites', 'Recently played']} />
        <button ref={trigger} type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} style={{ justifySelf: 'start', marginLeft: 120, height: 'var(--control-h)', padding: '0 var(--space-3)' }}>
          More
        </button>
      </Surface>
      {open && (
        <Popover anchor={trigger} onDismiss={dismiss} role="menu" label="More">
          <div style={{ padding: 'var(--space-2) var(--space-3)', minWidth: 220, display: 'grid', gap: 'var(--space-1)' }}>
            <Text tone="muted" size="caption" weight="strong">Playlists</Text>
            <Rows names={['Warm-up', 'Peak time', 'Closing']} />
          </div>
        </Popover>
      )}
    </div>
  );
}

/** A menu from a sidebar, over the picture: the raised layer's material popping over. */
export const OverSidebar: Story = {
  render: () => <OverSidebarHarness />,
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

/** A word in a paragraph with a preview: a button, `useHoverIntent`, and an `inline`, `portal`led Popover. */
function PeekWord({ word, summary }: { word: string; summary: string }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const { open, setOpen, trigger, panel } = useHoverIntent();
  const dismiss = useCallback(() => setOpen(false), [setOpen]);
  return (
    <>
      <Text
        as="button"
        type="button"
        size="inherit"
        tone="accent"
        ref={anchor}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline dotted' }}
        {...trigger}
      >
        {word}
      </Text>
      {open && (
        <Popover anchor={anchor} onDismiss={dismiss} role="dialog" label={word} inline portal hover={panel}>
          <span style={{ display: 'grid', gap: 'var(--space-1)', padding: 'var(--space-3)', maxWidth: 280 }}>
            <Text role="label" tone="muted">Concept</Text>
            <Text tone="secondary" size="caption">{summary}</Text>
          </span>
        </Popover>
      )}
    </>
  );
}

/**
 * Inside running text: rest the mouse on the word and the preview opens after a beat; leave both
 * the word and the panel and it closes after another. A click toggles it, for touch. The panel is
 * a `span` rendered into the theme scope, so the paragraph stays valid HTML.
 */
export const InText: Story = {
  name: 'In running text',
  render: () => (
    <div style={{ maxWidth: 520, padding: 'var(--space-6)' }}>
      <Text as="p" tone="primary">
        A string fixed at both ends vibrates at its{' '}
        <PeekWord word="fundamental" summary="The lowest frequency a vibrating body sounds; every harmonic is a whole multiple of it." /> and at
        every whole multiple of it at once.
      </Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const word = canvas.getByRole('button', { name: 'fundamental' });
    await userEvent.hover(word);
    const panel = await page.findByRole('dialog', { name: 'fundamental' });
    await expect(panel.tagName).toBe('SPAN');
    await expect(canvasElement.querySelector('p')?.contains(panel)).toBe(false);
    await userEvent.unhover(word);
    await waitFor(() => expect(page.queryByRole('dialog', { name: 'fundamental' })).not.toBeInTheDocument());
  },
};
