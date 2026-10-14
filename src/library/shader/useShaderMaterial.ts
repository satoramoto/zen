// Compile a circuit for drawing (docs/shader-graph.md, "The compiler"): the frag and slots are
// memoised on `structureKey`, so rewiring recompiles; `params` is read afresh on every change, so
// turning a knob updates live without a recompile.
import { useMemo } from 'react';
import type { Circuit } from '../graph/model/circuit';
import { compileCircuit, paramValues, slotValues, structureKey } from './compile';
import type { ParamSlot, ShaderError } from './types';

export interface ShaderMaterial {
  frag: string | null;
  params: Float32Array;
  slots: ParamSlot[];
  errors: ShaderError[];
}

export function useShaderMaterial(circuit: Circuit, module?: string): ShaderMaterial {
  const key = useMemo(() => structureKey(circuit, module), [circuit, module]);
  // Only the key decides when to recompile: the circuit it reads is whichever produced the key.
  const compiled = useMemo(() => compileCircuit(circuit, module), [key, module]);
  return useMemo(() => {
    const params = paramValues(circuit, compiled.params, module);
    const values = slotValues(circuit, compiled.params, module);
    const slots = compiled.params.map((s, n) => (s.value === values[n] ? s : { ...s, value: values[n] }));
    return { frag: compiled.frag, params, slots, errors: compiled.errors };
  }, [circuit, module, compiled]);
}
