// The shader graph (docs/shader-graph.md): materials authored as Circuits, compiled to one GLSL ES
// 3.00 fragment shader, and drawn by one shared WebGL2 context behind a Surface's content.
export {
  PIN_KINDS,
  GLSL_TYPE,
  MAX_PARAMS,
  SHADER_MATERIAL_NAMES,
  type PinKind,
  type NodeInput,
  type NodeOutput,
  type NodeSpec,
  type ParamSlot,
  type ShaderError,
  type CompileResult,
  type ShaderCanvasProps,
  type ShaderMaterialName,
  type ShaderMaterialDef,
  type ShaderSource,
} from './types';
/** The node library: a chip's `type` → its inputs, outputs, options and GLSL; `shaderChip` builds a chip with its pins. */
export { SHADER_NODES, shaderChip } from './nodes';
/** The pure compiler: a Circuit module → a fragment shader, its `uParams` slots and its errors. */
export { compileCircuit, paramValues, structureKey } from './compile';
/** Compile a circuit, recompiling only when its structure changes; params update every change. */
export { useShaderMaterial, type ShaderMaterial } from './useShaderMaterial';
/** The runner: a canvas drawing a fragment shader through the page's one shared WebGL2 context. */
export { ShaderCanvas } from './ShaderCanvas';
/** Whether a shader material should draw here (WebGL2, no reduced motion or transparency). */
export { useShaderSupport } from './support';
/** The three materials, as Circuits, and a named material compiled once per page. */
export { SHADER_MATERIALS, compiledMaterial } from './materials';
