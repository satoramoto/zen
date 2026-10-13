# Graph model: contract

Status: **draft for Ryan's approval.** This is the contract that a
`test-engineer` and a `developer` both work from, in parallel and without
coordinating. Tests are written against the API below. When both sides are
done, the tests run against the implementation.

## Why

zen's `Graph` (from #35, a port of openflowfm/widgets' graph) draws a canvas,
nodes, ports and cords, but has no data model: hosts own positions and cords
in their own shapes. Many of Ryan's apps need a graph, and so does the session
state machine in awesome-claude. That machine must be drawn both by zen (an
editor) and as SVG in a Claude pane. So the graph needs one plain-JSON model
with pure operations, drawn by zen's existing `Graph`, and with subgraphs built
in from the start.

## Scope of the first pass

In scope:
- the model types;
- the pure operations and `validate`;
- the `useGraphModel` hook binding one definition to `Graph`;
- deleting a cord;
- port state attributes and kind hues;
- one story.

Out of scope, but the model already has room for them so none needs a reshape
later:
- layout and routing;
- edge labels drawn on the canvas;
- the group frames UI;
- entering, leaving, converting or expanding subgraphs in the UI, and
  breadcrumbs;
- `Sheet` / `DeviceMore` / `driver`;
- drawing modulations differently;
- drawing buses (a labelled rail with short named stubs at each tap; until
  then the binding draws a bus's taps as cords from its source);
- placement-aware ports, radial and free layouts, and `trace` routing (the
  circuit-board look). The first pass draws today's left-to-right curves
  whatever the hints say.

Compatibility: every change to `Graph`, `GraphNode`, `Port` and `Device` is
additive. openflowfm/visuals' `StageGraph`, the only consumer, keeps working
unchanged.

## Public API

New file `src/library/components/core/Graph/model.ts`, exported from
`core/index.ts`.

```ts
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export type PortSide = 'in' | 'out'; // re-exported from graphContext.ts, unchanged

export interface PortSpec {
  id: string;           // unique among this node's ports on the same side
  side: PortSide;
  kind?: string;        // opaque type tag; also the style hook (data-kind)
  label?: string;
  param?: boolean;      // an inlet that drives a parameter rather than carrying the signal
  // Where the port sits on the node. Presentation only: `side` alone decides signal
  // direction and every connect rule. 'auto' (default) lets the layout choose, e.g. the
  // face nearest the other end, so a graph can flow outward from a centre, not left to right.
  placement?: 'auto' | 'n' | 'e' | 's' | 'w';
}

export interface Node {
  id: string;           // unique within its GraphDef
  type: string;         // the host's node type, opaque to zen
  x: number;
  y: number;
  ports: PortSpec[];    // ignored when `subgraph` is set (ports come from the definition)
  params?: Record<string, Json>;
  subgraph?: string;    // id of a GraphDef in the same GraphDoc: this node is an instance of it
  group?: string;       // id of a Group in the same GraphDef
  style?: string;       // host style variant, opaque
  collapsed?: boolean;
  [extra: string]: unknown; // unknown fields are preserved by every operation
}

export interface PortEnd { node: string; port: string }
export interface BusEnd { bus: string }
export type End = PortEnd | BusEnd;   // Exposed.maps and Promoted.maps always use PortEnd

// A named rail: one outlet feeds it (an edge whose `to` is the bus), any number of
// inlets tap it (edges whose `from` is the bus). Purely presentational: it means the
// direct edges source → each tap.
export interface Bus { id: string; label?: string; kind?: string }

export interface Edge {
  id: string;           // unique within its GraphDef
  from: End;            // always an outlet
  to: End;              // always an inlet
  kind?: string;
  role?: 'signal' | 'modulation'; // default 'signal'
  amount?: number;      // modulation depth, -1..1
  label?: string;
  [extra: string]: unknown;
}

export interface Exposed {
  id: string;           // unique among the def's inlets (or outlets)
  kind?: string;
  label?: string;
  maps: End;            // the inner node port this exposed port stands for
}

export interface Promoted { id: string; label?: string; maps: { node: string; param: string } }

export interface Group { id: string; label?: string }

export interface GraphDef {
  id: string;
  nodes: Node[];
  edges: Edge[];
  inlets: Exposed[];    // ports this def shows on its instances' leading edge
  outlets: Exposed[];   // ... and trailing edge
  params?: Promoted[];
  groups?: Group[];
  buses?: Bus[];
  // Layout and routing hints, presentation only. The goal is a web or root system that
  // flows outward from a centre in whatever direction suits, with circuit-board traces,
  // not a strict left-to-right chain.
  layout?: 'free' | 'radial' | 'lr' | 'tb'; // default 'free' (positions as stored)
  routing?: 'curve' | 'trace';               // default 'curve'; 'trace' = straight runs, 45° bends
  [extra: string]: unknown;
}

export interface GraphDoc {
  version: 1;
  root: string;                         // id of the top-level GraphDef
  definitions: Record<string, GraphDef>; // keyed by GraphDef.id
}

export type GraphErrorCode =
  | 'unknown-def' | 'unknown-node' | 'unknown-port' | 'unknown-edge' | 'unknown-group'
  | 'duplicate-id' | 'wrong-side' | 'self-loop' | 'cycle-in-definitions' | 'bad-amount'
  | 'unknown-bus' | 'bus-has-source' | 'bus-to-bus';

export class GraphError extends Error { constructor(public code: GraphErrorCode, message: string); }

export interface Issue { code: GraphErrorCode; def: string; path: string; message: string }

// Ports a node actually has: its own `ports`, or, for an instance, its definition's
// inlets (side 'in') and outlets (side 'out'), using the Exposed id, kind and label.
export function portsOf(doc: GraphDoc, def: string, node: string): PortSpec[];

export function emptyDoc(rootId?: string): GraphDoc;            // rootId defaults to 'root'
export function addDef(doc: GraphDoc, def: GraphDef): GraphDoc;
export function addNode(doc: GraphDoc, def: string, node: Node): GraphDoc;
export function removeNode(doc: GraphDoc, def: string, node: string): GraphDoc;
export function moveNode(doc: GraphDoc, def: string, node: string, x: number, y: number): GraphDoc;
export function connect(doc: GraphDoc, def: string, edge: Edge): GraphDoc;
export function disconnect(doc: GraphDoc, def: string, edge: string): GraphDoc;
export function validate(doc: GraphDoc): Issue[];
export function addBus(doc: GraphDoc, def: string, bus: Bus): GraphDoc;
export function removeBus(doc: GraphDoc, def: string, bus: string): GraphDoc;
// The def's edges with every bus expanded: one edge source → tap per tap, ids
// `${tapEdgeId}`, kind and role from the tap edge. Edges without a bus pass through.
export function flatten(doc: GraphDoc, def: string): Edge[];
```

New file `src/library/components/core/Graph/useGraphModel.ts`, exported from
`core/index.ts`:

```ts
export interface GraphBinding {
  cords: GraphCord[];                                  // for <Graph cords>
  onConnect(from: string, to: string): void;           // for <Graph onConnect>
  onMove(id: string, x: number, y: number): void;      // for <Graph onMove>
  onDisconnect(edgeId: string): void;                  // for cord delete
  portKeyOf(node: string, port: string): string;       // the id a <Port> must use: `${node}/${port}`
}

export function useGraphModel(
  doc: GraphDoc,
  def: string,
  onChange: (next: GraphDoc) => void,
  options?: { newEdgeId?: () => string },             // default: a unique id per call
): GraphBinding;
```

`Graph` gains one optional prop, `onDisconnect?: (cordId: string) => void`.
`GraphCord` gains an optional `id`. When both are present, a cord can be
selected (click or keyboard focus) and deleted with Delete or Backspace.

## Behaviours

### The model

1. Every operation is pure: it returns a new `GraphDoc` and never mutates its
   input, which stays deep-equal to what it was.
2. Every operation preserves fields it doesn't know (the `[extra]` fields on
   Node, Edge and GraphDef), unchanged.
