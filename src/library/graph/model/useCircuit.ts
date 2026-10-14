import { useMemo } from 'react';
import type { GraphCord } from '../view/Graph/Graph';
import { CircuitError, connect, disconnect, flatten, moveChip, type Circuit, type End, type Trace } from './circuit';

export interface CircuitBinding {
  /** For `<Graph cords>`: one per trace of `flatten(circuit, module)`. */
  cords: GraphCord[];
  /** For `<Graph onConnect>`. */
  onConnect(from: string, to: string): void;
  /** For `<Graph onMove>`. */
  onMove(id: string, x: number, y: number): void;
  /** For `<Graph onDisconnect>`: cord delete. */
  onDisconnect(traceId: string): void;
  /** The id a `<Port>` must use: `${chip}/${pin}`. */
  portKeyOf(chip: string, pin: string): string;
}

export const portKeyOf = (chip: string, pin: string) => `${chip}/${pin}`;

let made = 0;
/** A trace id unique per call (and per page load). */
const freshTraceId = () => `t${Date.now().toString(36)}${(made++).toString(36)}`;

/**
 * Binds one module of a `Circuit` to `Graph`: the cords to draw, and handlers that hand the next
 * circuit to `onChange` (and nothing else; refusing a change is the operations' throw, swallowed
 * here). `onChange` is only ever called from the handlers, never while rendering.
 */
export function useCircuit(
  circuit: Circuit,
  module: string,
  onChange: (next: Circuit) => void,
  options?: { newTraceId?: () => string },
): CircuitBinding {
  const newTraceId = options?.newTraceId;
  return useMemo(() => {
    const chips = new Set((circuit.modules[module]?.chips ?? []).map((c) => c.id));
    /** A port key back to its pin: the split whose chip part names a chip in this module. */
    const endOf = (key: string): End | null => {
      for (let i = key.indexOf('/'); i >= 0; i = key.indexOf('/', i + 1)) {
        const chip = key.slice(0, i);
        if (chips.has(chip)) return { chip, pin: key.slice(i + 1) };
      }
      return null;
    };
    /** Apply an operation; a refused one (a `CircuitError`) changes nothing. */
    const attempt = (op: () => Circuit) => {
      let next: Circuit;
      try {
        next = op();
      } catch (e) {
        if (e instanceof CircuitError) return;
        throw e;
      }
      onChange(next);
    };
    let traces: Trace[] = [];
    try {
      traces = flatten(circuit, module);
    } catch (e) {
      // A circuit `validate` would fault (an unknown module or bus) draws no cords rather than throwing in render.
      if (!(e instanceof CircuitError)) throw e;
    }
    const cords = traces.flatMap((t): GraphCord[] => {
      if ('bus' in t.from || 'bus' in t.to) return [];
      const cord: GraphCord = { id: t.id, from: portKeyOf(t.from.chip, t.from.pin), to: portKeyOf(t.to.chip, t.to.pin) };
      if (t.kind !== undefined) cord.kind = t.kind;
      return [cord];
    });
    return {
      cords,
      portKeyOf,
      onConnect(from, to) {
        const a = endOf(from);
        const b = endOf(to);
        if (!a || !b) return;
        const taken = new Set((circuit.modules[module]?.traces ?? []).map((t) => t.id));
        let id = (newTraceId ?? freshTraceId)();
        // The default never repeats; a host's generator is trusted, and `connect` refuses a repeat.
        while (!newTraceId && taken.has(id)) id = freshTraceId();
        attempt(() => connect(circuit, module, { id, from: a, to: b }));
      },
      onMove(id, x, y) {
        attempt(() => moveChip(circuit, module, id, x, y));
      },
      onDisconnect(traceId) {
        attempt(() => disconnect(circuit, module, traceId));
      },
    };
  }, [circuit, module, onChange, newTraceId]);
}
