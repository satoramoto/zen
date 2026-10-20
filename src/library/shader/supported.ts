// Whether a shader material should draw here (docs/shader-graph.md, "ShaderCanvas"), framework-free:
// `useShaderSupport` (support.ts) reads it with `useSyncExternalStore`, Svelte with `createSubscriber`.
import { browserMayHaveGL, webgl2Available } from './context';

const QUERIES = ['(prefers-reduced-motion: reduce)', '(prefers-reduced-transparency: reduce)'];
let lists: MediaQueryList[] | undefined;
const media = () => (lists ??= QUERIES.map((q) => window.matchMedia(q)));

/** Calls `onChange` when reduced motion or reduced transparency changes; returns the unsubscribe. */
export function subscribeShaderSupport(onChange: () => void): () => void {
  if (!browserMayHaveGL()) return () => {};
  for (const m of media()) m.addEventListener('change', onChange);
  return () => {
    for (const m of media()) m.removeEventListener('change', onChange);
  };
}

/**
 * True when WebGL2 can be created and neither `prefers-reduced-motion: reduce` nor
 * `prefers-reduced-transparency: reduce` is set. False on the server and in jsdom.
 */
export function shaderSupported(): boolean {
  // WebGL2 is checked once, by creating the page's shared context, which the canvases then reuse.
  if (!browserMayHaveGL() || !webgl2Available()) return false;
  return !media().some((m) => m.matches);
}
