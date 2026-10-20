import type { ComponentType, CSSProperties, ElementType, ReactNode } from 'react';
import type { AmbientRegion, LayerName } from '../contract';
import { Tree } from '../view/Tree';
import { reactComponent } from '../view/reactComponents';
import { LAYER_AS, layerHandlers, layerView } from './Layer.model';
import '../primitives/Surface.css';

// Opaque and Hole are primitives now (primitives/Surface.tsx); re-exported so imports from here keep working.
export { Opaque, Hole } from '../primitives/Surface';
// The Surface it draws is framework-free, in the model; this file and `Layer.svelte` only hand its tree to their `Tree`.
export { layerSurface, layerView, type LayerModelProps, type LayerViewProps } from './Layer.model';

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
 * behind. It is a `Surface` with a `layer` and card corners (so the pack's shader material for
 * that layer draws on it); it keeps the `lib-layer` class so app CSS that names it still applies.
 * Event props (`onClick`) reach the element through the tree's handlers.
 *
 * @deprecated Use `<Surface layer=…>` (primitives/Surface.tsx).
 */
export function Layer({ as, children, ...props }: LayerProps) {
  // `as` a component (not a tag): the tree names it `LAYER_AS`, and this Tree draws it.
  const custom = as !== undefined && typeof as !== 'string' ? (as as ComponentType<any>) : undefined;
  const handlers = layerHandlers(props);
  return (
    <Tree
      tree={layerView({ ...props, as: typeof as === 'string' ? as : undefined }, custom !== undefined, handlers)}
      slots={{ children }}
      handlers={handlers}
      components={custom ? (name) => (name === LAYER_AS ? custom : reactComponent(name)) : undefined}
    />
  );
}
