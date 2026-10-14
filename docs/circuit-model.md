# Circuit model: contract

Status: **draft for Ryan's approval.** This is the contract that a
`test-engineer` and a `developer` both work from, in parallel and without
coordinating. Tests are written against the API below. When both sides are
done, the tests run against the implementation.

## Vocabulary

The words here (Circuit, Board, Module, Chip, Pin, Trace, Bus, Module pins,
Control, Zone, Flatten) are defined in `~/.claude/LEXICON.md`, Circuit section.
The Circuit model is drawn by the Graph view: zen's existing `Graph`,
`GraphNode`, `Port` and `GraphCord` components keep their names (visuals'
`StageGraph` uses them).

## Why

zen's `Graph` (from #35, a port of openflowfm/widgets' graph) draws a canvas,
nodes, ports and cords, but has no data model: hosts own positions and cords
in their own shapes. Many of Ryan's apps need a circuit, and so does the
session state machine in awesome-claude. That machine must be drawn both by
zen (an editor) and as SVG in a Claude pane. So it needs one plain-JSON model
with pure operations, drawn by zen's existing `Graph`, and with modules built
in from the start.

## Scope of the first pass

In scope:
- the model types;
- the pure operations and `validate`;
- the `useCircuit` hook binding one module to `Graph`;
- deleting a cord;
- port state attributes and kind hues;
- one story.

Out of scope, but the model already has room for them so none needs a reshape
later:
- layout and routing;
- trace labels drawn on the canvas;
- the zone frames UI;
- entering, leaving, converting or expanding modules in the UI, and
  breadcrumbs;
- `Sheet` / `DeviceMore` / `driver`;
- drawing modulations differently;
- drawing buses (a labelled rail with short named stubs at each tap; until
  then the binding draws a bus's taps as cords from its source);
- placement-aware pins, radial and free layouts, and `'trace'` routing (the
  circuit-board look). The first pass draws today's left-to-right curves
  whatever the hints say.

Compatibility: every change to `Graph`, `GraphNode`, `Port` and `Device` is
additive. openflowfm/visuals' `StageGraph`, the only consumer, keeps working
unchanged.

### Second pass: the drawing layers (built)

The view now draws most of what the model already held. Every addition is an
optional prop; without it a graph looks and behaves as before. The binding
(`useCircuit`, behaviours 21–25) is unchanged: a host maps traces onto these.

- **Pin placement.** `Port` takes `face` (`n`, `e`, `s`, `w`), and a cord
  leaves each port along its face. `Device` takes `edges` (each a `DeviceEdge`
  with `face` and `at`, or `x` and `y`) for pins placed on the outline, and
  `pins="edge"` to stand rail pins on the edge. `placement: 'auto'` is the
  host's to resolve (the samples pick the face toward a pin's one other end in
  a `free` layout).
- **Routing.** `Graph` takes `routing: 'curve' | 'trace'`; `'trace'` is
  straight runs with 45° bends. Layout (`lr`, `tb`, `radial`) is still the
  stored positions.
- **Trace labels and modulation.** `GraphCord` takes `label`, `role`,
  `amount` and `dim`: a label mid-cord, a dashed modulation with its amount as
  a signed percentage near the inlet.
- **Buses.** `Graph` takes `buses` (`GraphBus`: `id`, `label`, `kind`, `from`
  the source outlet, `axis`, `at`), and a `GraphCord` with `bus` is drawn as a
  stub from that rail. Contract addition: `Bus.rail?: { axis: 'h' | 'v'; at?:
  number }`, presentation only like `placement` (not checked by `validate`,
  preserved by every operation as part of the bus).
- **Zones.** `Graph` takes `zones` (`GraphZone`: `id`, `label`, `nodes`), a
  labelled frame round those nodes' boxes.
- **Modules.** `GraphPath` is a breadcrumb trail (board, then each instance
  entered). Entering and leaving is the host's state; inside a module the
  samples draw its `inPins` and `outPins` as boundary terminals wired to the
  inner pins they map to.
- `Port` also takes `shape: 'diamond'` (a param pin) and `hue: 'role-1' |
  'role-2'` (a host with more kinds than hue slots); `Device` takes `kicker`
  (the type line under the name); `GraphView` gains `zoom(factor)`, and
  `Graph` `fitAlign: 'center'`.

Still to draw: the `controls` entry on the canvas (the samples list them in the
JSON panel), `radial`/`tb` layout, converting or expanding modules, and
obstacle-aware routing.

## Public API

New file `src/library/graph/model/circuit.ts`, exported from
`graph/index.ts` (and so from the package root).

