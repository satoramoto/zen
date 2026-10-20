import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { Surface } from './Surface';
import { Text } from './Text';
import { GRID_LAYERS, GRID_MATERIALS, surfaceArgTypes, surfaceArgs, surfaceCaption, surfaceProps, surfaceStories as s, type SurfaceArgs } from './Surface.fixtures';

// The args, controls and each story's surfaces come from Surface.fixtures.ts, which the Svelte
// stories and the parity test share.
const specimen: CSSProperties = {
  width: 'calc(var(--control-h) * 3)',
  height: 'calc(var(--control-h) * 2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const meta: Meta<SurfaceArgs> = {
  title: 'Design OS/Primitives/Surface',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: surfaceArgs,
  argTypes: surfaceArgTypes,
  render: (args) => (
    <div style={{ padding: 'var(--space-6)' }}>
      <Surface {...surfaceProps(args)} style={specimen}>
        <Text role="label" tone="secondary">
          {surfaceCaption(args.layer, args.material)}
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
    const items = s.LayersByMaterials.items ?? [];
    return (
      <div style={{ padding: 'var(--space-4)', overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `auto repeat(${GRID_MATERIALS.length}, auto)`,
            gap: 'var(--space-4)',
            alignItems: 'center',
          }}
        >
          <span />
          {GRID_MATERIALS.map((m) => (
            <Text key={m ?? 'none'} role="caption" tone="muted">
              {m ?? 'no material'}
            </Text>
          ))}
          {GRID_LAYERS.map((l, row) => (
            <div key={l ?? 'none'} style={{ display: 'contents' }}>
              <Text role="caption" tone="muted">
                {l ?? 'no layer'}
              </Text>
              {items.slice(row * GRID_MATERIALS.length, (row + 1) * GRID_MATERIALS.length).map(({ children, ...props }) => (
                <Surface key={props.material ?? 'none'} {...props} style={specimen}>
                  <Text role="caption" tone="secondary">
                    {children}
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
        {(s.Shader.items ?? []).map(({ children, ...props }) => (
          <Surface key={`${props.layer}-${String(props.shader)}`} {...props} style={{ ...specimen, width: 'auto', flexDirection: 'column' }}>
            <Text role="label">{children}</Text>
            <Text role="caption" tone="muted">{props.layer}</Text>
          </Surface>
        ))}
      </div>
    </div>
  ),
};

/** Keys at rest, pressed, lit in each slot, and bordered. */
export const States: Story = {
  render: () => (
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
      {(s.States.items ?? []).map(({ children, ...props }) => (
        <Surface key={children} {...props} style={specimen}>
          <Text role="label">{children}</Text>
        </Surface>
      ))}
    </div>
  ),
};
