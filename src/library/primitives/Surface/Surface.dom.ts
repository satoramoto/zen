// Surface as the DOM renderer draws it: the same tree as `Surface.tsx` and `Surface.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import type { ShaderMaterialName, ShaderSource } from '../../shader/types';
import { shaderSupported } from '../../shader/supported';
import { surfaceTree, type SurfaceModelProps } from './Surface.model';
import { SHADER_ERROR, chosenShader, surfaceShader, type SurfaceShader } from '../surfaceShader';

type Props = Omit<SurfaceModelProps, 'className'> & { shader?: SurfaceShader; as?: string; class?: string; className?: string; children?: DomFill } & Record<string, unknown>;

export const SurfaceDom = domPart<Props>({}, ({ layer, material, radius, pressed, lit, border, ambient, shader, as, class: cls, className, children, ...rest }, use) => {
  const failed = use.state<ShaderMaterialName | ShaderSource | null>(null);
  const opaque = use.context<boolean>('opaque');
  const shaders = use.scope()?.facets.materials.shaders as Parameters<typeof surfaceShader>[0]['shaders'];
  const source = surfaceShader({ shader, layer, shaders, supported: shaderSupported(), opaque, failed: failed.get() });
  return {
    tree: surfaceTree({ layer, material, radius, pressed, lit, border, ambient, className: cls ?? className, as }, source),
    slots: { children },
    handlers: { [SHADER_ERROR]: () => failed.set(chosenShader({ shader, layer, shaders })) },
    root: rest,
  };
});
