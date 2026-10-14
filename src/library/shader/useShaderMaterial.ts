// Stub: the compiler lane fills this in (docs/shader-graph.md, "The compiler").
import { useMemo } from 'react';
import type { Circuit } from '../graph/model/circuit';
import { compileCircuit, paramValues } from './compile';
import type { ParamSlot, ShaderError } from './types';

export interface ShaderMaterial {
  frag: string | null;
  params: Float32Array;
  slots: ParamSlot[];
  errors: ShaderError[];
}

export function useShaderMaterial(circuit: Circuit, module?: string): ShaderMaterial {
  return useMemo(() => {
    const r = compileCircuit(circuit, module);
    return { frag: r.frag, params: paramValues(circuit, r.params, module), slots: r.params, errors: r.errors };
  }, [circuit, module]);
}
