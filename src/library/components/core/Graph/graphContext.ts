import { createContext, type PointerEvent } from 'react';

/**
 * Which edge of a node a port sits on, and so which way a cord leaves it: `in` is the leading
 * edge, `out` the trailing one. A cord always runs outlet → inlet.
 */
export type PortSide = 'in' | 'out';

/**
 * A port's address on the canvas: its id **and** its side. A cord names two ids and is unambiguous
 * (`from` is an outlet, `to` an inlet), but a node may call its inlet and its outlet by the same
 * id, so geometry is filed by both. Ids only have to be unique per side.
 */
export function portKey(id: string, side: PortSide): string {
  return `${side} ${id}`;
}

/** The end a cord still needs, given the end it already has. */
export const opposite = (side: PortSide): PortSide => (side === 'out' ? 'in' : 'out');

/**
 * What a `Port` and a `GraphNode` need from the canvas they're on. A context, because a port sits
 * arbitrarily deep inside whatever face a host composed. Only geometry and gesture pass through
 * here, never what a port means.
 */
export interface GraphSurface {
  /** A port announces its element so the graph can measure it; `null` when it unmounts. */
  register(id: string, side: PortSide, element: HTMLElement | null): void;
  /** The pointer went down on a port: draw a cord from it. Either side may start one. */
  startCord(id: string, side: PortSide, event: PointerEvent<HTMLElement>): void;
  /** The keyboard's two presses: the first arms a port, the second lands on one. */
  armCord(id: string, side: PortSide): void;
  /** The pointer entered or left a port. */
  hoverPort(id: string | null, side?: PortSide): void;
  /** The port the cord in flight left, as a `portKey`, or null. */
  cordFrom: string | null;
  /** The side a port must be on to take the cord in flight, or null when none is out. */
  cordWants: PortSide | null;
  /** The port under the pointer, as a `portKey`, or null. */
  cordOver: string | null;
  /** The current zoom, as a function so zooming doesn't re-render every node. */
  scale(): number;
  /** A node reports where it was dragged to. The host writes it, or doesn't. */
  moveNode(id: string, x: number, y: number): void;
}

export const GraphContext = createContext<GraphSurface | null>(null);
