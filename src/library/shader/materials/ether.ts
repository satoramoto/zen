// Stub: the materials lane authors this circuit (docs/shader-graph.md, "The three materials").
import { emptyCircuit } from '../../graph/model/circuit';
import type { ShaderMaterialDef } from '../types';

export const ether: ShaderMaterialDef = { name: 'ether', label: 'Ether', circuit: emptyCircuit(), scale: 0.5, animate: true, interactive: false };
