// Surface's shader material, framework-free: which source it draws (or none) and the canvas as a
// view-tree node. `Surface.tsx` and `Surface.svelte` both call these and draw the node with `Tree`.
import type { LayerName, Materials } from '../contract';
import { compiledMaterial } from '../shader/materials';
import type { ShaderMaterialName, ShaderSource } from '../shader/types';
import { h, wire, type Node } from '../view/Tree.model';

/** What a surface's `shader` prop takes: a named material, a compiled source, or `false` for none. */
export type SurfaceShader = ShaderMaterialName | ShaderSource | false;

/** The handler key the canvas's `onError` calls: the binding records the chosen source as failed. */
export const SHADER_ERROR = 'shaderError';

export interface SurfaceShaderInput {
  /** The surface's `shader` prop. */
  shader?: SurfaceShader;
  layer?: LayerName;
  /** The scope's pack's `materials.shaders` (by layer). */
  shaders?: Materials['shaders'];
  /** `shaderSupported()`: WebGL2, no reduced motion or transparency. */
  supported: boolean;
  /** Inside an `Opaque` scope. */
  opaque: boolean;
  /** The choice whose canvas reported a failure, if any. */
  failed: ShaderMaterialName | ShaderSource | null;
}

/** What the surface asks for: `shader`, else the pack's `materials.shaders[layer]`; `false` is none. */
export function chosenShader({ shader, layer, shaders }: Pick<SurfaceShaderInput, 'shader' | 'layer' | 'shaders'>): ShaderMaterialName | ShaderSource | null {
  if (shader === false) return null;
  return shader ?? (layer ? shaders?.[layer] : undefined) ?? null;
}

/**
 * The source a surface draws, or null: the chosen shader (`chosenShader`), a name compiled once per
 * page, unless shaders aren't supported here, it is inside `Opaque`, or that choice failed.
 */
export function surfaceShader(input: SurfaceShaderInput): ShaderSource | null {
  const chosen = chosenShader(input);
  if (!chosen || !input.supported || input.opaque || chosen === input.failed) return null;
  return typeof chosen === 'string' ? compiledMaterial(chosen) : chosen;
}

/**
 * The shader canvas as a view-tree node, Surface's first child: a `lib-surface__shader` canvas,
 * hidden from assistive technology, bound to the `shader` store (`bindShader`), whose `onError`
 * calls the `SHADER_ERROR` handler. Params are plain arrays (the tree compares them as JSON).
 */
export function surfaceShaderNode(source: ShaderSource): Node {
  return wire(h('canvas', { class: 'lib-surface__shader', 'aria-hidden': 'true' }), {
    bind: [
      [
        'shader',
        {
          frag: source.frag,
          params: Array.from(source.params),
          scale: source.scale,
          animate: source.animate,
          interactive: source.interactive,
          onError: SHADER_ERROR,
        },
      ],
    ],
  });
}
