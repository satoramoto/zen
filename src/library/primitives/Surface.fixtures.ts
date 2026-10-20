// Surface's stories as plain data: Surface.stories.tsx draws them as view trees (in React or
// Svelte), and the parity test renders every story's Surface in both (each one's caption standing
// in as its text; the stories draw it as a `Text`).
import { LAYERS, type LayerName } from '../contract';
import { defineFixtures } from '../fixtures';
import { LIT_SLOTS, MATERIAL_ROLES, SURFACE_RADII, type LitSlot, type MaterialRole, type SurfaceModelProps, type SurfaceRadius } from './Surface.model';

/** The Playground's controls (`none` and `default` for no prop). */
export interface SurfaceArgs {
  layer: LayerName | 'none';
  material: MaterialRole | 'none';
  radius: SurfaceRadius | 'default';
  pressed: boolean;
  lit: LitSlot | 'none';
  border: 'none' | 'hairline' | 'strong';
}

export const surfaceArgs: SurfaceArgs = { layer: 'raised', material: 'key', radius: 'default', pressed: false, lit: 'none', border: 'none' };

export const surfaceArgTypes = {
  layer: { control: 'select', options: ['none', ...LAYERS] },
  material: { control: 'select', options: ['none', ...MATERIAL_ROLES] },
  radius: { control: 'select', options: ['default', ...SURFACE_RADII] },
  pressed: { control: 'boolean' },
  lit: { control: 'select', options: ['none', ...LIT_SLOTS] },
  border: { control: 'inline-radio', options: ['none', 'hairline', 'strong'] },
} as const;

/** The Surface props for the Playground's args. */
export const surfaceProps = ({ layer, material, radius, pressed, lit, border }: SurfaceArgs): SurfaceModelProps => ({
  layer: layer === 'none' ? undefined : layer,
  material: material === 'none' ? undefined : material,
  radius: radius === 'default' ? undefined : radius,
  pressed,
  lit: lit === 'none' ? undefined : lit,
  border: border === 'strong' ? 'strong' : border === 'hairline',
});

/** The Playground specimen's caption: its layer and material, or `plain`. */
export const surfaceCaption = (layer?: string, material?: string) => [layer, material].filter((x) => x && x !== 'none').join(' · ') || 'plain';

/** The grid's rows (every layer and none) and columns (every material and none). */
export const GRID_LAYERS = [undefined, ...LAYERS];
export const GRID_MATERIALS = [undefined, ...MATERIAL_ROLES];

/** The Shader story's layers and shaders (`false`: the CSS layer alone). */
export const SHADER_LAYERS = ['float', 'overlay'] as const;
export const SHADERS = ['water', 'ether', 'glass', false] as const;

type Instance = SurfaceModelProps & { shader?: (typeof SHADERS)[number] };

export const surfaceStories = defineFixtures<Instance>()({
  Playground: { args: { ...surfaceProps(surfaceArgs), children: surfaceCaption(surfaceArgs.layer, surfaceArgs.material) } },
  LayersByMaterials: {
    items: GRID_LAYERS.flatMap((layer) => GRID_MATERIALS.map((material) => ({ layer, material, children: surfaceCaption(layer, material) }))),
  },
  Shader: {
    items: SHADER_LAYERS.flatMap((layer) => SHADERS.map((shader) => ({ layer, shader, children: shader === false ? 'no shader' : shader }))),
  },
  States: {
    items: [
      { material: 'key', children: 'rest' },
      { material: 'key', pressed: true, children: 'pressed' },
      ...LIT_SLOTS.map((lit) => ({ material: 'key' as const, lit, children: `lit ${String(lit)}` })),
      { layer: 'raised', border: true, children: 'border' },
      { layer: 'raised', border: 'strong', children: 'strong' },
    ],
  },
});
