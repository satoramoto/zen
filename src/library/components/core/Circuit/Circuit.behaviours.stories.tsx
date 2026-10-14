// The Circuit binding and cord delete, exercised in the browser (docs/circuit-model.md,
// behaviours 21–26). Each story's `play` acts as a person would and reads the circuit printed
// beside the graph; the story names the behaviours it holds.
import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { Graph, GraphNode } from '../Graph/Graph';
import { Port } from '../Graph/Port';
import { pinsOf, type Circuit, type Pin, type Trace } from './circuit';
import { useCircuit } from './useCircuit';

const pin = (id: string, side: Pin['side'], kind?: string): Pin => ({ id, side, ...(kind ? { kind } : {}) });

/** osc → vcf, an lfo free to modulate, an amp, and a `gate` bus fed by the lfo with two taps. */
function sample(): Circuit {
  return {
    version: 1,
    board: 'board',
    modules: {
      board: {
        id: 'board',
        chips: [
          { id: 'lfo', type: 'lfo', x: 24, y: 200, pins: [pin('out', 'out', 'cv')] },
          { id: 'osc', type: 'osc', x: 24, y: 40, pins: [pin('fm', 'in', 'cv'), pin('out', 'out', 'audio')] },
          { id: 'vcf', type: 'filter', x: 260, y: 40, pins: [pin('in', 'in', 'audio'), pin('cut', 'in', 'cv'), pin('out', 'out', 'audio')] },
          { id: 'amp', type: 'amp', x: 500, y: 80, pins: [pin('in', 'in', 'audio'), pin('gain', 'in', 'cv')] },
        ],
        traces: [{ id: 't1', from: { chip: 'osc', pin: 'out' }, to: { chip: 'vcf', pin: 'in' }, kind: 'audio' }],
        inPins: [],
        outPins: [],
      },
    },
  };
}

function bussed(): Circuit {
  const c = sample();
  const board = c.modules.board;
  board.buses = [{ id: 'gate', kind: 'cv' }, { id: 'idle' }];
  const t = (id: string, from: Trace['from'], to: Trace['to'], kind?: string): Trace => ({ id, from, to, ...(kind ? { kind } : {}) });
  board.traces.push(
    t('src', { chip: 'lfo', pin: 'out' }, { bus: 'gate' }, 'cv'),
    t('tapCut', { bus: 'gate' }, { chip: 'vcf', pin: 'cut' }, 'cv'),
    t('tapGain', { bus: 'gate' }, { chip: 'amp', pin: 'gain' }, 'cv'),
    // A tap on a bus with no source draws nothing yet (17c).
    t('orphan', { bus: 'idle' }, { chip: 'osc', pin: 'fm' }),
  );
  return c;
}

/**
 * A host holding the circuit in state, bound to `Graph` by `useCircuit`, and printing what it
 * holds: the circuit as JSON and how many times `onChange` has fired.
 */
function Harness({ initial, deletable = true }: { initial: Circuit; deletable?: boolean }) {
  const [circuit, setCircuit] = useState(initial);
  const [changes, setChanges] = useState(0);
  const next = useRef(0);
  const binding = useCircuit(
    circuit,
    'board',
    (c) => {
      setCircuit(c);
      setChanges((n) => n + 1);
    },
    { newTraceId: () => `new${++next.current}` },
  );
  const board = circuit.modules[circuit.board];
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Text role="caption" tone="muted" data-testid="changes">
        Changes: {changes}
      </Text>
      <div style={{ height: 'calc(var(--space-6) * 12)', color: 'var(--text-1)' }}>
        <Graph
          label="Circuit"
          cords={binding.cords}
          onConnect={binding.onConnect}
          onMove={binding.onMove}
          onDisconnect={deletable ? binding.onDisconnect : undefined}
        >
          {board.chips.map((chip) => (
            <GraphNode key={chip.id} id={chip.id} x={chip.x} y={chip.y}>
              <Surface layer="raised" border style={{ display: 'grid', gap: 'var(--space-1)', padding: 'var(--space-2)' }}>
                <div tabIndex={0} aria-label={`${chip.id}, arrow keys move`}>
                  <Text role="label">{chip.id}</Text>
                </div>
                {pinsOf(circuit, 'board', chip.id).map((p) => (
                  <Port key={`${p.side} ${p.id}`} id={binding.portKeyOf(chip.id, p.id)} side={p.side} label={`${chip.id} ${p.id}`} kind={p.kind} />
                ))}
              </Surface>
            </GraphNode>
          ))}
        </Graph>
      </div>
      <pre data-testid="circuit" style={{ maxHeight: 'calc(var(--space-6) * 8)', overflow: 'auto' }}>
        {JSON.stringify(circuit, null, 2)}
      </pre>
    </div>
  );
}

