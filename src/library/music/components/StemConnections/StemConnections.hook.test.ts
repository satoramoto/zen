import { afterEach, expect, it, vi } from 'vitest';
import { bindStemConnections } from './StemConnections.store';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('measures actual dial geometry on resize and disconnects all lifecycle work on destroy', () => {
  const resizeCallbacks: ResizeObserverCallback[] = [];
  const observers: { observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
  vi.stubGlobal('ResizeObserver', class {
    observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn();
    constructor(callback: ResizeObserverCallback) { resizeCallbacks.push(callback); observers.push(this); }
  });
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  const parent = document.createElement('div');
  parent.innerHTML = '<svg class="play-stem-connections"><defs><mask><rect width="100%" height="100%" fill="white"/></mask></defs><path/></svg><div data-stem-order="1"><svg/></div><div data-stem-order="0"><svg/></div>';
  document.body.append(parent);
  const controls = [...parent.querySelectorAll<HTMLElement>('[data-stem-order]')];
  const bounds = (x: number, y: number, width: number, height: number) => ({ x, y, width, height, left: x, top: y, right: x + width, bottom: y + height, toJSON() {} });
  vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue(bounds(10, 20, 120, 240));
  controls.forEach((control, index) => {
    vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(bounds(10 + index * 60, 30 + index * 70, 50, 52));
    vi.spyOn(control.querySelector('svg')!, 'getBoundingClientRect').mockReturnValue(bounds(14 + index * 60, 32 + index * 70, 36, 36));
  });
  const svg = parent.querySelector('svg')!;
  const store = bindStemConnections(svg as unknown as HTMLElement, {});
  expect(svg.querySelector('path')?.getAttribute('d')).toBe('M82 100 H22 V30');
  expect(svg.querySelectorAll('mask > rect')).toHaveLength(3);
  expect(svg.querySelector('path')?.getAttribute('mask')).toBe(`url(#${svg.querySelector('mask')?.id})`);
  expect(observers[0].observe).toHaveBeenCalledWith(parent);
  controls.forEach(control => expect(observers[0].observe).toHaveBeenCalledWith(control));

  vi.mocked(controls[0].querySelector('svg')!.getBoundingClientRect).mockReturnValue(bounds(24, 42, 36, 36));
  resizeCallbacks[0]([], observers[0] as unknown as ResizeObserver);
  for (const [id, callback] of frames) { frames.delete(id); callback(0); }
  expect(svg.querySelector('path')?.getAttribute('d')).toBe('M82 100 H32 V40');

  resizeCallbacks[0]([], observers[0] as unknown as ResizeObserver);
  expect(frames.size).toBe(1);
  store.destroy();
  expect(observers[0].disconnect).toHaveBeenCalledOnce();
  expect(frames.size).toBe(0);
  resizeCallbacks[0]([], observers[0] as unknown as ResizeObserver);
  expect(frames.size).toBe(0);
});

it('uses a different mask for every mounted deck', () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const hosts = [document.createElement('div'), document.createElement('div')];
  const bindings = hosts.map(host => {
    host.innerHTML = '<svg><defs><mask><rect/></mask></defs><path/></svg>';
    document.body.append(host);
    return bindStemConnections(host.querySelector('svg') as unknown as HTMLElement, {});
  });
  expect(hosts[0].querySelector('mask')?.id).not.toBe(hosts[1].querySelector('mask')?.id);
  bindings.forEach(binding => binding.destroy());
});