```ts
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export type PortSide = 'in' | 'out'; // re-exported from graphContext.ts, unchanged

export interface Pin {
  id: string;           // unique among this chip's pins on the same side
  side: PortSide;
  kind?: string;        // opaque type tag; also the style hook (data-kind)
  label?: string;
  param?: boolean;      // an in pin that drives a parameter rather than carrying the signal
  // Where the pin sits on the chip, placed freely for layout.
  // Presentation only: `side` alone decides signal direction and every connect rule.
  //  - 'auto' (default): the layout chooses, e.g. the face nearest the other end.
  //  - a face: centred on that face.
  //  - { face, at }: a pin along that face, `at` 0..1 from its start (top or left).
  //  - { x, y }: anywhere on or in the chip, as fractions 0..1 of its box.
  placement?: 'auto' | Face | { face: Face; at: number } | { x: number; y: number };
}

export type Face = 'n' | 'e' | 's' | 'w';

export interface Chip {
  id: string;           // unique within its Module
  type: string;         // the host's chip type, opaque to zen
  x: number;
  y: number;
  pins: Pin[];          // ignored when `module` is set (pins come from the module)
  params?: Record<string, Json>;
  module?: string;      // id of a Module in the same Circuit: this chip is an instance of it
  zone?: string;        // id of a Zone in the same Module
  style?: string;       // host style variant, opaque
  collapsed?: boolean;
  [extra: string]: unknown; // unknown fields are preserved by every operation
}

export interface PinEnd { chip: string; pin: string }
export interface BusEnd { bus: string }
export type End = PinEnd | BusEnd;   // ModulePin.maps and Control.maps always use PinEnd

// A named rail: one out pin feeds it (a trace whose `to` is the bus), any number of
// in pins tap it (traces whose `from` is the bus). Purely presentational: it means the
// direct traces source → each tap.
export interface Bus {
  id: string; label?: string; kind?: string;
  rail?: { axis: 'h' | 'v'; at?: number }; // where the rail is drawn; presentation only (second pass)
}

export interface Trace {
  id: string;           // unique within its Module
  from: End;            // always an out pin
  to: End;              // always an in pin
  kind?: string;
  role?: 'signal' | 'modulation'; // default 'signal'
  amount?: number;      // modulation depth, -1..1
  label?: string;
  [extra: string]: unknown;
}

export interface ModulePin {
  id: string;           // unique among the module's inPins (or outPins)
  kind?: string;
  label?: string;
  maps: End;            // the inner chip pin this module pin stands for
}

export interface Control { id: string; label?: string; maps: { chip: string; param: string } }

export interface Zone { id: string; label?: string }

export interface Module {
  id: string;
  chips: Chip[];
  traces: Trace[];
  inPins: ModulePin[];  // pins this module shows on its instances' leading edge
  outPins: ModulePin[]; // ... and trailing edge
  controls?: Control[];
  zones?: Zone[];
  buses?: Bus[];
  // Layout and routing hints, presentation only. The goal is a web or root system that
  // flows outward from a centre in whatever direction suits, with circuit-board traces,
  // not a strict left-to-right chain.
  layout?: 'free' | 'radial' | 'lr' | 'tb'; // default 'free' (positions as stored)
  routing?: 'curve' | 'trace';               // default 'curve'; 'trace' = straight runs, 45° bends
  [extra: string]: unknown;
}

export interface Circuit {
  version: 1;
  board: string;                    // id of the top-level Module
  modules: Record<string, Module>;  // keyed by Module.id
}

export type CircuitErrorCode =
  | 'unknown-module' | 'unknown-chip' | 'unknown-pin' | 'unknown-trace' | 'unknown-zone'
  | 'duplicate-id' | 'wrong-side' | 'self-loop' | 'cycle-in-modules' | 'bad-amount'
  | 'unknown-bus' | 'bus-has-source' | 'bus-to-bus'
  | 'inlet-taken'   // an in pin already has its one trace (behaviour 8)
  | 'bad-hint'      // malformed placement, layout or routing (validate only)
  | 'key-mismatch'; // a `modules` key differs from its module's id (validate only)

export class CircuitError extends Error { constructor(public code: CircuitErrorCode, message: string); }

export interface Issue { code: CircuitErrorCode; module: string; path: string; message: string }

// Pins a chip actually has: its own `pins`, or, for an instance, its module's
// inPins (side 'in') and outPins (side 'out'), using the ModulePin id, kind and label.
export function pinsOf(circuit: Circuit, module: string, chip: string): Pin[];

export function emptyCircuit(boardId?: string): Circuit;          // boardId defaults to 'board'
export function addModule(circuit: Circuit, module: Module): Circuit;
export function placeChip(circuit: Circuit, module: string, chip: Chip): Circuit;
export function removeChip(circuit: Circuit, module: string, chip: string): Circuit;
export function moveChip(circuit: Circuit, module: string, chip: string, x: number, y: number): Circuit;
export function connect(circuit: Circuit, module: string, trace: Trace): Circuit;
export function disconnect(circuit: Circuit, module: string, trace: string): Circuit;
export function validate(circuit: Circuit): Issue[];
export function addBus(circuit: Circuit, module: string, bus: Bus): Circuit;
export function removeBus(circuit: Circuit, module: string, bus: string): Circuit;
// The module's traces with every bus expanded: one trace source → tap per tap, ids
// `${tapTraceId}`, kind and role from the tap trace. Traces without a bus pass through.
export function flatten(circuit: Circuit, module: string): Trace[];
```