const meta: Meta = {
  title: 'Design OS/Components/Core/Circuit/Behaviours',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
};
export default meta;

// ---------------------------------------------------------------------------------------------
// Readers shared by the plays.

type Root = HTMLElement;
const held = (root: Root): Circuit => JSON.parse(within(root).getByTestId('circuit').textContent ?? '{}');
const traceIds = (root: Root) => held(root).modules.board.traces.map((t) => t.id).sort();
const changes = (root: Root) => within(root).getByTestId('changes').textContent;
const cords = (root: Root) => Array.from(root.querySelectorAll<SVGElement>('[data-part="cord"]:not([data-pending])'));
const portNamed = (root: Root, name: string) => within(root).getByRole('button', { name });

/** Keyboard connect: Enter on one port, Enter on the other. */
async function patch(root: Root, a: string, b: string) {
  portNamed(root, a).focus();
  await userEvent.keyboard('{Enter}');
  portNamed(root, b).focus();
  await userEvent.keyboard('{Enter}');
}

/** A click on a cord. The cord layer may not take pointer events in CSS, so that check is off. */
async function clickCord(cord: Element) {
  await userEvent.setup({ pointerEventsCheck: 0 }).click(cord);
}

/** 25: rendering alone never calls onChange. */
async function untouched(root: Root) {
  await waitFor(() => expect(cords(root).length).toBeGreaterThan(0));
  expect(changes(root)).toBe('Changes: 0');
}

// ---------------------------------------------------------------------------------------------

/** 21: one cord per flattened trace; bus taps draw from the bus's source; an orphan tap draws nothing. 25. */
export const CordsFromTraces: StoryObj = {
  name: '21 · cords from traces and bus taps',
  render: () => <Harness initial={bussed()} />,
  play: async ({ canvasElement }) => {
    await untouched(canvasElement);
    // t1, tapCut, tapGain: the source trace and the orphan tap draw no cord of their own.
    await waitFor(() => expect(cords(canvasElement)).toHaveLength(3));
    expect(cords(canvasElement).filter((c) => c.getAttribute('data-kind') === 'cv')).toHaveLength(2);
    expect(cords(canvasElement).filter((c) => c.getAttribute('data-kind') === 'audio')).toHaveLength(1);
  },
};

/** 22: a keyboard connect, inlet first or outlet first, adds one trace with a fresh id. 21, 25. */
export const Connect: StoryObj = {
  name: '22 · connect',
  render: () => <Harness initial={sample()} />,
  play: async ({ canvasElement }) => {
    await untouched(canvasElement);
    await patch(canvasElement, 'lfo out', 'osc fm');
    await waitFor(() => expect(changes(canvasElement)).toBe('Changes: 1'));
    const added = held(canvasElement).modules.board.traces.find((t) => t.id === 'new1');
    expect(added).toMatchObject({ from: { chip: 'lfo', pin: 'out' }, to: { chip: 'osc', pin: 'fm' } });
    await waitFor(() => expect(cords(canvasElement)).toHaveLength(2));
    // Inlet first is normalised by the graph; a second trace into an in pin is allowed (8).
    await patch(canvasElement, 'vcf in', 'lfo out');
    await waitFor(() => expect(changes(canvasElement)).toBe('Changes: 2'));
    expect(traceIds(canvasElement)).toEqual(['new1', 'new2', 't1']);
    await waitFor(() => expect(cords(canvasElement)).toHaveLength(3));
  },
};

/** 22: refused connects change nothing: a same-side gesture, and a self-loop that `connect` throws on. */
export const RefusedConnect: StoryObj = {
  name: '22 · refused connect changes nothing',
  render: () => <Harness initial={sample()} />,
  play: async ({ canvasElement }) => {
    await untouched(canvasElement);
    const before = held(canvasElement);
    // In pin to in pin: the graph refuses the landing.
    await patch(canvasElement, 'amp in', 'vcf in');
    // Out pin to an in pin on the same chip: connect throws self-loop, so onChange never fires.
    await patch(canvasElement, 'vcf out', 'vcf cut');
    expect(changes(canvasElement)).toBe('Changes: 0');
    expect(held(canvasElement)).toEqual(before);
    expect(cords(canvasElement)).toHaveLength(1);
  },
};

