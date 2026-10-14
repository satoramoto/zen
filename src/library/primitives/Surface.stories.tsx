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

/** Something with texture behind the panes, so their blur and tint read: the palette's hues as
 *  bands and dots. */
const busy: CSSProperties = {
  padding: 'var(--space-6)',
  background: [
    'radial-gradient(circle at 20% 30%, var(--hue-1) 0 12%, transparent 13%)',
    'radial-gradient(circle at 70% 60%, var(--hue-3) 0 16%, transparent 17%)',
    'repeating-linear-gradient(115deg, var(--hue-2) 0 var(--space-3), transparent var(--space-3) calc(var(--space-3) * 3))',
    'linear-gradient(var(--hue-4), var(--surface-0))',
  ].join(', '),
};

/** A float and an overlay pane wearing each shader material, and `false` (the CSS layer alone),
 *  over a busy ground. Where the shader can't draw (no WebGL2, reduced motion or transparency) or
 *  a material is still empty, every pane shows its layer's CSS look: that must already be finished. */
export const Shader: Story = {
  render: () => (
    <div style={busy}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(calc(var(--control-h) * 4), 1fr))', gap: 'var(--space-4)' }}>
        {(['float', 'overlay'] as const).map((layer) =>
          (['water', 'ether', 'glass', false] as const).map((shader) => (
            <Surface key={`${layer}-${String(shader)}`} layer={layer} shader={shader} style={{ ...specimen, width: 'auto', flexDirection: 'column' }}>
              <Text role="label">{shader === false ? 'no shader' : shader}</Text>
              <Text role="caption" tone="muted">{layer}</Text>
            </Surface>
          )),
        )}
      </div>
    </div>
  ),
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
