// The three materials (docs/shader-graph.md, "The three materials"), and a named material
// compiled once per page.
import { compileCircuit, paramValues } from '../compile';
import type { ShaderMaterialDef, ShaderMaterialName, ShaderSource } from '../types';
import { water } from './water';
import { ether } from './ether';
import { glass } from './glass';

export const SHADER_MATERIALS: Record<ShaderMaterialName, ShaderMaterialDef> = { water, ether, glass };

const cache = new Map<ShaderMaterialName, ShaderSource>();

/** A named material, compiled on first use and kept for the page. */
export function compiledMaterial(name: ShaderMaterialName): ShaderSource {
  const hit = cache.get(name);
  if (hit) return hit;
  const def = SHADER_MATERIALS[name];
  const r = compileCircuit(def.circuit);
  const source: ShaderSource = { frag: r.frag, params: paramValues(def.circuit, r.params), scale: def.scale, animate: def.animate, interactive: def.interactive };
  cache.set(name, source);
  return source;
}
