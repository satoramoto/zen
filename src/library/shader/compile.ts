// Stub: the compiler lane fills this in (docs/shader-graph.md, "The compiler").
import type { Circuit } from '../graph/model/circuit';
import { MAX_PARAMS, type CompileResult, type ParamSlot } from './types';

export function compileCircuit(_circuit: Circuit, _module?: string): CompileResult {
  return { frag: null, params: [], errors: [{ message: 'not built yet' }] };
}

export function paramValues(_circuit: Circuit, slots: ParamSlot[], _module?: string): Float32Array {
  const out = new Float32Array(MAX_PARAMS);
  for (const s of slots) out[s.index] = s.value;
  return out;
}

export function structureKey(circuit: Circuit, _module?: string): string {
  return JSON.stringify(circuit);
}