New file `src/library/graph/model/useCircuit.ts`, exported from
`graph/index.ts`:

```ts
export interface CircuitBinding {
  cords: GraphCord[];                                  // for <Graph cords>
  onConnect(from: string, to: string): void;           // for <Graph onConnect>
  onMove(id: string, x: number, y: number): void;      // for <Graph onMove>
  onDisconnect(traceId: string): void;                 // for cord delete
  portKeyOf(chip: string, pin: string): string;        // the id a <Port> must use: `${chip}/${pin}`
}

export function useCircuit(
  circuit: Circuit,
  module: string,
  onChange: (next: Circuit) => void,
  options?: { newTraceId?: () => string },            // default: a unique id per call
): CircuitBinding;
```

`Graph` gains one optional prop, `onDisconnect?: (cordId: string) => void`.
`GraphCord` gains an optional `id`. When both are present, a cord can be
selected (click or keyboard focus) and deleted with Delete or Backspace.

## Behaviours

### The model

1. Every operation is pure: it returns a new `Circuit` and never mutates its
   input, which stays deep-equal to what it was.
2. Every operation preserves fields it doesn't know (the `[extra]` fields on
   Chip, Trace and Module), unchanged.
3. Every function except `validate` (including `pinsOf` and `flatten`) that is
   given a module, chip, pin, trace, zone or bus that doesn't exist throws
   `CircuitError` with the matching `unknown-*` code. The input is unchanged.
4. `placeChip` throws `duplicate-id` if a chip with that id is already in the
   module. `connect` and `addModule` do the same for traces and modules.
5. `connect` throws `wrong-side` unless `from` names an out pin and `to` an
   in pin of the chips they name. "Names" means as seen through `pinsOf`, so
   module instances count.
6. `connect` throws `self-loop` when `from.chip === to.chip`.
7. `connect` throws `bad-amount` when `amount` is present and outside -1..1,
   or present on a trace whose `role` isn't `modulation`.
8. An in pin takes at most one trace; an out pin may feed many. `connect`
   throws `inlet-taken` when the in pin already has a trace, and a bus tap
   ending at that pin counts as its trace.

   **Merging.** Fan-in goes through a merge chip: any chip whose type the host
   treats as a merge, with n in pins and one out pin. Each source feeds one of
   its in pins, and its out pin feeds the destination. The model gives the type
   no meaning; samples use the conventional `type: 'merge'`.
9. `removeChip` also removes every trace to or from that chip, and every
   `ModulePin` or `Control` entry that maps to it. Removing a ModulePin this way
   also removes, in every module, each trace that ended at that pin on an
   instance of the module. So the result still validates (behaviour 20).
10. `moveChip` changes only that chip's `x` and `y`.
11. `disconnect` removes only that trace.
12. `emptyCircuit()` returns `{ version: 1, board: 'board', modules: { board:
    { id: 'board', chips: [], traces: [], inPins: [], outPins: [] } } }`.
13. A `Circuit` survives `JSON.parse(JSON.stringify(circuit))` deep-equal. The
    model holds no functions, classes or cycles.

### Modules

14. A chip with `module: 'D'` is an instance of module `D`. `pinsOf` gives it
    `D`'s `inPins` as side `in` and `outPins` as side `out`, and ignores the
    chip's own `pins`.
15. Several chips, in any modules, may be instances of the same module.
    Traces are keyed on `{chip, pin}`, so instances never clash.
16. `addModule` and `placeChip` throw `cycle-in-modules` if the change would
    make a module contain, directly or through other modules, an instance of
    itself.
17. Adding an in pin or out pin to a module is visible on every instance
    through `pinsOf`, with no change to the instances themselves.

### Direction is semantic, placement is not

17g. `placement`, `layout` and `routing` never affect an operation, `connect`'s
     rules or `validate`, beyond checking that their values are well-formed:
     a listed keyword, a known face, and `at`, `x` and `y` within 0..1. Only
     `side` decides which way a signal flows, so an in pin and an out pin may
     sit on any face of a chip, side by side.
17h. Every operation preserves `placement`, `layout` and `routing` unchanged.

### Buses

