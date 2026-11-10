// Hook lifecycle only: no geometry/model assertions or snapshots. Pixel behaviour lives in stories.
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { bindWaveform } from './Waveform.canvas';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.replaceChildren(); });

it('coalesces updates and scope changes, then disconnects and cancels on unmount', () => {
  const callbacks: FrameRequestCallback[] = [];
  const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callbacks.push(callback); return callbacks.length; });
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const observed: MutationObserver[] = [];
  const mutations: MutationCallback[] = [];
  class Watch {
    observe = vi.fn(); disconnect = vi.fn(); takeRecords = vi.fn(() => []);
    constructor(callback: MutationCallback) { mutations.push(callback); observed.push(this as unknown as MutationObserver); }
  }
  const resized: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
  class Size {
    observe = vi.fn(); disconnect = vi.fn(); unobserve = vi.fn();
    constructor() { resized.push(this); }
  }
  vi.stubGlobal('MutationObserver', Watch);
  vi.stubGlobal('ResizeObserver', Size);
  const media = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia', () => media);
  const scope = document.createElement('div'), canvas = document.createElement('canvas');
  scope.append(canvas); document.body.append(scope);
  const params = { peaks: new Float32Array(), ink: 'var(--text-2)' };
  const binding = bindWaveform(canvas, params);
  binding.update({ ...params, from: .2 });
  mutations.forEach((callback, i) => callback([], observed[i]));
  expect(raf).toHaveBeenCalledTimes(1);
  expect(resized[0].observe).toHaveBeenCalledWith(canvas);
  expect(observed[0].observe).toHaveBeenCalledWith(scope, { attributes: true });
  binding.destroy();
  expect(cancel).toHaveBeenCalledWith(1);
  expect(resized[0].disconnect).toHaveBeenCalledOnce();
  observed.forEach(observer => expect(observer.disconnect).toHaveBeenCalledOnce());
  expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  // Even a queued observer notification after teardown cannot schedule another paint.
  mutations.forEach((callback, i) => callback([], observed[i]));
  expect(raf).toHaveBeenCalledTimes(1);
});

it('does not reallocate an unchanged backing store when painting an empty reading', () => {
  let frame: FrameRequestCallback | undefined;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frame = callback; return 1; });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({ addEventListener() {}, removeEventListener() {} }));
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 150 } as DOMRect);
  const width = vi.spyOn(canvas, 'width', 'set'), height = vi.spyOn(canvas, 'height', 'set');
  const clearRect = vi.fn();
  vi.spyOn(canvas, 'getContext').mockReturnValue({ setTransform: vi.fn(), clearRect } as unknown as CanvasRenderingContext2D);
  const params = { peaks: [], ink: 'currentColor' };
  const binding = bindWaveform(canvas, params);
  frame!(0);
  binding.update(params);
  frame!(16);
  expect(clearRect).toHaveBeenCalledTimes(2);
  expect(width).not.toHaveBeenCalled();
  expect(height).not.toHaveBeenCalled();
  binding.destroy();
});

it('ignores transform-only observer notifications but schedules changed ink, host colour, theme, resize and props', () => {
  let nextId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    frames.set(++nextId, callback); return nextId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
  const flush = () => { const queued = [...frames.values()]; frames.clear(); queued.forEach(callback => callback(0)); };
  const changes: MutationCallback[] = [];
  vi.stubGlobal('MutationObserver', class {
    constructor(callback: MutationCallback) { changes.push(callback); }
    observe() {} disconnect() {}
  });
  let resize: ResizeObserverCallback;
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe() {} disconnect() {}
  });
  vi.stubGlobal('matchMedia', () => ({ addEventListener() {}, removeEventListener() {} }));
  const tokens: Record<string, string> = { '--host-ink': '#223344', '--host-colour': '#556677' };
  vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
    color: 'rgb(1, 2, 3)', getPropertyValue: (name: string) => tokens[name] ?? '',
  }) as CSSStyleDeclaration);
  const scope = document.createElement('div'), canvas = document.createElement('canvas');
  scope.append(canvas); document.body.append(scope);
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 150 } as DOMRect);
  const clearRect = vi.fn();
  vi.spyOn(canvas, 'getContext').mockReturnValue({ setTransform: vi.fn(), clearRect } as unknown as CanvasRenderingContext2D);
  const notify = () => changes.forEach(callback => callback([], {} as MutationObserver));
  const params = { peaks: [], ink: 'var(--host-ink)', colors: ['var(--host-colour, var(--fallback-colour))'] };
  const binding = bindWaveform(canvas, params);
  flush();
  expect(clearRect).toHaveBeenCalledOnce();
  for (let i = 0; i < 60; i++) { scope.style.transform = `translateX(${-i}px)`; notify(); flush(); }
  expect(raf).toHaveBeenCalledOnce();
  expect(clearRect).toHaveBeenCalledOnce();
  for (const name of ['--host-ink', '--host-colour', '--fallback-colour', '--instrument-spectral-mode']) {
    tokens[name] = name.endsWith('mode') ? 'deck' : '#abcdef';
    notify(); notify();
    expect(frames.size).toBe(1);
    flush();
    notify();
    expect(frames.size).toBe(0);
  }
  expect(clearRect).toHaveBeenCalledTimes(5);
  resize!([], {} as ResizeObserver);
  flush();
  binding.update({ ...params, from: .2, colors: ['var(--replacement-colour)'] });
  flush();
  tokens['--replacement-colour'] = '#ff0000';
  notify(); flush();
  expect(clearRect).toHaveBeenCalledTimes(8);
  binding.destroy();
});
