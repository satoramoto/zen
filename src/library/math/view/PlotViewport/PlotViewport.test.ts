import { describe, expect, it, vi } from 'vitest';
import { isNode, type Node } from '../../../view/Tree.model';
import { plotViewportHandlers, plotViewportView, projectPoints, zoomAt, clientToPlotCoordinates, type PlotCamera, type PlotPoint } from './PlotViewport.model';

const camera: PlotCamera = { zoom: 1, x: 0, y: 0, rotation: 35 };
const points: PlotPoint[] = [
  { id: '1', x: 0, y: 0, z: 0 },
  { id: '36', x: 5, y: 3, z: 0 },
  { id: '100', x: 9, y: 9, z: 0 },
  { id: '400', x: 9, y: 9, z: 3 },
];
function descendants(node: Node): Node[] {
  return [node, ...(node.children ?? []).flatMap(child => child !== null && isNode(child) ? descendants(child) : [])];
}
function pointerSurface() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('data-point-id', '36');
  const mark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  group.append(mark);
  svg.append(group);
  Object.defineProperty(svg, 'setPointerCapture', { value: vi.fn() });
  Object.defineProperty(svg, 'focus', { value: vi.fn() });
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({ width: 500, height: 250, x: 0, y: 0, top: 0, left: 0, bottom: 250, right: 500, toJSON: () => ({}) });
  const event = (clientX: number, clientY: number) => ({ currentTarget: svg, target: mark, clientX, clientY, pointerId: 1, button: 0 } as unknown as PointerEvent);
  return { svg, event };
}

describe('PlotViewport projection model', () => {
  it('keeps surviving objects stationary when filtering against fixed domain bounds', () => {
    for (const volume of [false, true]) for (const rotation of [0, 35, 90]) {
      const all = projectPoints(points, rotation, volume);
      const filtered = projectPoints([points[1]!], rotation, volume, points);
      expect(filtered[0]).toEqual(all.find(point => point.id === '36'));
      const slice = projectPoints(points.filter(point => point.z === 0), rotation, volume, points);
      for (const point of slice) expect(point).toEqual(all.find(item => item.id === point.id));
    }
  });
  it('projects empty and singleton domains without non-finite coordinates', () => {
    expect(projectPoints([], 35, true)).toEqual([]);
    const singleton = projectPoints([{ id: 'one', x: -5, y: -10, z: 2 }], 90, true);
    expect(Number.isFinite(singleton[0]!.px)).toBe(true);
    expect(Number.isFinite(singleton[0]!.py)).toBe(true);
  });
  it('keeps selection visible independently of fill and outline opacity', () => {
    const tree = plotViewportView({ camera, selectedId: '36', points: [{ ...points[1]!, opacity: 0, outline: true, outlineOpacity: 0.3 }] });
    const nodes = descendants(tree);
    const group = nodes.find(node => node.attrs?.['data-point-id'] === '36')!;
    const fill = nodes.find(node => node.attrs?.class === 'zen-math-viewport__point')!;
    const outline = nodes.find(node => node.attrs?.class === 'zen-math-viewport__outline')!;
    const selection = nodes.find(node => node.attrs?.class === 'zen-math-viewport__selection')!;
    expect(group.attrs?.style).toBeUndefined();
    expect(fill.attrs?.opacity).toBe('0');
    expect(outline.attrs?.opacity).toBe('0.3');
    expect(selection.attrs?.opacity).toBeUndefined();
    expect(selection.attrs?.style).toBeUndefined();
  });
});

