import type { AllHTMLAttributes, CSSProperties, ElementType, ReactNode, Ref } from 'react';
import type { AmbientRegion, LayerName } from '../contract';
import type { HueSlot } from '../components/core/hue';
import './Surface.css';

/** What a part is made of: the contract's four materials. */
export const MATERIAL_ROLES = ['well', 'screen', 'key', 'handle'] as const;
export type MaterialRole = (typeof MATERIAL_ROLES)[number];

/** A lamp colour: a hue slot, a role hue, the accent or a signal colour. */
export type LitSlot = HueSlot | 'role-1' | 'role-2' | 'accent' | 'success' | 'warning' | 'danger';
export const LIT_SLOTS = [1, 2, 3, 4, 'role-1', 'role-2', 'accent', 'success', 'warning', 'danger'] as const;

/** A corner radius from the materials facet, a circle (`50%`: a round knob, lamp or dot), or none. */
export type SurfaceRadius = 'control' | 'card' | 'input' | 'pill' | 'circle' | 'none';
export const SURFACE_RADII = ['control', 'card', 'input', 'pill', 'circle', 'none'] as const;

export interface SurfaceProps extends Omit<AllHTMLAttributes<HTMLElement>, 'as'> {
  /** Forwarded to the rendered element (`any`: the element is whatever `as` names). */
  ref?: Ref<any>;
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
  /** Which region of the picture's ambient light it takes, as much as its layer's `ambient`
   *  shares say (`--ambient-<region>`, from the nearest `Ambient`). Default: the region a
   *  surrounding surface took, else `avg`. Surfaces inside inherit it. */
  ambient?: AmbientRegion;
  /** The element to render; default `div`. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * **Job.** The one place that paints backgrounds, shadows, backdrops and borders from the
 * contract. A `layer` gives a depth (its fill, backdrop, edge and cast shadow); a `material` says
 * what the thing is made of (its fill, texture and shadow). With both, the material paints the
 * face and the layer composites it (backdrop, edge, cast). `pressed`, `lit` and `border` add to
 * one shadow list, so every combination composes instead of overwriting.
 *
 * It renders any element (`as`) with any native prop (`type`, `disabled`, `aria-*`, handlers)
 * and a `ref`, so `<Surface as="button" type="button" material="key">` can be a control's root.
 * Every rule has no specificity (`:where()`), so the component's own class refines it (a size, a
 * different radius, a shadow slot) without `!important`.
 *
 * A layer whose materials give it `ambient` shares (contract `LayerAmbient`) takes the picture's
 * light from the nearest `Ambient`: a tint over its fill (held to the layer's lightness band, so
 * text keeps its contrast), a specular edge on its lit side and a glow cast behind it, all scaled
 * by `--ambient-strength`. With no `Ambient` (strength 0) it looks exactly as it does without.
 * `ambient` picks the region (`left` for a panel at the picture's left).
 *
 * **Tuning knobs.** `--lib-surface-fill`, `--lib-surface-texture`, `--lib-surface-backdrop`, and
 * the shadow slots `--lib-surface-border`, `--lib-surface-mat-shadow`, `--lib-surface-glow`,
 * `--lib-surface-edge`, `--lib-surface-ambient-shadow`, `--lib-surface-cast` (each
 * `0 0 0 0 transparent` when unused); `--lib-surface-tint` (the ambient layer over the fill) and
 * the layer's ambient shares `--lib-surface-ambient-fill`, `-edge`, `-cast`; `--lit` is the lamp
 * colour `--mat-lit-glow` reads.
 */
export function Surface({
  layer,
  material,
  radius,
  pressed,
  lit,
  border,
  ambient,
  as: Tag = 'div',
  className,
  children,
  ...rest
}: SurfaceProps) {
  const corners: SurfaceRadius = radius ?? (layer && !material ? 'card' : 'control');
  return (
    <Tag
      className={`lib-surface${className ? ` ${className}` : ''}`}
      data-layer={layer}
      data-material={material}
      data-radius={corners}
      data-pressed={pressed ? '' : undefined}
      data-lit={lit === undefined ? undefined : typeof lit === 'number' ? `hue-${lit}` : lit}
      data-border={border === 'strong' ? 'strong' : border ? 'true' : undefined}
      data-ambient={ambient}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * **Job.** Where translucency can't composite: over a native view the web page can't blur (a
 * video, a GPU preview). Every layer inside draws its opaque `solid` fill and no backdrop, so a
 * panel over the picture never shows a smear. Wrap what sits over a `Hole` in this.
 */
export function Opaque({ children, className, style }: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`lib-opaque${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  );
}

/**
 * **Job.** A cut-out through every layer to what's behind the page (the native preview), so the
 * ground shows through. It paints nothing; panels over it go in an `Opaque` scope.
 */
export function Hole({ className, style, children, name }: { className?: string; style?: CSSProperties; children?: ReactNode; name?: string }) {
  return (
    <div className={`lib-hole${className ? ` ${className}` : ''}`} data-part="hole" aria-label={name} role={name ? 'img' : undefined} style={style}>
      {children}
    </div>
  );
}
