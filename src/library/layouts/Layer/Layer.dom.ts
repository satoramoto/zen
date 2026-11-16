// Layer as the DOM renderer draws it: the same tree as `Layer.tsx` and `Layer.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { layerHandlers, layerView, type LayerModelProps } from './Layer.model';
import '../../primitives/Surface/Surface.css';

type Props = Omit<LayerModelProps, 'className'> & { class?: string; className?: string; children?: DomFill } & Record<string, unknown>;

export const LayerDom = domPart<Props>({}, ({ level, class: cls, className, children, ...rest }) => {
  const handlers = layerHandlers(rest);
  return { tree: layerView({ ...rest, level, className: cls ?? className }, false, handlers), slots: { children }, handlers };
});