describe('PlotViewport gesture model', () => {
  it('maps pointer distances through square-viewBox letterboxing and clamps exported camera bounds', () => {
    const { event } = pointerSurface();
    const onCameraChange = vi.fn(), onSelect = vi.fn();
    const handlers = plotViewportHandlers({ camera, points, onCameraChange, onSelect });
    handlers.down!(event(10, 10));
    handlers.move!(event(35, 35));
    expect(onCameraChange).toHaveBeenLastCalledWith({ ...camera, x: 100, y: 100 });
    handlers.move!(event(100000, -100000));
    expect(onCameraChange).toHaveBeenLastCalledWith({ ...camera, x: 10000, y: -10000 });
    handlers.up!(event(100000, -100000));
    expect(onSelect).not.toHaveBeenCalled();
    onCameraChange.mockClear();
    handlers.move!(event(30, 30));
    expect(onCameraChange).not.toHaveBeenCalled();
  });
  it('selects a clicked mark but does not select after cancellation', () => {
    const { event } = pointerSurface();
    const onSelect = vi.fn();
    const handlers = plotViewportHandlers({ camera, points, onSelect });
    handlers.down!(event(20, 20));
    handlers.up!(event(20, 20));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('36');
    onSelect.mockClear();
    handlers.down!(event(20, 20));
    handlers.cancel!(event(20, 20));
    handlers.up!(event(20, 20));
    expect(onSelect).not.toHaveBeenCalled();
  });
  it('navigates visible identities, clamps zoom, and fits without changing rotation', () => {
    const onSelect = vi.fn(), onCameraChange = vi.fn();
    const handlers = plotViewportHandlers({ points, camera: { ...camera, zoom: 64, x: 80, y: -50 }, selectedId: '36', onSelect, onCameraChange });
    const next = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    handlers.key!(next);
    expect(next.defaultPrevented).toBe(true);
    expect(onSelect).toHaveBeenLastCalledWith('100');
    handlers.key!(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(onSelect).toHaveBeenLastCalledWith('1');
    handlers.key!(new KeyboardEvent('keydown', { key: '+' }));
    expect(onCameraChange).toHaveBeenLastCalledWith({ ...camera, zoom: 64, x: 80, y: -50 });
    handlers.key!(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(onCameraChange).toHaveBeenLastCalledWith(camera);
    const low = plotViewportHandlers({ points, camera: { ...camera, zoom: 0.25 }, onCameraChange });
    low.key!(new KeyboardEvent('keydown', { key: '-' }));
    expect(onCameraChange).toHaveBeenLastCalledWith({ ...camera, zoom: 0.25 });
  });
  it('does not fabricate selection for an empty scene or intercept unrelated keys', () => {
    const onSelect = vi.fn(), onCameraChange = vi.fn();
    const handlers = plotViewportHandlers({ points: [], camera, onSelect, onCameraChange });
    handlers.key!(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    const ordinary = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    handlers.key!(ordinary);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onCameraChange).not.toHaveBeenCalled();
    expect(ordinary.defaultPrevented).toBe(false);
  });
});


describe('PlotViewport inspection and anchored zoom', () => {
  it('removes horizontal and vertical letterboxing and preserves anchored world position', () => {
    expect(clientToPlotCoordinates(175, 100, {left:0,top:0,width:500,height:250})).toEqual({x:200,y:400});
    expect(clientToPlotCoordinates(100, 175, {left:0,top:0,width:250,height:500})).toEqual({x:400,y:200});
    const before={...camera,zoom:2,x:70,y:-45},anchor={x:200,y:300};
    const after=zoomAt(before,5,anchor);
    expect((anchor.x-500-before.x)/before.zoom).toBeCloseTo((anchor.x-500-after.x)/after.zoom);
    expect((anchor.y-500-before.y)/before.zoom).toBeCloseTo((anchor.y-500-after.y)/after.zoom);
    expect(zoomAt(camera,100).zoom).toBe(64);
  });
  it('inspects transient hover without selecting and clears on leave', () => {
    const {event}=pointerSurface(),onHover=vi.fn(),onSelect=vi.fn(),onClearSelection=vi.fn();
    const handlers=plotViewportHandlers({camera,points,selectedId:'100',onHover,onSelect,onClearSelection});
    handlers.move!(event(20,20));
    expect(onHover).toHaveBeenLastCalledWith('36');
    handlers.leave!(event(20,20));
    expect(onHover).toHaveBeenLastCalledWith(null);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClearSelection).not.toHaveBeenCalled();
    handlers.key!(new KeyboardEvent('keydown',{key:'Escape'}));
    expect(onClearSelection).toHaveBeenCalledOnce();
  });
  it('never pins after a drag even if the pointer returns to its origin', () => {
    const {event}=pointerSurface(),onSelect=vi.fn();
    const handlers=plotViewportHandlers({camera,points,onSelect});
    handlers.down!(event(20,20));handlers.move!(event(50,50));handlers.move!(event(20,20));handlers.up!(event(20,20));
    expect(onSelect).not.toHaveBeenCalled();
  });
  it('accumulates wheel bursts against the latest camera and prevents scrolling', () => {
    const {svg}=pointerSurface(),onCameraChange=vi.fn(),preventDefault=vi.fn();
    const handlers=plotViewportHandlers({camera,points,onCameraChange});
    const wheel={currentTarget:svg,clientX:250,clientY:125,deltaY:-10,deltaMode:0,preventDefault} as unknown as WheelEvent;
    handlers.wheel!(wheel);handlers.wheel!(wheel);
    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(onCameraChange.mock.calls[1]![0].zoom).toBeCloseTo(Math.exp(.04));
  });
  it('bounds dense DOM, keeps an independent pinned marker, and caches 100k projections', () => {
    const many=Array.from({length:100000},(_,i)=>({id:String(i),x:i%400,y:Math.floor(i/400)}));
    const projected=projectPoints(many,35,false);
    expect(projectPoints(many,35,false)).toBe(projected);
    const nodes=descendants(plotViewportView({points:many,camera,selectedId:'36',renderMode:'points'}));
    expect(nodes[0]!.attrs?.['data-render-mode']).toBe('density');
    expect(nodes.filter(n=>n.attrs?.['data-bin-id']).length).toBeLessThanOrEqual(1936);
    expect(nodes.filter(n=>n.attrs?.['data-point-id']).length).toBe(0);
    expect(nodes.some(n=>n.attrs?.['data-indicator']==='selection')).toBe(true);
  });
});


it('density hover reports population, and a bin click zooms without inventing a selection', () => {
  const {svg,event}=pointerSurface();
  const dense=Array.from({length:5000},(_,i)=>({id:String(i),x:i%100,y:Math.floor(i/100)}));
  const props={camera,points:dense,onBinHover:vi.fn(),onHover:vi.fn(),onSelect:vi.fn(),onCameraChange:vi.fn()};
  const bin=descendants(plotViewportView(props)).find(n=>n.attrs?.['data-bin-id'])!;
  const group=svg.firstElementChild!;
  group.removeAttribute('data-point-id');
  for(const key of ['data-bin-id','data-bin-x','data-bin-y']) group.setAttribute(key,String(bin.attrs![key]));
  const handlers=plotViewportHandlers(props);
  handlers.move!(event(20,20));
  expect(props.onHover).toHaveBeenLastCalledWith(null);
  expect(props.onBinHover.mock.calls[0]![0].count).toBeGreaterThan(0);
  expect(typeof props.onBinHover.mock.calls[0]![0].minNumericId).toBe('string');
  handlers.down!(event(20,20));handlers.up!(event(20,20));
  expect(props.onSelect).not.toHaveBeenCalled();
  expect(props.onCameraChange.mock.calls[0]![0].zoom).toBe(2);
});
