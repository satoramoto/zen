// The runner's canvas (docs/shader-graph.md, "ShaderCanvas"): React's binding of `bindShader.ts`.
import { useLayoutEffect, useRef } from 'react';
import type { ShaderCanvasProps } from './types';
import { bindShader, type ShaderBinding, type ShaderParams } from './bindShader';

/**
 * **Job.** Draw one fragment shader behind a box: the runner a shader material rides. Every
 * ShaderCanvas on the page shares one WebGL2 context and one frame loop (`context.ts`); this
 * component is a plain 2D canvas that receives a copy of its frame, so a page can hold dozens.
 *
 * It sets the contract's uniforms: `uRes` and `uPx` from its backing size (CSS size × DPR capped
 * at 2 × `scale`), `uTime` from the page clock (or `time`, controlled), `uPointer` from the pointer
 * over its parent (`interactive`), `uRadius` (`radius`, or the parent's corner), `uTheme` and
 * `uDark` from its scope's `--surface-0`, `--text-1`, `--accent` and `--hue-1…4` (read on mount,
 * on resize and at most once a second), and `uParams` from `params`.
 *
 * It animates only while on screen and the tab is visible; with `animate={false}` or under
 * reduced motion it draws only when its frag, params, time, size or theme change. A GLSL failure
 * calls `onError` once per frag and draws nothing. It has no look of its own: the caller places
 * and sizes it (`className`, `style`), usually absolutely over its parent. Hidden from assistive
 * technology.
 */
export function ShaderCanvas({ frag, params, time, animate = true, scale = 0.5, radius, interactive = false, onError, ...rest }: ShaderCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const bound = useRef<ShaderBinding | null>(null);
  const latest: ShaderParams = { frag, params, time, animate, scale, radius, interactive, onError };
  const live = useRef(latest);
  live.current = latest;

  // Bind on mount, with this render's params...
  useLayoutEffect(() => {
    if (!ref.current) return;
    bound.current = bindShader(ref.current, live.current);
    return () => {
      bound.current?.destroy();
      bound.current = null;
    };
  }, []);
  // ...and give it every render's.
  useLayoutEffect(() => {
    bound.current?.update(live.current);
  });

  return <canvas ref={ref} aria-hidden {...rest} />;
}
