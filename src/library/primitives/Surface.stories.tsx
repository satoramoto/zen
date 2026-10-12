import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LAYERS, type LayerName } from '../contract';
import { withLibraryTheme } from '../storybook';
import { LIT_SLOTS, MATERIAL_ROLES, Surface, SURFACE_RADII, type LitSlot, type MaterialRole, type SurfaceRadius } from './Surface';
import { Text } from './Text';

const specimen: CSSProperties = {
  width: 'calc(var(--control-h) * 3)',
  height: 'calc(var(--control-h) * 2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

interface SurfaceArgs {
  layer: LayerName | 'none';
  material: MaterialRole | 'none';
  radius: SurfaceRadius | 'default';
  pressed: boolean;
  lit: LitSlot | 'none';
  border: 'none' | 'hairline' | 'strong';
}

const meta: Meta<SurfaceArgs> = {
  title: 'Design OS/Primitives/Surface',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { layer: 'raised', material: 'key', radius: 'default', pressed: false, lit: 'none', border: 'none' },
  argTypes: {
    layer: { control: 'select', options: ['none', ...LAYERS] },
    material: { control: 'select', options: ['none', ...MATERIAL_ROLES] },
    radius: { control: 'select', options: ['default', ...SURFACE_RADII] },
    pressed: { control: 'boolean' },
    lit: { control: 'select', options: ['none', ...LIT_SLOTS] },
    border: { control: 'inline-radio', options: ['none', 'hairline', 'strong'] },
  },
  render: ({ layer, material, radius, pressed, lit, border }) => (
    <div style={{ padding: 'var(--space-6)' }}>
      <Surface
        layer={layer === 'none' ? undefined : layer}
        material={material === 'none' ? undefined : material}
        radius={radius === 'default' ? undefined : radius}
        pressed={pressed}
        lit={lit === 'none' ? undefined : lit}
        border={border === 'strong' ? 'strong' : border === 'hairline'}
        style={specimen}
      >
        <Text role="label" tone="secondary">
          {[layer, material].filter((x) => x !== 'none').join(' · ') || 'plain'}
        </Text>
      </Surface>
    </div>
  ),
};
export default meta;
type Story = StoryObj<SurfaceArgs>;

/** One specimen: every control changes it. */
export const Playground: Story = {};

/** Every layer (rows) wearing every material (columns), with the no-layer row and no-material column. */
export const LayersByMaterials: Story = {
  name: 'Layers × materials',
  render: () => {
    const layers = [undefined, ...LAYERS];
    const materials = [undefined, ...MATERIAL_ROLES];
    return (
      <div style={{ padding: 'var(--space-4)', overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `auto repeat(${materials.length}, auto)`,
            gap: 'var(--space-4)',
            alignItems: 'center',
          }}
        >
          <span />
          {materials.map((m) => (
            <Text key={m ?? 'none'} role="caption" tone="muted">
              {m ?? 'no material'}
            </Text>
          ))}
          {layers.map((l) => (
            <div key={l ?? 'none'} style={{ display: 'contents' }}>
              <Text role="caption" tone="muted">
                {l ?? 'no layer'}
              </Text>
              {materials.map((m) => (
                <Surface key={m ?? 'none'} layer={l} material={m} style={specimen}>
                  <Text role="caption" tone="secondary">
                    {[l, m].filter(Boolean).join(' · ') || 'plain'}
                  </Text>
                </Surface>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  },
};

/** Keys at rest, pressed, lit in each slot, and bordered. */
export const States: Story = {
  render: () => (
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
      <Surface material="key" style={specimen}><Text role="label">rest</Text></Surface>
      <Surface material="key" pressed style={specimen}><Text role="label">pressed</Text></Surface>
      {LIT_SLOTS.map((lit) => (
        <Surface key={lit} material="key" lit={lit} style={specimen}>
          <Text role="label">lit {String(lit)}</Text>
        </Surface>
      ))}
      <Surface layer="raised" border style={specimen}><Text role="label">border</Text></Surface>
      <Surface layer="raised" border="strong" style={specimen}><Text role="label">strong</Text></Surface>
    </div>
  ),
};
