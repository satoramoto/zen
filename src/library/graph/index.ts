// The graph: a node-graph view (`view/`) and the Circuit model it draws (`model/`,
// docs/circuit-model.md). Its own area, not a core control: a canvas, the faces its nodes wear and
// a data model with modules. Re-exported unchanged from the package root.

// The node graph and the device face a node wears (the lab editor's stage graph; APIs mirroring @openflow/widgets).
export { Graph, GraphNode, cordPath, cordInk, type GraphProps, type GraphNodeProps, type GraphCord, type GraphView, type PortSide } from './view/Graph/Graph';
/** The canvas layers: bus rails, zone frames, faced ports and cord words (labels, amounts). */
export { amountText, type GraphBus, type GraphZone, type GraphFace } from './view/Graph/Graph';
export { Port, type PortProps } from './view/Graph/Port';
export { Device, DevicePortRow, DeviceMore, type DeviceProps, type DevicePortRowProps, type DeviceMoreProps } from './view/Device/Device';
/** A port placed anywhere on a Device's outline (pin `placement`). */
export { DeviceEdge, type DeviceEdgeProps } from './view/Device/Device';
/** Where a graph view is among nested modules: a breadcrumb trail. */
export { GraphPath, type GraphPathProps, type GraphPathStep } from './view/GraphPath/GraphPath';
/** A node's whole face hung beside it at screen scale (ported from @openflow/widgets' Sheet; `Sheet` here is Modal's). */
export {
  NodeSheet,
  NodeSheetSection,
  NodeSheetRow,
  type NodeSheetProps,
  type NodeSheetPlace,
  type NodeSheetSectionProps,
  type NodeSheetRowProps,
} from './view/NodeSheet/NodeSheet';

// The Circuit model (docs/circuit-model.md): one plain-JSON circuit of modules, chips, pins, traces
// and buses, pure operations on it, and the hook that binds one module to the Graph above.
export {
  CircuitError,
  pinsOf,
  emptyCircuit,
  addModule,
  placeChip,
  removeChip,
  moveChip,
  connect,
  disconnect,
  validate,
  addBus,
  removeBus,
  flatten,
  type Json,
  type Face,
  type Pin,
  type Chip,
  type PinEnd,
  type BusEnd,
  type End,
  type Bus,
  type Trace,
  type ModulePin,
  type Control,
  type Zone,
  type Module,
  type Circuit,
  type CircuitErrorCode,
  type Issue,
} from './model/circuit';
export { useCircuit, type CircuitBinding } from './model/useCircuit';
