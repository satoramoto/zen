import { createContext, useContext, useState, type AllHTMLAttributes, type CSSProperties, type ElementType, type ReactNode, type Ref } from 'react';
import type { AmbientRegion, LayerName } from '../contract';
import { ShaderCanvas, compiledMaterial, useShaderSupport, type ShaderMaterialName, type ShaderSource } from '../shader';
import { useThemeScope } from '../theme';
import { surfaceView, type LitSlot, type MaterialRole, type SurfaceRadius } from './Surface.model';
import './Surface.css';

// The materials, lamps and corners are framework-free, in the model; `Surface.svelte` renders the same view.
export {
  MATERIAL_ROLES,
  LIT_SLOTS,
  SURFACE_RADII,
  surfaceView,
  type MaterialRole,
  type LitSlot,
  type SurfaceRadius,
  type SurfaceModelProps,
} from './Surface.model';

export interface SurfaceProps extends Omit<AllHTMLAttributes<HTMLElement>, 'as' | 'style'> {
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
  /** A shader material drawn over its CSS fill and backdrop, under its content: a named material,
   *  a compiled `ShaderSource`, or `false` for none. Default: the scope's pack's
   *  `materials.shaders[layer]`. Drawn only where `useShaderSupport()` allows and outside `Opaque`;
   *  otherwise (or if it fails) the layer's CSS material is all there is. */
  shader?: ShaderMaterialName | ShaderSource | false;
  /** The element to render; default `div`. */
  as?: ElementType;
  className?: string;
  /** Inline style: an object, or a `style` string (as a view tree's `component('Surface', …)` passes it). */
  style?: CSSProperties | string;
  children?: ReactNode;
}

/** A `style` string as React's style object (`min-width` → `minWidth`; custom properties as is). */
function styleObject(text: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const declaration of text.split(';')) {
    const colon = declaration.indexOf(':');
    const name = declaration.slice(0, colon).trim();
    if (colon < 0 || !name) continue;
    style[name.startsWith('--') ? name : name.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = declaration.slice(colon + 1).trim();
  }
  return style as CSSProperties;
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
 * **Shader.** A surface can wear a shader material (`shader`, else the pack's
 * `materials.shaders[layer]`; `false` turns it off): it sets `data-shader` and draws a
 * `ShaderCanvas` (`lib-surface__shader`) as its first child, absolutely over the whole box with
 * its corners, under the content (the surface becomes a stacking context). It takes no layout
 * slot, so flex and grid children and their gaps are unchanged. **Fallback**: without WebGL2,
 * under reduced motion or transparency, inside `Opaque`, or when the shader fails to compile, no
 * canvas is drawn and the layer's CSS material (fill, texture, backdrop) is the whole look, so it
 * must already look finished on its own.
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
  shader,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const scope = useThemeScope();
  const supported = useShaderSupport();
  const opaque = useContext(OpaqueContext);
  // The canvas reported a failure: drop it for the source that failed, so the CSS layer remains.
  const [failed, setFailed] = useState<ShaderMaterialName | ShaderSource | null>(null);
  const chosen = shader === false ? undefined : (shader ?? (layer ? scope?.facets.materials.shaders?.[layer] : undefined));
  const source = chosen && supported && !opaque && chosen !== failed ? (typeof chosen === 'string' ? compiledMaterial(chosen) : chosen) : null;
  const view = surfaceView({ layer, material, radius, pressed, lit, border, ambient, className }, source !== null);
  return (
    <Tag className={view.className} {...view.attrs} {...rest} style={typeof style === 'string' ? styleObject(style) : style}>
      {source && chosen && (
        <ShaderCanvas
          className="lib-surface__shader"
          frag={source.frag}
          params={source.params}
          scale={source.scale}
          animate={source.animate}
          interactive={source.interactive}
          onError={() => setFailed(chosen)}
        />
      )}
      {children}
    </Tag>
  );
}

/** True inside an `Opaque` scope: no surface there draws a shader (nothing translucent over a native view). */
const OpaqueContext = createContext(false);

/**
 * **Job.** Where translucency can't composite: over a native view the web page can't blur (a
 * video, a GPU preview). Every layer inside draws its opaque `solid` fill and no backdrop, so a
 * panel over the picture never shows a smear. Wrap what sits over a `Hole` in this.
 * Surfaces inside draw no shader material either (a React context, so it holds across portals
 * rendered from inside).
 * Every theme scope is Opaque already under `prefers-reduced-transparency: reduce`,
 * `prefers-contrast: more` or `<html data-transparency="reduced">` (library.css).
 */
export function Opaque({ children, className, style }: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <OpaqueContext.Provider value={true}>
      <div className={`lib-opaque${className ? ` ${className}` : ''}`} style={style}>
        {children}
      </div>
    </OpaqueContext.Provider>
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