17a. `addBus` adds a bus to a module. It throws `duplicate-id` if one with
     that id exists, and `removeBus` throws `unknown-bus` if it doesn't.
17b. `connect` accepts a `BusEnd` on either side:
     - `to: {bus}` makes that trace the bus's source, and throws
       `bus-has-source` if the bus already has one;
     - `from: {bus}` makes a tap;
     - both ends a bus throws `bus-to-bus`;
     - an unknown bus throws `unknown-bus`.
     A tap's `to` must still be an in pin (`wrong-side` otherwise), and a
     source's `from` must be an out pin.
17c. A bus may have taps before it has a source. `flatten` leaves those taps
     out until a source exists.
17d. `removeBus` removes the bus and every trace to or from it.
17e. `flatten` returns the same connectivity as if every tap were a direct
     trace from the bus's source out pin. Taps keep their own id, kind, role
     and amount.
17f. A bus belongs to its module: `BusEnd`s resolve only against their own
     module's `buses`. A module reaches a parent's bus through one of its
     in pins.

### validate

18. `validate` never throws. It returns `[]` for a valid circuit, and otherwise
    one `Issue` per problem. Each issue has the code that the matching
    operation would have thrown (`bad-hint` and `key-mismatch` exist only
    here), the module's id and a path, e.g. `traces[2].to.pin`.
19. It reports:
    - a missing `board` module;
    - a `modules` key that differs from its module's id;
    - duplicate ids;
    - traces whose ends don't resolve, run in the wrong direction, or loop on
      one chip;
    - `ModulePin` and `Control` entries that don't resolve;
    - `module`, `zone` and bus references that don't resolve;
    - buses with more than one source, and traces with a bus at both ends;
    - in pins with more than one trace (`inlet-taken`, on each trace after
      the first);
    - out-of-range amounts;
    - cycles among modules.
20. Every circuit produced only by the operations, starting from
    `emptyCircuit`, validates to `[]`.
20a. Settled during the first build (cases the contract didn't cover):
    - operations never refuse a malformed hint; only `validate` reports
      `bad-hint` (17g);
    - `removeBus` also removes module pins mapped to that bus, and their traces
      on instances, so rule 20 holds;
    - a trace created through the binding (rule 22) gets no `kind`; hosts copy
      the out pin's kind in `onChange` if they want it;
    - `validate` reports one issue per broken trace, at its first broken end;
    - a chip with no `pins` array is treated as having none, so a trace naming
      one of its pins is `unknown-pin`.

### Binding to Graph (`useCircuit`)

21. `cords` holds one `GraphCord` per trace of `flatten(circuit, module)` (so a
    bus's taps draw as cords from its source until buses get their own
    drawing), with `id = trace.id`, `kind = trace.kind`,
    `from = portKeyOf(trace.from)` and `to = portKeyOf(trace.to)`.
22. `onConnect(from, to)` with two keys from `portKeyOf` calls `onChange`
    with the circuit after `connect`, using a fresh trace id. If `connect`
    would throw, `onChange` isn't called and nothing else happens.
23. `onMove(id, x, y)` calls `onChange` with the circuit after `moveChip`.
24. `onDisconnect(traceId)` calls `onChange` with the circuit after
    `disconnect`.
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

29. `Design OS/Graph/Circuit` shows a circuit drawn by the Graph
    view with:
    - two chips and a modulation trace;
    - a chip that is a module instance, with module pins;
    - working connect, move and cord delete;
    - the current `Circuit` printed beside it.
    It works under every design system pack.

## Files

The graph has its own area, `src/library/graph/` (moved out of
`components/core`): `model/` (the Circuit model), `view/` (`Graph`, `Port`,
`graphContext`, `Device`, `NodeSheet`), `stories/` (fixtures, Samples and
Behaviours), and `index.ts`, which the package root re-exports, so every
import from `@satoramoto/zen` is unchanged. Its stories sit under
`Design OS/Graph/…`.

| File | Side |
| --- | --- |
| `graph/model/circuit.ts`, `graph/model/useCircuit.ts`, additions to `graph/view/Graph/Graph.tsx` / `Graph.css` / `Port.tsx`, `graph/index.ts` exports, `graph/stories/Circuit.stories.tsx` | developer |
| `graph/model/circuit.test.ts`, `graph/stories/Circuit.behaviours.stories.tsx`, cord-delete cases in `graph/view/Graph/Graph.test.tsx` | test-engineer |

## Open questions

1. Should `connect` reject a second trace into an in pin that isn't a `param`
   pin, i.e. single-input signal in pins? The spec currently says no (8).
2. Should `kind` compatibility (e.g. audio into audio only) be a model rule,
   or stay the host's concern as in widgets today? The spec currently leaves
   it to the host.
