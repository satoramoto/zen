import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import type { Param } from '../../../components/core/Param/param';
import { Device } from '../Device/Device';
import { Slider } from '../../../components/core/Slider/Slider';
import { NumberField } from '../../../components/core/NumberField/NumberField';
import { NodeSheet, NodeSheetRow, NodeSheetSection, type NodeSheetPlace } from './NodeSheet';

const depth: Param = { kind: 'float', min: 0, max: 1, defaultValue: 0.5, name: 'Depth' };
const rate: Param = { kind: 'float', min: 0.1, max: 20, defaultValue: 2, unit: 'hertz', name: 'Rate' };
const spin: Param = { kind: 'float', min: -1, max: 1, defaultValue: 0, name: 'Spin' };

/** A row's control: a horizontal slider filling its column, no caption or reading of its own. */
function Row({ param, driver }: { param: Param; driver?: string }) {
  const [value, setValue] = useState(param.defaultValue);
  return (
    <NodeSheetRow
      name={param.name ?? ''}
      driver={driver}
      end={<NumberField param={param} value={value} onChange={setValue} name="" label={param.name} />}
    >
      <Slider param={param} value={value} onChange={setValue} name="" label={param.name} orientation="horizontal" length="auto" showValue={false} />
    </NodeSheetRow>
  );
}

/** A node on a canvas, its sheet hung beside it; the host holds the parked place. */
function Canvas({ onPark, onDismiss }: { onPark(at: NodeSheetPlace | null): void; onDismiss(how: 'escape'): void }) {
  const node = useRef<HTMLDivElement>(null);
  const [parked, setParked] = useState<NodeSheetPlace | null>(null);
  const [up, setUp] = useState(true);
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div ref={node} style={{ display: 'inline-block', width: 'calc(var(--control-h) * 7)' }}>
        <Device name="Warp" selected={up} onSelect={() => setUp(true)}>
          <Slider param={depth} value={0.5} onChange={() => {}} layout="inside" orientation="horizontal" length="auto" driver="sine" />
        </Device>
      </div>
      {up && (
        <NodeSheet
          name="Warp"
          about="radial"
          anchor={node}
          parked={parked}
          onPark={(at) => {
            onPark(at);
            setParked(at);
          }}
          onDismiss={(how) => {
            onDismiss(how);
            setUp(false);
          }}
        >
          <NodeSheetSection heading="Motion">
            <Row param={depth} driver="sine" />
            <Row param={rate} />
          </NodeSheetSection>
          <NodeSheetSection heading="Picture">
            <Row param={spin} />
          </NodeSheetSection>
        </NodeSheet>
      )}
    </div>
  );
}

const meta = {
  title: 'Design OS/Graph/NodeSheet',
  component: Canvas,
  decorators: [withLibraryTheme],
  args: { onPark: fn(), onDismiss: fn() },
} satisfies Meta<typeof Canvas>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The sheet stands beside the node (right, else left, else under) and follows it. Drag its head
 * to park it; the crosshair in the head hangs it back. Escape asks the host to take it down.
 */
export const BesideANode: Story = {
  play: async ({ canvasElement, args }) => {
    const sheet = await within(canvasElement.ownerDocument.body).findByRole('region', { name: 'Warp' });
    await expect(within(sheet).getAllByText('← sine').length).toBeGreaterThan(0);
    await userEvent.keyboard('{Escape}');
    await expect(args.onDismiss).toHaveBeenCalledWith('escape');
  },
};
