// Surface's model: the materials, lamps and corners, and the view a renderer draws (its class and
// `data-*` attributes). No framework: `Surface.tsx` (React) and `Surface.svelte` (Svelte) both
// hand `surfaceTree` to their `Tree`. The shader canvas is React's alone for now (Surface.tsx).
import type { AmbientRegion, LayerName } from '../contract';
import type { HueSlot } from '../components/core/hue';
import { compiledMaterial } from '../shader/materials';
import type { ShaderMaterialName, ShaderSource } from '../shader/types';
import { component, h, slot, when, type Node } from '../view/Tree.model';
import type { ElementView, TreeChildren } from './Text.model';

/** What a part is made of: the contract's four materials. */
export const MATERIAL_ROLES = ['well', 'screen', 'key', 'handle'] as const;
export type MaterialRole = (typeof MATERIAL_ROLES)[number];

/** A lamp colour: a hue slot, a role hue, the accent or a signal colour. */
export type LitSlot = HueSlot | 'role-1' | 'role-2' | 'accent' | 'success' | 'warning' | 'danger';
export const LIT_SLOTS = [1, 2, 3, 4, 5, 'role-1', 'role-2', 'accent', 'success', 'warning', 'danger'] as const;

/** A corner radius from the materials facet, a circle (`50%`: a round knob, lamp or dot), or none. */
export type SurfaceRadius = 'control' | 'card' | 'input' | 'pill' | 'circle' | 'none';
export const SURFACE_RADII = ['control', 'card', 'input', 'pill', 'circle', 'none'] as const;

/** What Surface decides from, in any framework (each renderer adds its element, children, native props and shader). */
export interface SurfaceModelProps {
  /** The depth it sits at: backdrop, edge and cast shadow (and the fill, without a material). */
  layer?: LayerName;
  /** What it is made of: fill, texture and shadow. */
  material?: MaterialRole;
  /** Corners. Default: `card` for a layer without a material, otherwise `control`. */
  radius?: SurfaceRadius;
  /** Held or on: the material shadow becomes `--mat-key-pressed`. */
  pressed?: boolean;
  /** Lit in this colour: sets `--lit` and adds `--mat-lit-glow`. */
  lit?: LitSlot;
  /** An inset hairline: `--border`, or `--border-strong` with `'strong'`. */
  border?: boolean | 'strong';
  /** Which region of the picture's ambient light it takes (`--ambient-<region>`, from the nearest
   *  `Ambient`). Default: the region a surrounding surface took, else `avg`. */
  ambient?: AmbientRegion;
  /** Classes added after the Surface's own. */
  className?: string;
}

/** Surface's element: `lib-surface` plus the caller's class, and the attributes `Surface.css` reads.
 *  `shaded`: a shader canvas is drawn inside (`data-shader`). */
export function surfaceView({ layer, material, radius, pressed, lit, border, ambient, className }: SurfaceModelProps, shaded = false): ElementView {
  return {
    className: `lib-surface${className ? ` ${className}` : ''}`,
    attrs: {
      'data-layer': layer,
      'data-material': material,
      'data-radius': radius ?? (layer && !material ? 'card' : 'control'),
      'data-pressed': pressed ? '' : undefined,
      'data-lit': lit === undefined ? undefined : typeof lit === 'number' ? `hue-${lit}` : lit,
      'data-border': border === 'strong' ? 'strong' : border ? 'true' : undefined,
      'data-ambient': ambient,
      'data-shader': shaded ? '' : undefined,
    },
  };
}

/**
 * Surface as a view-tree element, for a model to inline: `surfaceNode({ material: 'key', as:
 * 'button' }, { type: 'button' }, 'Play')` is the element `<Surface as="button" material="key">`
 * draws, its attributes (`attrs`, after Surface's own) and children added. No shader: the CSS layer
 * alone, as `Surface.svelte` draws it (and React's `Surface` without WebGL2).
 */
export function surfaceNode(props: SurfaceModelProps & { as?: string }, attrs: Record<string, string | undefined> = {}, ...children: TreeChildren): Node {
  const view = surfaceView(props);
  return h(props.as ?? 'div', { class: view.className, ...view.attrs, ...attrs }, ...children);
}

/** A shader a surface can wear: a named material or a compiled source. */
export type SurfaceShaderChoice = ShaderMaterialName | ShaderSource;

/** What a surface's shader canvas draws, as plain data (`ShaderCanvas`'s props). */
export interface SurfaceShader {
  frag: string | null;
  params: number[];
  scale?: number;
  animate?: boolean;
  interactive?: boolean;
}

/**
 * The shader a surface wears: `shader` (`false` for none), else the pack's for its layer
 * (`packShaders`). `chosen` is that choice; `source` is what the canvas draws, or null where it
 * can't (no `supported` WebGL2, inside an `Opaque`, or the chosen one `failed`).
 */
export function surfaceShader(
  shader: SurfaceShaderChoice | false | undefined,
  layer: LayerName | undefined,
  { packShaders, supported, opaque, failed }: { packShaders?: Partial<Record<LayerName, ShaderMaterialName>>; supported: boolean; opaque: boolean; failed: SurfaceShaderChoice | null },
): { chosen: SurfaceShaderChoice | undefined; source: SurfaceShader | null } {
  const chosen = shader === false ? undefined : (shader ?? (layer ? packShaders?.[layer] : undefined));
  if (!chosen || !supported || opaque || chosen === failed) return { chosen, source: null };
  const { frag, params, scale, animate, interactive } = typeof chosen === 'string' ? compiledMaterial(chosen) : chosen;
  return { chosen, source: { frag, params: Array.from(params), scale, animate, interactive } };
}

/**
 * The tree a `Surface` draws: its element (`as`, default `div`) with Surface's class and attributes,
 * the shader canvas first when there is a `shader` source (the registered `ShaderCanvas`, absolutely
 * over the box; its `onError` the `shaderError` handler), then the `children` slot. Without a
 * shader, a hole where the canvas goes, so the children keep their place when it comes and goes.
 */
export function surfaceTree(props: SurfaceModelProps & { as?: string }, shader: SurfaceShader | null = null): Node {
  const view = surfaceView(props, shader !== null);
  return h(
    props.as ?? 'div',
    { class: view.className, ...view.attrs },
    when(shader !== null, () => component('ShaderCanvas', { className: 'lib-surface__shader', ...shader }, { on: { onError: 'shaderError' } })),
    slot('children'),
  );
}
