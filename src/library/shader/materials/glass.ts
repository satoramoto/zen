// Stub: the materials lane authors this circuit (docs/shader-graph.md, "The three materials").
import { emptyCircuit } from '../../graph/model/circuit';
import type { ShaderMaterialDef } from '../types';

export const glass: ShaderMaterialDef = { name: 'glass', label: 'Glass', circuit: emptyCircuit(), scale: 1, animate: false, interactive: false };