3. An operation naming a definition, node, port, edge or group that doesn't
   exist throws `GraphError` with the matching `unknown-*` code. The input is
   unchanged.
4. `addNode` throws `duplicate-id` if a node with that id is already in the
   def. `connect` and `addDef` do the same for edges and definitions.
5. `connect` throws `wrong-side` unless `from` names an outlet and `to` an
   inlet of the nodes they name. "Names" means as seen through `portsOf`, so
   subgraph instances count.
6. `connect` throws `self-loop` when `from.node === to.node`.
7. `connect` throws `bad-amount` when `amount` is present and outside -1..1,
   or present on an edge whose `role` isn't `modulation`.
8. An inlet may take several edges, and an outlet may feed several. `connect`
   doesn't reject a second edge into an inlet.
9. `removeNode` also removes every edge to or from that node, and every
   `Exposed` or `Promoted` entry that maps to it.
10. `moveNode` changes only that node's `x` and `y`.
11. `disconnect` removes only that edge.
12. `emptyDoc()` returns `{ version: 1, root: 'root', definitions: { root:
    { id: 'root', nodes: [], edges: [], inlets: [], outlets: [] } } }`.
13. A `GraphDoc` survives `JSON.parse(JSON.stringify(doc))` deep-equal. The
    model holds no functions, classes or cycles.

### Subgraphs

14. A node with `subgraph: 'D'` is an instance of definition `D`. `portsOf`
    gives it `D`'s `inlets` as side `in` and `outlets` as side `out`, and
    ignores the node's own `ports`.