/** 23: moving a chip by keyboard writes its new x and y, and only those. 25. */
export const Move: StoryObj = {
  name: '23 · move',
  render: () => <Harness initial={sample()} />,
  play: async ({ canvasElement }) => {
    await untouched(canvasElement);
    const before = held(canvasElement);
    within(canvasElement).getByLabelText('amp, arrow keys move').focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(changes(canvasElement)).toBe('Changes: 1'));
    const expected = structuredClone(before);
    const amp = expected.modules.board.chips.find((c) => c.id === 'amp')!;
    amp.x += 8;
    expect(held(canvasElement)).toEqual(expected);
  },
};

/** 26 and 24: a clicked cord is selected; Delete removes its trace. Backspace too, and keyboard focus selects. */
export const SelectThenDelete: StoryObj = {
  name: '26 · select then delete',
  render: () => <Harness initial={bussed()} />,
  play: async ({ canvasElement }) => {
    await untouched(canvasElement);
    await waitFor(() => expect(cords(canvasElement)).toHaveLength(3));
    // No selection yet: Delete does nothing.
    await userEvent.keyboard('{Delete}');
    expect(changes(canvasElement)).toBe('Changes: 0');

    // Click the audio cord (t1), then Delete.
    const t1 = cords(canvasElement).find((c) => c.getAttribute('data-kind') === 'audio')!;
    await clickCord(t1);
    await userEvent.keyboard('{Delete}');
    await waitFor(() => expect(changes(canvasElement)).toBe('Changes: 1'));
    expect(traceIds(canvasElement)).toEqual(['orphan', 'src', 'tapCut', 'tapGain']);
    await waitFor(() => expect(cords(canvasElement)).toHaveLength(2));

    // A tap's cord deletes that tap only; the bus and its source stay. Backspace this time.
    await clickCord(cords(canvasElement)[0]);
    await userEvent.keyboard('{Backspace}');
    await waitFor(() => expect(changes(canvasElement)).toBe('Changes: 2'));
    expect(traceIds(canvasElement)).toHaveLength(3);
    expect(traceIds(canvasElement)).toEqual(expect.arrayContaining(['orphan', 'src']));
    await waitFor(() => expect(cords(canvasElement)).toHaveLength(1));

    // Keyboard: the last cord takes focus, which selects it; Delete removes it.
    const last = cords(canvasElement)[0];
    const focusable = (last.closest('[data-part="cords"] [tabindex]') ?? last) as SVGElement;
    expect(focusable.getAttribute('tabindex')).not.toBeNull();
    focusable.focus();
    await userEvent.keyboard('{Delete}');
    await waitFor(() => expect(changes(canvasElement)).toBe('Changes: 3'));
    expect(traceIds(canvasElement)).toEqual(['orphan', 'src']);
    await waitFor(() => expect(cords(canvasElement)).toHaveLength(0));
  },
};

/** 26: Escape clears the selection, so a later Delete removes nothing. */
export const EscapeClearsSelection: StoryObj = {
  name: '26 · Escape clears the selection',
  render: () => <Harness initial={sample()} />,
  play: async ({ canvasElement }) => {
    await untouched(canvasElement);
    await clickCord(cords(canvasElement)[0]);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Delete}');
    await userEvent.keyboard('{Backspace}');
    expect(changes(canvasElement)).toBe('Changes: 0');
    expect(traceIds(canvasElement)).toEqual(['t1']);
    expect(cords(canvasElement)).toHaveLength(1);
  },
};

/** 26: without `onDisconnect`, cords behave as before: not focusable, and Delete removes nothing. */
export const NoDisconnectCannotDelete: StoryObj = {
  name: '26 · without onDisconnect, no delete',
  render: () => <Harness initial={sample()} deletable={false} />,
  play: async ({ canvasElement }) => {
    await untouched(canvasElement);
    const cord = cords(canvasElement)[0];
    expect(cord.closest('[data-part="cords"] [tabindex]')).toBeNull();
    expect(cord.querySelector('[tabindex]')).toBeNull();
    await clickCord(cord);
    await userEvent.keyboard('{Delete}');
    await userEvent.keyboard('{Backspace}');
    expect(changes(canvasElement)).toBe('Changes: 0');
    expect(traceIds(canvasElement)).toEqual(['t1']);
    // Connecting still works as before.
    await patch(canvasElement, 'osc out', 'amp in');
    await waitFor(() => expect(changes(canvasElement)).toBe('Changes: 1'));
  },
};
