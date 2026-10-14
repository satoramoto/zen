import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { Surface } from '../../primitives/Surface';
import { Text } from '../../primitives/Text';
import { Device, DeviceMore, DevicePortRow } from '../view/Device/Device';
import { Graph, GraphNode, type GraphCord, type GraphView } from '../view/Graph/Graph';
import { Port } from '../view/Graph/Port';
import { NodeSheet, NodeSheetRow, NodeSheetSection, type NodeSheetPlace } from '../view/NodeSheet/NodeSheet';
import { Slider } from '../../components/core/Slider/Slider';
import { format } from '../../components/core/Param/format';
import type { Param } from '../../components/core/Param/param';
import { pinsOf, validate, type Chip, type Circuit, type Json, type Pin, type Trace } from '../model/circuit';
import { useCircuit, type CircuitBinding } from '../model/useCircuit';
import { CIRCUITS, KIND_HUE, PARAM_SPECS, SESSION_STATES, TYPE_NAMES, type SessionState } from './Circuit.fixtures';

// ---------------------------------------------------------------------------------------------
// Host concerns: names, inks, new-trace kinds, param edits. None of these are the model's.

/** How many params a chip's face shows before the rest fold under a `DeviceMore` line. */
const FACE_PARAMS = 2;

const nameOf = (chip: Chip) => (typeof chip.name === 'string' ? chip.name : (TYPE_NAMES[chip.type] ?? chip.id));

const isPinEnd = (end: Trace['from']): end is { chip: string; pin: string } => 'chip' in end;

/** A trace the binding made has no kind: give it its out pin's kind (or its bus's) so it's inked. */
function inkNewTraces(circuit: Circuit, module: string): Circuit {
  const m = circuit.modules[module];
  if (!m || m.traces.every((t) => t.kind !== undefined)) return circuit;
  const traces = m.traces.map((t) => {
    if (t.kind !== undefined) return t;
    const kind = isPinEnd(t.from)
      ? pinsOf(circuit, module, t.from.chip).find((p) => p.side === 'out' && p.id === (t.from as { pin: string }).pin)?.kind
      : (m.buses ?? []).find((b) => b.id === (t.from as { bus: string }).bus)?.kind;
    return kind === undefined ? t : { ...t, kind };
  });
  return { ...circuit, modules: { ...circuit.modules, [module]: { ...m, traces } } };
}

function setParam(circuit: Circuit, module: string, chip: string, key: string, value: Json): Circuit {
  const m = circuit.modules[module];
  const chips = m.chips.map((c) => (c.id === chip ? { ...c, params: { ...c.params, [key]: value } } : c));
  return { ...circuit, modules: { ...circuit.modules, [module]: { ...m, chips } } };
}

function setAmount(circuit: Circuit, module: string, trace: string, amount: number): Circuit {
  const m = circuit.modules[module];
  const clamped = Math.max(-1, Math.min(1, amount));
  const traces = m.traces.map((t) => (t.id === trace ? { ...t, amount: clamped } : t));
  return { ...circuit, modules: { ...circuit.modules, [module]: { ...m, traces } } };
}

/** A numeric param's range: its spec, else 0–1 (widened to hold the value). */
function specOf(key: string, value: number): Param {
  const spec = PARAM_SPECS[key];
  if (spec) return spec;
  return { kind: 'float', min: Math.min(0, value), max: Math.max(1, value), defaultValue: value, name: key };
}

const valueText = (key: string, value: Json): string =>
  typeof value === 'number' ? format(specOf(key, value), value) : typeof value === 'string' ? value : JSON.stringify(value);

/** `--lib-cord-<kind>: var(--hue-n)` for every kind, and `active` (the current state's way out) in the accent. */
const INKS = {
  ...Object.fromEntries(Object.entries(KIND_HUE).map(([kind, hue]) => [`--lib-cord-${kind}`, `var(--hue-${hue})`])),
  '--lib-cord-active': 'var(--accent)',
} as CSSProperties;

