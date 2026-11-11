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
