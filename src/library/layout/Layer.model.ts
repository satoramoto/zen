// Layer's model: the Surface it is (its layer, card corners and the `lib-layer` class). No
// framework: `Layer.tsx` (React) and `Layer.svelte` (Svelte) both render a Surface from it.
import type { LayerName } from '../contract';
import type { SurfaceModelProps } from '../primitives/Surface.model';

/** What Layer decides from, in any framework. */
export interface LayerModelProps {
  /** Which layer of the depth stack this surface is. */
  level: LayerName;
  /** Classes added after the layer's own. */
  className?: string;
}

/** The Surface props a Layer draws: `layer={level}`, card corners, `lib-layer` plus the caller's class. */
export function layerSurface({ level, className }: LayerModelProps): Required<Pick<SurfaceModelProps, 'layer' | 'radius' | 'className'>> {
  return { layer: level, radius: 'card', className: `lib-layer${className ? ` ${className}` : ''}` };
}