// ---------------------------------------------------------------------------------------------
// The chip face

interface FaceProps {
  circuit: Circuit;
  module: string;
  chip: Chip;
  binding: CircuitBinding;
  connected: ReadonlySet<string>;
  selected: boolean;
  onSelect(): void;
  more: boolean;
  onMore(next: boolean): void;
}

function ChipFace({ circuit, module, chip, binding, connected, selected, onSelect, more, onMore }: FaceProps) {
  const pins = pinsOf(circuit, module, chip.id);
  const params = Object.entries(chip.params ?? {});
  const port = (p: Pin) => {
    const key = binding.portKeyOf(chip.id, p.id);
    return (
      <Port
        key={`${p.side}:${p.id}`}
        id={key}
        side={p.side}
        label={p.label ?? p.id}
        showLabel={p.label !== undefined}
        kind={p.kind}
        hue={p.kind ? KIND_HUE[p.kind] : undefined}
        connected={connected.has(`${p.side}:${key}`)}
      />
    );
  };
  // A param pin whose id names a param sits on that param's line; the rest go on the rails.
  const rowPins = pins.filter((p) => p.side === 'in' && p.param && chip.params && p.id in chip.params);
  const onRows = new Set(rowPins.map((p) => p.id));
  const inlets = pins.filter((p) => p.side === 'in' && !onRows.has(p.id));
  const outlets = pins.filter((p) => p.side === 'out');
  const loose = params.filter(([k]) => !onRows.has(k));
  const shown = loose.slice(0, FACE_PARAMS);
  const hidden = loose.slice(FACE_PARAMS);
  const line = ([k, v]: [string, Json]) => (
    <Text key={k} role="caption" tone="secondary" truncate>
      {k} {valueText(k, v)}
    </Text>
  );
  const body: ReactNode[] = [];
  if (chip.module !== undefined)
    body.push(
      <Text key="module" role="caption" tone="muted" truncate>
        module · {chip.module}
      </Text>,
    );
  body.push(...shown.map(line));
  // Opening grows the face in place; the sheet shows everything anyway.
  if (more) body.push(...hidden.map(line));
  if (hidden.length > 0)
    body.push(
      <DeviceMore key="more" open={more} onToggle={onMore} label={more ? 'Show fewer params' : `${hidden.length} more params`}>
        {more ? 'fewer' : `${hidden.length} more`}
      </DeviceMore>,
    );
  return (
    <Device
      name={nameOf(chip)}
      title={`${chip.type} · ${chip.id}`}
      selected={selected}
      onSelect={onSelect}
      inlets={inlets.length ? inlets.map(port) : undefined}
      outlets={outlets.length ? outlets.map(port) : undefined}
      portRows={
        rowPins.length
          ? rowPins.map((p) => (
              <DevicePortRow key={p.id} inlet={port(p)}>
                {`${p.label ?? p.id} ${valueText(p.id, chip.params![p.id])}`}
              </DevicePortRow>
            ))
          : undefined
      }
    >
      {body.length ? <div style={{ display: 'grid', gap: 'var(--space-1)', minWidth: 0 }}>{body}</div> : undefined}
    </Device>
  );
}

// ---------------------------------------------------------------------------------------------
// The workflow: one module of a circuit in state, drawn through `useCircuit`, its JSON beside it.

interface WorkflowProps {
  initial: Circuit;
  label: string;
  /** Which module to draw; default the board. */
  module?: string;
  /** A chip drawn selected whatever is clicked, its outgoing cords in the accent (a machine's state). */
  current?: string;
}

