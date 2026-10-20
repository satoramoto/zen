import type { CSSProperties, ElementType, ReactNode } from 'react';
import type { AmbientRegion, LayerName } from '../contract';
import { Surface, type SurfaceProps } from '../primitives/Surface';
import { layerSurface } from './Layer.model';

// Opaque and Hole are primitives now (primitives/Surface.tsx); re-exported so imports from here keep working.
export { Opaque, Hole } from '../primitives/Surface';

export interface LayerProps {
  /** Which layer of the depth stack this surface is. */
  level: LayerName;
  /** Which region's ambient light it takes (`Surface`'s `ambient`). */
  ambient?: AmbientRegion;
  /** The element to render; default `div`. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [attr: `data-${string}` | `aria-${string}`]: unknown;
  role?: string;
  id?: string;
}

/**
 * **Job.** A surface at one depth: a region's plate (`base`), a popover (`float`), a sheet
 * (`overlay`). The theme's `layers` decide how it is drawn and how it composites over what's
 * behind. It is a `Surface` with a `layer` and card corners; it keeps the `lib-layer` class so
 * app CSS that names it still applies.
 *
 * @deprecated Use `<Surface layer=…>` (primitives/Surface.tsx).
 */
export function Layer({ level, className, ...rest }: LayerProps) {
  return <Surface {...layerSurface({ level, className })} {...(rest as Omit<SurfaceProps, 'layer' | 'className'>)} />;
}
