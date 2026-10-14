// Whether a shader material should draw here (docs/shader-graph.md, "ShaderCanvas").
import { useSyncExternalStore } from 'react';
import { browserMayHaveGL, webgl2Available } from './context';

const QUERIES = ['(prefers-reduced-motion: reduce)', '(prefers-reduced-transparency: reduce)'];
let lists: MediaQueryList[] | undefined;
const media = () => (lists ??= QUERIES.map((q) => window.matchMedia(q)));

function subscribe(onChange: () => void) {
  if (!browserMayHaveGL()) return () => {};
  for (const m of media()) m.addEventListener('change', onChange);
  return () => {
    for (const m of media()) m.removeEventListener('change', onChange);
  };
}

function snapshot(): boolean {
  // WebGL2 is checked once, by creating the page's shared context, which the canvases then reuse.
  if (!browserMayHaveGL() || !webgl2Available()) return false;
  return !media().some((m) => m.matches);
}

const serverSnapshot = () => false;

/**
 * True when WebGL2 can be created and neither `prefers-reduced-motion: reduce` nor
 * `prefers-reduced-transparency: reduce` is set (followed live). False on the server and in jsdom.
 */
export function useShaderSupport(): boolean {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