function Workflow({ initial, label, module, current }: WorkflowProps) {
  const [circuit, setCircuit] = useState(initial);
  const mod = module && circuit.modules[module] ? module : circuit.board;
  const onChange = useCallback((next: Circuit) => setCircuit(inkNewTraces(next, mod)), [mod]);
  const binding = useCircuit(circuit, mod, onChange);
  const [selected, setSelected] = useState<string | null>(null);
  const [more, setMore] = useState<Record<string, boolean>>({});
  const [parked, setParked] = useState<NodeSheetPlace | null>(null);
  const anchor = useRef<HTMLDivElement | null>(null);
  const view = useRef<GraphView>(null);
  const m = circuit.modules[mod];

  // Frame the module once it's drawn, and again when another module is shown.
  useEffect(() => {
    setSelected(null);
    const id = requestAnimationFrame(() => view.current?.fit());
    return () => cancelAnimationFrame(id);
  }, [mod]);

  const cords: GraphCord[] = useMemo(
    () => (current ? binding.cords.map((c) => (c.from.startsWith(`${current}/`) ? { ...c, kind: 'active' } : c)) : binding.cords),
    [binding.cords, current],
  );
  const connected = useMemo(() => new Set(binding.cords.flatMap((c) => [`out:${c.from}`, `in:${c.to}`])), [binding.cords]);
  const issues = useMemo(() => validate(circuit), [circuit]);
  const chip = selected ? m.chips.find((c) => c.id === selected) : undefined;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'stretch', color: 'var(--text-1)' }}>
      <div style={{ ...INKS, flex: '999 1 calc(var(--space-6) * 20)', minWidth: 0, height: 'calc(var(--space-6) * 17)' }}>
        <Graph
          label={label}
          viewRef={view}
          cords={cords}
          onConnect={binding.onConnect}
          onMove={binding.onMove}
          onDisconnect={binding.onDisconnect}
          onClearSelection={() => setSelected(null)}
        >
          {m.chips.map((c) => (
            <GraphNode key={c.id} id={c.id} x={c.x} y={c.y}>
              <div ref={c.id === selected ? anchor : undefined} style={{ '--lib-device-width': 'calc(var(--space-6) * 5)' } as CSSProperties}>
                <ChipFace
                  circuit={circuit}
                  module={mod}
                  chip={c}
                  binding={binding}
                  connected={connected}
                  selected={c.id === selected || c.id === current}
                  onSelect={() => setSelected((s) => (s === c.id ? null : c.id))}
                  more={!!more[c.id]}
                  onMore={(next) => setMore((all) => ({ ...all, [c.id]: next }))}
                />
              </div>
            </GraphNode>
          ))}
        </Graph>
        {chip && (
          <ChipSheet
            key={chip.id}
            circuit={circuit}
            module={mod}
            chip={chip}
            anchor={anchor}
            parked={parked}
            onPark={setParked}
            onDismiss={() => setSelected(null)}
            onParam={(key, value) => setCircuit((c) => setParam(c, mod, chip.id, key, value))}
            onAmount={(trace, amount) => setCircuit((c) => setAmount(c, mod, trace, amount))}
          />
        )}
      </div>
      <Surface
        layer="base"
        border
        style={{
          flex: '1 1 calc(var(--space-6) * 9)',
          minWidth: 0,
          height: 'calc(var(--space-6) * 17)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gap: 'var(--space-1)',
          padding: 'var(--space-2)',
        }}
      >
        <Text role="caption" tone={issues.length ? 'danger' : 'success'} data-testid="validity">
          {issues.length ? `${issues.length} issues` : 'valid'} · module {mod}
        </Text>
        <pre style={{ margin: 0, overflow: 'auto', minHeight: 0 }} data-testid="circuit-json">
          <Text role="code" tone="secondary">
            {JSON.stringify(circuit, null, 2)}
          </Text>
        </pre>
      </Surface>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The sheet: a chip's params and incoming traces, hung beside it.

interface SheetProps {
  circuit: Circuit;
  module: string;
  chip: Chip;
  anchor: RefObject<HTMLDivElement | null>;
  parked: NodeSheetPlace | null;
  onPark(at: NodeSheetPlace | null): void;
  onDismiss(): void;
  onParam(key: string, value: Json): void;
  onAmount(trace: string, amount: number): void;
}