15. Several nodes, in any definitions, may be instances of the same
    definition. Edges are keyed on `{node, port}`, so instances never clash.
16. `addDef` and `addNode` throw `cycle-in-definitions` if the change would
    make a definition contain, directly or through other definitions, an
    instance of itself.
17. Adding an inlet or outlet to a definition is visible on every instance
    through `portsOf`, with no change to the instances themselves.

### Direction is semantic, placement is not

17g. `placement`, `layout` and `routing` never affect an operation, `connect`'s
     rules or `validate`, beyond checking that their values are among those
     listed. Only `side` decides which way a signal flows.
17h. Every operation preserves `placement`, `layout` and `routing` unchanged.

### Buses

17a. `addBus` adds a bus to a def. It throws `duplicate-id` if one with that id
     exists, and `removeBus` throws `unknown-bus` if it doesn't.
17b. `connect` accepts a `BusEnd` on either side:
     - `to: {bus}` makes that edge the bus's source, and throws `bus-has-source`
       if the bus already has one;
     - `from: {bus}` makes a tap;
     - both ends a bus throws `bus-to-bus`;
     - an unknown bus throws `unknown-bus`.
     A tap's `to` must still be an inlet (`wrong-side` otherwise), and a source's
     `from` must be an outlet.
17c. A bus may have taps before it has a source. `flatten` leaves those taps
     out until a source exists.
17d. `removeBus` removes the bus and every edge to or from it.
17e. `flatten` returns the same connectivity as if every tap were a direct edge
     from the bus's source outlet. Taps keep their own id, kind, role and amount.
17f. A bus belongs to its def: `BusEnd`s resolve only against their own def's
     `buses`. A subgraph reaches a parent's bus through an exposed inlet.

### validate

18. `validate` never throws. It returns `[]` for a valid doc, and otherwise
    one `Issue` per problem. Each issue has the code that the matching
    operation would have thrown, the def's id and a path, e.g.
    `edges[2].to.port`.
19. It reports:
    - a missing `root` definition;
    - a `definitions` key that differs from its def's id;
    - duplicate ids;
    - edges whose ends don't resolve, run in the wrong direction, or loop on
      one node;
    - `Exposed` and `Promoted` entries that don't resolve;
    - `subgraph`, `group` and bus references that don't resolve;
    - buses with more than one source, and edges with a bus at both ends;
    - out-of-range amounts;
    - cycles among definitions.
20. Every doc produced only by the operations, starting from `emptyDoc`,
    validates to `[]`.

### Binding to Graph (`useGraphModel`)

21. `cords` holds one `GraphCord` per edge of `flatten(doc, def)` (so a bus's
    taps draw as cords from its source until buses get their own drawing), with
    `id = edge.id`, `kind = edge.kind`, `from = portKeyOf(edge.from)` and
    `to = portKeyOf(edge.to)`.
22. `onConnect(from, to)` with two keys from `portKeyOf` calls `onChange`
    with the doc after `connect`, using a fresh edge id. If `connect` would
    throw, `onChange` isn't called and nothing else happens.
23. `onMove(id, x, y)` calls `onChange` with the doc after `moveNode`.
24. `onDisconnect(edgeId)` calls `onChange` with the doc after `disconnect`.
25. The binding calls `onChange` only from those three handlers, never while
    rendering.

### Graph additions

26. With `onDisconnect` and cord ids, a cord can be selected by click or
    keyboard. Delete or Backspace calls `onDisconnect(id)`, and Escape clears
    the selection. Without `onDisconnect`, cords behave exactly as today.
27. A `Port` carries `data-kind` when it has a kind (as today). Its colour
    comes from the theme's hue slots (`--hue-*` via `core/hue.ts`), never a
    hex value.
28. Existing `Graph` tests and the visuals `StageGraph` usage pass unchanged.

### Story

29. `Design OS/Components/Core/Graph/Model` shows a model-driven graph with:
    - two nodes and a modulation edge;
    - a node that is a subgraph instance, with exposed ports;
    - working connect, move and cord delete;
    - the current `GraphDoc` printed beside it.
    It works under every design system pack.

## Files

| File | Side |
| --- | --- |
| `core/Graph/model.ts`, `core/Graph/useGraphModel.ts` (new), additions to `Graph.tsx` / `Graph.css` / `Port.tsx`, `core/index.ts` exports, `Graph.stories.tsx` | developer |
| `core/Graph/model.test.ts`, `core/Graph/useGraphModel.test.tsx` (new), cord-delete cases in `Graph.test.tsx` | test-engineer |

## Open questions

1. Should `connect` reject a second edge into an inlet that isn't a `param`
   port, i.e. single-input signal inlets? The spec currently says no (8).
2. Should `kind` compatibility (e.g. audio into audio only) be a model rule,
   or stay the host's concern as in widgets today? The spec currently leaves
   it to the host.
