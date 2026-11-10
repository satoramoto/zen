import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Graph, GraphNode, cordInk, cordPath, type GraphView } from './Graph';
import { Port } from './Port';

function Patch(props: { onConnect?: (from: string, to: string) => void; onMove?: (id: string, x: number, y: number) => void }) {
  return (
    <Graph label="Patch" {...props}>
      <GraphNode id="a" x={10} y={20}>
        <div tabIndex={0}>A head</div>
        <Port id="a/out" side="out" label="A out" />
        <Port id="a/out2" side="out" label="A out 2" />
      </GraphNode>
      <GraphNode id="b" x={200} y={20}>
        <div tabIndex={0}>B head</div>
        <Port id="b/in" side="in" label="B in" />
      </GraphNode>
    </Graph>
  );
}

const port = (name: string) => screen.getByRole('button', { name });
const enter = (el: HTMLElement) => fireEvent.keyDown(el, { key: 'Enter' });

afterEach(() => vi.restoreAllMocks());

describe('cordPath', () => {
  it('is a cubic leaving the outlet rightward and reaching the inlet from the left', () => {
    expect(cordPath({ x: 0, y: 0 }, { x: 200, y: 50 })).toBe('M 0 0 C 100 0, 100 50, 200 50');
  });
  it('reaches at least 30 units, even backwards', () => {
    expect(cordPath({ x: 100, y: 0 }, { x: 80, y: 10 })).toBe('M 100 0 C 130 0, 50 10, 80 10');
  });
  it('inks a kind with its own property, falling back to --lib-cord', () => {
    expect(cordInk('audio')).toBe('var(--lib-cord-audio, var(--lib-cord))');
    expect(cordInk('a b')).toBe('var(--lib-cord-a-b, var(--lib-cord))');
    expect(cordInk('')).toBe('var(--lib-cord)');
  });
});