function ChipSheet({ circuit, module, chip, anchor, parked, onPark, onDismiss, onParam, onAmount }: SheetProps) {
  const m = circuit.modules[module];
  const chipName = (id: string) => {
    const c = m.chips.find((x) => x.id === id);
    return c ? nameOf(c) : id;
  };
  const sourceName = (t: Trace) => (isPinEnd(t.from) ? chipName(t.from.chip) : ((m.buses ?? []).find((b) => b.id === (t.from as { bus: string }).bus)?.label ?? 'bus'));
  const incoming = m.traces.filter((t) => isPinEnd(t.to) && t.to.chip === chip.id);
  /** The modulation landing on a param: a modulation trace into the param pin of that name. */
  const driverOf = (key: string) => incoming.find((t) => t.role === 'modulation' && isPinEnd(t.to) && t.to.pin === key);
  const params = Object.entries(chip.params ?? {});
  return (
    <NodeSheet
      name={nameOf(chip)}
      about={`${chip.type}${chip.module ? ` · module ${chip.module}` : ''}`}
      anchor={anchor}
      parked={parked}
      onPark={onPark}
      onDismiss={onDismiss}
      label={`${nameOf(chip)} settings`}
    >
      {params.length > 0 && (
        <NodeSheetSection heading="Params">
          {params.map(([key, value]) => {
            const drive = driverOf(key);
            return (
              <NodeSheetRow key={key} name={key}>
                {typeof value === 'number' ? (
                  <Slider
                    param={specOf(key, value)}
                    value={value}
                    onChange={(next) => onParam(key, next)}
                    layout="row"
                    name=""
                    label={key}
                    length="auto"
                    {...(drive ? { driver: sourceName(drive), depth: drive.amount ?? 0, onDepth: (next: number) => onAmount(drive.id, next) } : {})}
                  />
                ) : (
                  <Text role="caption" tone="secondary" truncate>
                    {valueText(key, value)}
                  </Text>
                )}
              </NodeSheetRow>
            );
          })}
        </NodeSheetSection>
      )}
      <NodeSheetSection heading="Incoming">
        {incoming.length === 0 ? (
          <Text role="caption" tone="muted">
            Nothing feeds this chip.
          </Text>
        ) : (
          incoming.map((t) => (
            <NodeSheetRow
              key={t.id}
              name={(t.to as { pin: string }).pin}
              driver={t.role === 'modulation' ? sourceName(t) : undefined}
              title={t.id}
            >
              <Text role="caption" tone="secondary" truncate>
                {`from ${sourceName(t)}${t.label ? ` · ${t.label}` : ''}${t.kind ? ` · ${t.kind}` : ''}${t.amount !== undefined ? ` · ${t.amount}` : ''}`}
              </Text>
            </NodeSheetRow>
          ))
        )}
      </NodeSheetSection>
    </NodeSheet>
  );
}

// ---------------------------------------------------------------------------------------------

const meta: Meta = {
  title: 'Design OS/Graph/Circuit/Samples',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
};
export default meta;

const COMMON =
  'Drag a chip to move it, drag from an out port to an in port to connect (the new trace takes its out pin\'s kind), click a cord and press Delete to remove it, click a chip\'s name for its sheet. The `Circuit` JSON beside the graph is the live state.';

