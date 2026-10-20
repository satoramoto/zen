// Surface's model: the element a renderer draws (its class and `data-*` attributes) from its
// depth, material and marks. No framework: `Surface.tsx` (React) and `Surface.svelte` (Svelte)
// both render `surfaceView`. Whether a shader draws is the renderer's (it needs the scope, WebGL
// support and the Opaque context); the view only marks it with `data-shader`.
import type { AmbientRegion, LayerName } from '../contract';
import type { HueSlot } from '../components/core/hue';
import type { ElementView } from './Text.model';

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
  /** Which region of the picture's ambient light it takes (see `Surface.tsx`). */
  ambient?: AmbientRegion;
  /** Classes added after the Surface's own. */
  className?: string;
}

/** Surface's element: `lib-surface` plus the caller's class, and the attributes `Surface.css` reads. `shaded`: a shader canvas is drawn inside. */
export function surfaceView({ layer, material, radius, pressed, lit, border, ambient, className }: SurfaceModelProps, shaded = false): ElementView {
  const corners: SurfaceRadius = radius ?? (layer && !material ? 'card' : 'control');
  return {
    className: `lib-surface${className ? ` ${className}` : ''}`,
    attrs: {
      'data-layer': layer,
      'data-material': material,
      'data-radius': corners,
      'data-pressed': pressed ? '' : undefined,
      'data-lit': lit === undefined ? undefined : typeof lit === 'number' ? `hue-${lit}` : lit,
      'data-border': border === 'strong' ? 'strong' : border ? 'true' : undefined,
      'data-ambient': ambient,
      'data-shader': shaded ? '' : undefined,
    },
  };
}

/** Opaque's and Hole's elements. */
export const opaqueView = (className?: string): ElementView => ({ className: `lib-opaque${className ? ` ${className}` : ''}`, attrs: {} });
export const holeView = (className?: string, name?: string): ElementView => ({
  className: `lib-hole${className ? ` ${className}` : ''}`,
  attrs: { 'data-part': 'hole', 'aria-label': name, role: name ? 'img' : undefined },
});