describe('Graph parts', () => {
  it('marks the viewport, content, cords and nodes', () => {
    const { container } = render(<Patch />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('lib-graph');
    expect(root).toHaveAttribute('data-part', 'viewport');
    expect(screen.getByRole('group', { name: 'Patch' })).toBe(root);
    expect(root.querySelector('[data-part="content"] > [data-part="cords"]')).not.toBeNull();
    expect(root.querySelectorAll('[data-part="node"]')).toHaveLength(2);
  });

  it('draws a cord the host passes, with its kind', () => {
    const { container } = render(
      <Graph cords={[{ from: 'o', to: 'i', kind: 'audio' }, { from: 'o', to: 'missing' }]}>
        <GraphNode id="n" x={0} y={0}>
          <Port id="o" side="out" />
          <Port id="i" side="in" />
        </GraphNode>
      </Graph>,
    );
    const cords = container.querySelectorAll('[data-part="cord"]');
    expect(cords).toHaveLength(1);
    expect(cords[0]).toHaveAttribute('data-kind', 'audio');
  });
});

describe('connecting from the keyboard', () => {
  it('Enter, Enter connects outlet to inlet', () => {
    const onConnect = vi.fn();
    render(<Patch onConnect={onConnect} />);
    enter(port('A out'));
    expect(port('A out')).toHaveAttribute('data-pending');
    expect(port('B in')).toHaveAttribute('data-reach', 'open');
    expect(port('A out 2')).toHaveAttribute('data-reach', 'shut');
    enter(port('B in'));
    expect(onConnect).toHaveBeenCalledExactlyOnceWith('a/out', 'b/in');
    expect(port('A out')).not.toHaveAttribute('data-pending');
  });

  it('normalises an inlet-first gesture to (outlet, inlet)', () => {
    const onConnect = vi.fn();
    render(<Patch onConnect={onConnect} />);
    enter(port('B in'));
    expect(port('A out')).toHaveAttribute('data-reach', 'open');
    enter(port('A out'));
    expect(onConnect).toHaveBeenCalledExactlyOnceWith('a/out', 'b/in');
  });

  it('Escape drops the cord in flight', () => {
    const onConnect = vi.fn();
    render(<Patch onConnect={onConnect} />);
    enter(port('A out'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(port('A out')).not.toHaveAttribute('data-pending');
    // The next Enter arms again rather than landing.
    enter(port('B in'));
    expect(onConnect).not.toHaveBeenCalled();
    expect(port('B in')).toHaveAttribute('data-pending');
  });

  it('refuses a same-side landing and drops the cord', () => {
    const onConnect = vi.fn();
    render(<Patch onConnect={onConnect} />);
    enter(port('A out'));
    enter(port('A out 2'));
    expect(onConnect).not.toHaveBeenCalled();
    expect(port('A out')).not.toHaveAttribute('data-pending');
    expect(port('A out 2')).not.toHaveAttribute('data-pending');
  });
});

describe('moving a node', () => {
  it('arrow keys on the head emit onMove, 8 units or 1 with Shift', () => {
    const onMove = vi.fn();
    render(<Patch onMove={onMove} />);
    fireEvent.keyDown(screen.getByText('A head'), { key: 'ArrowRight' });
    expect(onMove).toHaveBeenLastCalledWith('a', 18, 20);
    fireEvent.keyDown(screen.getByText('A head'), { key: 'ArrowUp', shiftKey: true });
    expect(onMove).toHaveBeenLastCalledWith('a', 10, 19);
  });

  it('arrows on a port do not move the node, and the node does not move itself', () => {
    const onMove = vi.fn();
    render(<Patch onMove={onMove} />);
    fireEvent.keyDown(port('A out'), { key: 'ArrowLeft' });
    expect(onMove).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByText('B head'), { key: 'ArrowDown' });
    expect(onMove).toHaveBeenCalledExactlyOnceWith('b', 200, 28);
    expect(screen.getByText('B head').parentElement).toHaveStyle({ top: '20px' });
  });
});

describe('fit', () => {
  /** jsdom has no layout: give the viewport and each node a box, nodes boxed from their own left/top. */
  function boxes(width: number, height: number, node: { w: number; h: number }) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const part = this.dataset.part;
      if (part === 'viewport') return DOMRect.fromRect({ x: 0, y: 0, width, height });
      if (part === 'node') {
        const x = parseFloat(this.style.left);
        const y = parseFloat(this.style.top);
        return DOMRect.fromRect({ x, y, width: node.w, height: node.h });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
    });
  }

  function fitted(max?: number) {
    const view = createRef<GraphView>();
    const { container } = render(
      <Graph viewRef={view} minZoom={0.25}>
        <GraphNode id="a" x={100} y={50}>
          a
        </GraphNode>
        <GraphNode id="b" x={1900} y={950}>
          b
        </GraphNode>
      </Graph>,
    );
    act(() => view.current!.fit(max));
    const content = container.querySelector<HTMLElement>('[data-part="content"]')!;
    return { k: view.current!.scale(), content };
  }

  it('zooms out to frame every node, top-left aligned', () => {
    // Patch: 100..2000 x 50..1050 (1900 × 1000); viewport 1000 × 600 less 16 each side.
    boxes(1000, 600, { w: 100, h: 100 });
    const { k, content } = fitted();
    expect(k).toBeCloseTo(968 / 1900);
    expect(content.style.transform).toBe(`translate(${(16 - 100 * k) / k}px, ${(16 - 50 * k) / k}px)`);
  });

  it('clamps to minZoom', () => {
    boxes(200, 150, { w: 100, h: 100 });
    expect(fitted().k).toBe(0.25);
  });

  it('never zooms past 1 by default', () => {
    boxes(100000, 100000, { w: 100, h: 100 });
    expect(fitted().k).toBe(1);
  });

  it('honours max when given', () => {
    boxes(100000, 100000, { w: 100, h: 100 });
    expect(fitted(2).k).toBe(2);
  });
});