export const Patch: StoryObj = {
  render: () => <Workflow initial={CIRCUITS.patch} label="Patch" />,
  parameters: {
    docs: {
      description: {
        story: `Oscillator → filter → out, with an LFO modulating the filter's cutoff (a \`role: 'modulation'\` trace into a \`param\` pin, \`amount\` 0.4). The filter's sheet shows the cutoff slider with the LFO as its driver and the amount as its depth (shift-drag edits the trace's amount). ${COMMON} Data only for now: the modulation draws as an ordinary cord, the \`controls\` entry and \`layout: 'lr'\` aren't drawn.`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const cords = () => canvasElement.querySelectorAll('[data-part="cord"]:not([data-pending])').length;
    await waitFor(() => expect(cords()).toBe(3));
    await waitFor(() => expect(canvasElement.querySelector('[data-testid="validity"]')).toHaveTextContent('valid'));
  },
};

export const Diffusion: StoryObj = {
  render: () => <Workflow initial={CIRCUITS.diffusion} label="Diffusion" />,
  parameters: {
    docs: {
      description: {
        story: `A ComfyUI-like graph: checkpoint, positive and negative prompts, empty latent, sampler, VAE decode, then a reusable \`upscale\` module placed twice (each instance shows the module's pins), preview and save. The checkpoint's VAE feeds a \`VAE\` bus that decode and both upscales tap. ${COMMON} Data only for now: the bus draws no rail (its taps draw as cords straight from the checkpoint's VAE out), the zones aren't framed, \`routing: 'trace'\` draws as curves, and the upscale instances can't be entered.`,
      },
    },
  },
};

export const SessionLifecycle: StoryObj<{ mode: SessionState }> = {
  args: { mode: 'working' },
  argTypes: { mode: { control: 'select', options: SESSION_STATES } },
  render: ({ mode }) => <Workflow initial={CIRCUITS.session} label="Session lifecycle" current={mode} />,
  parameters: {
    docs: {
      description: {
        story: `The syn job lifecycle as a state machine: asked → routed → working → checked → tested → committed → reviewed → pr_open → ci → merged → pulled → done, with checked, tested, reviewed and ci failing into fixing, which retries into working or gives up into failed. The \`mode\` control picks the current state: its chip is drawn selected and its ways out in the accent; failure traces carry kind \`fail\`. ${COMMON} Data only for now: trace labels (pass, fail, retry, give up) aren't drawn, back edges loop as left-to-right curves, the zones aren't framed and \`routing: 'trace'\` draws as curves.`,
      },
    },
  },
};

export const TddModule: StoryObj<{ module: 'board' | 'feature' | 'tdd' }> = {
  args: { module: 'board' },
  argTypes: { module: { control: 'select', options: ['board', 'feature', 'tdd'] } },
  render: ({ module }) => <Workflow initial={CIRCUITS.tdd} label="TDD module" module={module} />,
  parameters: {
    docs: {
      description: {
        story: `Modules three deep: the board places a \`feature\` instance (plan → tdd → review → merge), which places a \`tdd\` instance (contract → developer and test engineer in parallel → run against each other; module pins \`spec\` in, \`result\` out). The \`module\` control draws each level, standing in for entering a module. ${COMMON} Data only for now: entering an instance from the canvas, breadcrumbs, the \`parallel\` zone frame and the \`pass\` label.`,
      },
    },
  },
};

export const BrainBoard: StoryObj = {
  render: () => <Workflow initial={CIRCUITS.brain} label="Brain board" />,
  parameters: {
    docs: {
      description: {
        story: `Threads as chips, wired by what they do to each other (\`feeds\`, \`dogfoods\`, \`blocks\`; a blocking trace has kind \`blocks\`), and three assistants tapping a \`Base context\` bus fed by the lexicon. ${COMMON} Data only for now: the trace labels, the bus rail (taps draw as cords from the lexicon), the assistants and threads zones.`,
      },
    },
  },
};

export const RootSystem: StoryObj = {
  render: () => <Workflow initial={CIRCUITS.root} label="Root system" />,
  parameters: {
    docs: {
      description: {
        story: `A centre chip whose traces flow outward in every direction (above, below, left, right and between), each pin's \`placement\` naming the face that points at its other end, with \`layout: 'free'\` (the radial shape is in the stored positions) and \`routing: 'trace'\` as the stated intent. ${COMMON} Data only for now: pin placement (every port sits on the left or right rail, so traces to the left and above loop round) and circuit-board routing.`,
      },
    },
  },
};
