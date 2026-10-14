// Stub: the compiler lane fills this in (docs/shader-graph.md, "The node library").
import type { Chip, Json } from '../graph/model/circuit';
import type { NodeSpec } from './types';

export const SHADER_NODES: Record<string, NodeSpec> = {};

export function shaderChip(type: string, id: string, x: number, y: number, params?: Record<string, Json>): Chip {
  return { id, type, x, y, pins: [], ...(params ? { params } : {}) };
}
