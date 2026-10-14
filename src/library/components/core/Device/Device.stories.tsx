import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Text } from '../../../primitives/Text';
import { Device, DeviceMore, DevicePortRow, type DeviceProps } from './Device';

/** A stand-in for the Graph's `Port`: a dot in the port cell's ink. */
function Dot({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{
        width: 'var(--space-3)',
        height: 'var(--space-3)',
        padding: 0,
        border: 0,
        borderRadius: 'var(--radius-pill)',
        background: 'currentColor',
      }}
    />
  );
}

/** A coloured placeholder for the stage's picture. */
const picture = <div style={{ aspectRatio: '16 / 9', background: 'var(--hue-2)', borderRadius: 'var(--radius-input)' }} />;

const code = (
  <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
    <Text role="code" tone="secondary">zoom = zoom + 0.01*sin(time);</Text>
    <Text role="code" tone="secondary">rot = rot + 0.02;</Text>
  </div>
);

/** A host sets the kind's ink and the width on the device, as visual[flow] does per stage. */
const host = { '--lib-device-accent': 'var(--hue-3)', '--lib-device-width': 'calc(var(--space-6) * 7)' } as CSSProperties;

const meta = {
  title: 'Design OS/Components/Core/Device',
  component: Device,
  decorators: [
    withLibraryTheme,
    (Story) => (
      <div style={{ ...host, padding: 'var(--space-6)' }}>
        <Story />
      </div>
    ),
  ],
  args: { name: 'Per-frame', onSelect: fn() },
} satisfies Meta<typeof Device>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A head and a body: the least a device is. */
export const Plain: Story = {
  args: { children: code, title: 'Per-frame equations' },
  play: async ({ canvasElement, args }) => {
    const head = canvasElement.querySelector<HTMLElement>('[data-part="head"]')!;
    await userEvent.click(head);
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
    const name = within(canvasElement).getByRole('button', { name: 'Per-frame' });
    name.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
  },
};

/** A stage of the pipeline: its picture, one row of wiring, and its code. */
export const WithScreen: Story = {
  args: {
    name: 'Warp',
    screen: picture,
    portRows: (
      <DevicePortRow inlet={<Dot label="Frame in" />} outlet={<Dot label="Warped out" />}>
        Frame
      </DevicePortRow>
    ),
    children: code,
  },
};

/** Ports that describe the whole device sit on rails beside the body. */
export const WithRails: Story = {
  args: {
    name: 'Composite',
    inlets: (
      <>
        <Dot label="Warp in" />
        <Dot label="Shapes in" />
      </>
    ),
    outlets: <Dot label="Out" />,
    children: (
      <button type="button" style={{ width: '100%', height: 'var(--control-h)' }}>
        Edit shader
      </button>
    ),
  },
};

export const Selected: Story = { args: { ...WithScreen.args, selected: true } };

/** A stage that doesn't compile: its edge is in the danger ink. */
export const Problem: Story = { args: { ...WithScreen.args, problem: true } };

/** A host action on the head: clicking it does not select. */
export const WithHeaderEnd: Story = {
  args: {
    ...WithScreen.args,
    headerEnd: (
      <button type="button" aria-label="Remove stage" style={{ padding: '0 var(--space-1)', border: 0, background: 'none', color: 'inherit' }}>
        ×
      </button>
    ),
  },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Remove stage' }));
    await expect(args.onSelect).not.toHaveBeenCalled();
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-part="head"]')!);
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
  },
};

/** A face showing only the rows that matter, with its outlets beside the picture. */
function Folded(props: DeviceProps) {
  const [open, setOpen] = useState(false);
  const rows = ['Zoom', 'Rotate', 'Warp'];
  const shown = open ? rows : rows.slice(0, 1);
  return (
    <Device
      {...props}
      portRows={
        <>
          {shown.map((row) => (
            <DevicePortRow key={row} inlet={<Dot label={`${row} in`} />}>
              {row}
            </DevicePortRow>
          ))}
          <DeviceMore open={open} onToggle={setOpen} label={open ? 'Show fewer rows' : 'Show 2 more rows'}>
            {open ? 'Fewer' : '2 at default'}
          </DeviceMore>
        </>
      }
    />
  );
}

/**
 * `outletsAt="screen"`: the outlets stand beside the picture they are, and the rows under it hold
 * only inlets. `DeviceMore` is the line standing for the rows not shown; clicking it opens them.
 */
export const OutletsBesideScreen: Story = {
  args: {
    name: 'Warp',
    screen: picture,
    outletsAt: 'screen',
    outlets: (
      <>
        <Dot label="Warped out" />
        <Dot label="Depth out" />
      </>
    ),
  },
  render: (args) => <Folded {...args} />,
  play: async ({ canvasElement }) => {
    const band = canvasElement.querySelector('[data-part="screen-band"]')!;
    await expect(within(band as HTMLElement).getByRole('button', { name: 'Warped out' })).toBeTruthy();
    const more = within(canvasElement).getByRole('button', { name: 'Show 2 more rows' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more);
    await expect(within(canvasElement).getByRole('button', { name: 'Show fewer rows' })).toHaveAttribute('aria-expanded', 'true');
    await expect(canvasElement.querySelectorAll('[data-part="row"]')).toHaveLength(3);
  },
};
