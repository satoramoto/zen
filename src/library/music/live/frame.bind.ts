// A live pane's frame-driven part as a store: each animation frame it asks `sample` for a value
// (the host's frame reader, through the pane's handler) and writes it to the element as a custom
// property, a percentage of 0–1, so the pane's tree is never rebuilt for it. A value that isn't
// finite hides the element: an unmeasured playhead is not drawn, rather than drawn at zero.
import { frameLoop } from '../components/Frames/frames.bind';

export interface FrameVarParams {
  /** The custom property it sets: `--live-stems-at`. */
  name: string;
  /** The current value, 0–1; anything not finite hides the element. */
  sample(): number | undefined;
}

export function bindFrameVar(node: HTMLElement, initial: FrameVarParams) {
  let params = initial;
  const draw = () => {
    const value = params.sample();
    const shown = typeof value === 'number' && Number.isFinite(value);
    node.hidden = !shown;
    if (shown) node.style.setProperty(params.name, `${Math.max(0, Math.min(1, value)) * 100}%`);
  };
  const stop = frameLoop(node, draw);
  return {
    update(next: FrameVarParams) {
      params = next;
      draw();
    },
    destroy: stop,
  };
}
