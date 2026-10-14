// The shader graph's types (docs/shader-graph.md). Shared by the runner, the compiler, the
// materials and Surface; change them only through the contract.
import type { HTMLAttributes } from 'react';
import type { Circuit } from '../graph/model/circuit';

/** What a pin carries: a `vec2` position, a `float`, or a premultiplied `vec4` colour. */
export type PinKind = 'point' | 'number' | 'colour';
export const PIN_KINDS = ['point', 'number', 'colour'] as const;
/** The GLSL type each kind compiles to. */
export const GLSL_TYPE: Record<PinKind, 'vec2' | 'float' | 'vec4'> = { point: 'vec2', number: 'float', colour: 'vec4' };

/** How many numbers ride `uParams`. */
export const MAX_PARAMS = 64;

export interface NodeInput {
  id: string;
  kind: PinKind;
  label?: string;
  /** Number inputs: the value when unwired and unset. */
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Point and colour inputs: the GLSL used when unwired (default: the fragment's coord / transparent). */
  fallback?: string;
}

export interface NodeOutput {
  id: string;
  kind: PinKind;
  label?: string;
}

export interface NodeSpec {
  type: string;
  label: string;
  description: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  /** String params: a choice compiled in (changing one recompiles). */
  options?: Record<string, { values: readonly string[]; default: string }>;
  /** Names in `GLSL_HELPERS` the body calls; included once each, in order. */
  helpers?: string[];
  /** The GLSL expression for one outlet, given each input as an expression and the options. */
  emit(inputs: Record<string, string>, options: Record<string, string>, outlet: string): string;
}

/** One unwired number inlet riding `uParams[index]`. */
export interface ParamSlot {
  index: number;
  /** The flattened chip path: `warp` on the board, `smoke.warp` inside instance `smoke`. */
  chip: string;
  /** The input id (for a module instance, its module pin id). */
  param: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
}

export interface ShaderError {
  chip?: string;
  pin?: string;
  message: string;
}

export interface CompileResult {
  /** The fragment shader, or null when nothing can be drawn (no `out`, too many params). */
  frag: string | null;
  params: ParamSlot[];
  errors: ShaderError[];
}

export interface ShaderCanvasProps extends Omit<HTMLAttributes<HTMLCanvasElement>, 'children' | 'onError'> {
  /** The fragment shader; null draws nothing. */
  frag: string | null;
  /** `uParams`, up to 64. */
  params?: ArrayLike<number>;
  /** Controlled time in seconds; unset, the page-wide clock. */
  time?: number;
  /** Default true: a frame per display frame while visible. False: draw on change only. */
  animate?: boolean;
  /** Render resolution as a fraction of device pixels (DPR capped at 2); default 0.5. */
  scale?: number;
  /** `uRadius` in CSS px; default the parent's computed corner radius. */
  radius?: number;
  /** Track the pointer over the parent element into `uPointer`. */
  interactive?: boolean;
  /** A GLSL compile or link failure; the canvas then draws nothing. */
  onError?: (message: string) => void;
}

export type ShaderMaterialName = 'water' | 'ether' | 'glass';
export const SHADER_MATERIAL_NAMES = ['water', 'ether', 'glass'] as const;

export interface ShaderMaterialDef {
  name: ShaderMaterialName;
  label: string;
  /** The material, authored as a Circuit. */
  circuit: Circuit;
  /** ShaderCanvas render scale. */
  scale: number;
  animate: boolean;
  interactive: boolean;
}

/** A compiled material handed straight to a Surface. */
export interface ShaderSource {
  frag: string | null;
  params: ArrayLike<number>;
  scale?: number;
  animate?: boolean;
  interactive?: boolean;
}
