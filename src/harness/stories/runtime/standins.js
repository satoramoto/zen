// Runs inside Vitest before anything of the project's is loaded. These stand-ins let modules
// written for a browser load on the virtual DOM; they lay nothing out and draw nothing. A story
// that needs more than these is a story for a real browser: tag it `browser`.
class Observer { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
globalThis.ResizeObserver ??= Observer;
globalThis.IntersectionObserver ??= Observer;
if (typeof window !== 'undefined') {
  window.matchMedia ??= (query) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } });
  Element.prototype.scrollIntoView ??= () => {};
  if (typeof HTMLCanvasElement !== 'undefined') HTMLCanvasElement.prototype.getContext = () => null;
}

// Not a stand-in for the browser but a correction of the test environment: Vitest makes `window`
// the global object, and jsdom refuses it as an event's `view`, so any UI event made with
// `view: window` threw (`userEvent` clicking a label re-dispatches the click with that view).
// Such an event gets jsdom's own window as its view instead. The constructors are proxies, not
// subclasses, so `instanceof` holds for events jsdom makes itself; each prototype's `constructor`
// points at its proxy, so `new event.constructor(type, event)` is corrected too.
const jsdomWindow = globalThis.jsdom?.window;
if (jsdomWindow && jsdomWindow !== globalThis) {
  const withView = (init) => (init && typeof init === 'object' && init.view === globalThis
    ? new Proxy(init, { get: (target, key) => (key === 'view' ? jsdomWindow : Reflect.get(target, key)) })
    : init);
  for (const name of ['UIEvent', 'MouseEvent', 'PointerEvent', 'WheelEvent', 'FocusEvent', 'KeyboardEvent', 'InputEvent', 'CompositionEvent', 'TouchEvent', 'DragEvent']) {
    const Event = globalThis[name];
    if (typeof Event !== 'function' || Event.prototype.constructor !== Event) continue;
    const fixed = new Proxy(Event, {
      construct: (target, [type, init], newTarget) => Reflect.construct(target, [type, withView(init)], newTarget === fixed ? target : newTarget),
    });
    Object.defineProperty(Event.prototype, 'constructor', { value: fixed, writable: true, configurable: true });
    globalThis[name] = fixed;
  }
}
