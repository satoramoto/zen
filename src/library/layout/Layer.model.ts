// Layer's model: the Surface it is (its layer, card corners and the `lib-layer` class) as a tree,
// every other attribute passed through. No framework: `Layer.tsx` (React) and `Layer.svelte`
// (Svelte) each hand `layerView` to their `Tree`.
import type { AmbientRegion, LayerName } from '../contract';
import { surfaceView, type SurfaceModelProps } from '../primitives/Surface.model';
import { component, h, slot, type Node } from '../view/Tree.model';
import { cssText } from './Region.model';

/** What Layer decides from, in any framework. */
export interface LayerModelProps {
  /** Which layer of the depth stack this surface is. */
  level: LayerName;
  /** Classes added after the layer's own. */
  className?: string;
}

/** Everything `layerView` draws from: the model's props, the Surface's `ambient`, the element
 *  (`as`), and any other attribute (`role`, `id`, `aria-*`, `data-*`, `style`), passed through. */
export type LayerViewProps = LayerModelProps & { ambient?: AmbientRegion; as?: string; children?: unknown } & Record<string, unknown>;

/** The Surface props a Layer draws: `layer={level}`, card corners, `lib-layer` plus the caller's class. */
export function layerSurface({ level, className }: LayerModelProps): Required<Pick<SurfaceModelProps, 'layer' | 'radius' | 'className'>> {
  return { layer: level, radius: 'card', className: `lib-layer${className ? ` ${className}` : ''}` };
}

/** The name a React `as` component is drawn by (Tree's `components`): Svelte's `as` is a tag. */
export const LAYER_AS = 'Layer.as';

/** Pass-through props as tree attributes: text as is, numbers as text, a style object as a `style`
 *  string, `aria-*`/`data-*` booleans as `"true"`/`"false"`, other booleans present or absent;
 *  callbacks, `children` and empty values dropped. */
export function passAttrs(props: Record<string, unknown>): Record<string, string | undefined> {
  const attrs: Record<string, string | undefined> = {};
  for (const [name, value] of Object.entries(props)) {
    if (name === 'children' || value === undefined || value === null || typeof value === 'function') continue;
    if (name === 'style') attrs.style = typeof value === 'string' ? value : cssText(value as object);
    else if (typeof value === 'boolean') attrs[name] = name.startsWith('aria-') || name.startsWith('data-') ? String(value) : value ? '' : undefined;
    else if (typeof value === 'string' || typeof value === 'number') attrs[name] = String(value);
  }
  return attrs;
}

/**
 * The tree Layer draws: a Surface element (`as`, default `div`) with `layerSurface`'s class and
 * attributes and its `ambient`, the other attributes after them, and the `children` slot.
 * `custom`: React's `as` is a component, drawn as `LAYER_AS` with `className`.
 */
export function layerView({ level, className, ambient, as = 'div', ...rest }: LayerViewProps, custom = false): Node {
  const surface = layerSurface({ level, className });
  const view = surfaceView({ ...surface, ambient });
  const attrs = { ...view.attrs, ...passAttrs(rest) };
  // Both `Tree`s draw a component node at the root as they do anywhere (typed as their `Node`).
  if (custom) return component(LAYER_AS, { className: view.className, ...attrs }, { slots: { children: slot('children') } }) as unknown as Node;
  return h(as, { class: view.className, ...attrs }, slot('children'));
}
