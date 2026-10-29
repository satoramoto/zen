import { SVG_NS } from '../../view/Tree.model';

export interface StemConnectionsParams {}
let nextMask = 0;

/** Decorative routing follows measured dial geometry, shared by both renderers. */
export function bindStemConnections(node: HTMLElement, _params: StemConnectionsParams) {
  const svg = node as unknown as SVGSVGElement;
  const parent = svg.parentElement;
  const mask = svg.querySelector('mask');
  const path = svg.querySelector('path');
  if (!parent || !mask || !path) return { destroy() {} };
  const maskId = `music-stem-mask-${++nextMask}`;
  mask.id = maskId;
  path.setAttribute('mask', `url(#${maskId})`);
  let frame = 0;
  let destroyed = false;
  let observed: Element[] = [];
  const measure = () => {
    frame = 0;
    if (destroyed) return;
    const bounds = parent.getBoundingClientRect();
    const controls = [...parent.querySelectorAll<HTMLElement>('[data-stem-order]')]
      .sort((a, b) => Number(a.dataset.stemOrder) - Number(b.dataset.stemOrder));
    const points = controls.flatMap(control => {
      const dial = control.querySelector('svg');
      if (!dial) return [];
      const box = dial.getBoundingClientRect();
      return [{ x: box.x + box.width / 2 - bounds.x, y: box.y + box.height / 2 - bounds.y }];
    });
    path.setAttribute('d', points.map((point, index) => index ? `H${point.x} V${point.y}` : `M${point.x} ${point.y}`).join(' '));
    // Keep the model's white background rect; replace only the measured cutouts.
    while (mask.children.length > 1) mask.lastElementChild?.remove();
    for (const control of controls) {
      const box = control.getBoundingClientRect();
      const rect = document.createElementNS(SVG_NS, 'rect');
      for (const [name, value] of Object.entries({ x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height })) {
        rect.setAttribute(name, String(value));
      }
      rect.setAttribute('fill', 'black');
      mask.append(rect);
    }
  };
  const schedule = () => { if (!destroyed && !frame) frame = requestAnimationFrame(measure); };
  const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  const observe = () => {
    const controls = [...parent.querySelectorAll('[data-stem-order]')];
    for (const old of observed) if (!controls.includes(old)) resize?.unobserve(old);
    for (const control of controls) if (!observed.includes(control)) resize?.observe(control);
    observed = controls;
    schedule();
  };
  resize?.observe(parent);
  const mutation = typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(records => {
    if (records.some(record => !svg.contains(record.target))) observe();
  });
  mutation?.observe(parent, { childList: true, subtree: true });
  observe();
  if (frame) cancelAnimationFrame(frame);
  measure();
  return {
    update() { observe(); },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      resize?.disconnect();
      mutation?.disconnect();
    },
  };
}
