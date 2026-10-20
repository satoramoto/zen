// Whether a shader material should draw here (docs/shader-graph.md, "ShaderCanvas"): React's reader
// of `supported.ts`.
import { useSyncExternalStore } from 'react';
import { shaderSupported, subscribeShaderSupport } from './supported';

const serverSnapshot = () => false;

/**
 * True when WebGL2 can be created and neither `prefers-reduced-motion: reduce` nor
 * `prefers-reduced-transparency: reduce` is set (followed live). False on the server and in jsdom.
 */
export function useShaderSupport(): boolean {
  return useSyncExternalStore(subscribeShaderSupport, shaderSupported, serverSnapshot);
}
