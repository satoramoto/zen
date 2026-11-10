/** Source wake cascade and readout warmth, applied to the shared widget root. */
export const WAKE_MARKS = 6;
export function chase(marks: number[], head: number, dt: number): number[] {
  marks[0] = head;
  const close = Math.min(1, dt / 0.055);
  for (let k = 1; k < marks.length; k += 1) marks[k] += (marks[k - 1] - marks[k]) * close;
  return marks;
}
export interface WakeOptions { live?: number; reading?: string }
export function bindWake(node: HTMLElement, initial: WakeOptions) {
  let params = initial;
  let trail: number[] | null = null;
  let heat = 0;
  let shown = params.reading;
  let frame = 0;
  let last = 0;
  const clock = node.ownerDocument.defaultView!;
  function draw(at: number) {
    frame = 0;
    const dt = Math.min(0.1, Math.max(0, (at - last) / 1000));
    last = at;
    let moving = false;
    if (params.live === undefined) trail = null;
    else {
      const head = Math.max(0, Math.min(1, params.live));
      const marks = chase(trail ?? (trail = new Array(WAKE_MARKS).fill(head)), head, dt);
      for (let k = 0; k < WAKE_MARKS; k += 1) {
        node.style.setProperty(`--wdg-wake-${k}`, marks[k].toFixed(4));
        if (Math.abs(marks[k] - head) > 0.0005) moving = true;
      }
    }
    if (heat > 0) {
      heat = Math.max(0, heat - dt / 0.3);
      node.style.setProperty('--wdg-heat', heat.toFixed(3));
      if (heat > 0) moving = true;
    }
    if (moving) frame = clock.requestAnimationFrame(draw);
  }
  function run() {
    if (frame !== 0) return;
    last = clock.performance.now();
    frame = clock.requestAnimationFrame(draw);
  }
  function update(next: WakeOptions) {
    params = next;
    if (shown !== params.reading) { shown = params.reading; heat = 1; node.style.setProperty('--wdg-heat', '1'); run(); }
    if (params.live !== undefined) run();
  }
  update(initial);
  return { update, destroy() { if (frame !== 0) clock.cancelAnimationFrame(frame); } };
}
