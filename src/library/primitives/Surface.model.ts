// Surface's model: the materials, lamps and corners, and the view a renderer draws (its class and
// `data-*` attributes). No framework: `Surface.tsx` (React) and `Surface.svelte` (Svelte) both
// render `surfaceView`. The shader canvas is React's alone for now (Surface.tsx).
import type { AmbientRegion, LayerName } from '../contract';
import type { HueSlot } from '../components/core/hue';
import { h, type Node } from '../view/Tree.model';
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
