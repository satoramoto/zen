// The surface's mode in Svelte: set by the registered `Context` named `surface`, read by a pane.
import { getContext, setContext } from 'svelte';
import { SURFACE_PLAYING, type SurfaceMode } from './surfaceMode';

const SURFACE = Symbol('surface');

/** Provide the mode to what is drawn inside (the `Context` component calls this). `get` is read live. */
export function setSurfaceMode(get: () => SurfaceMode): void {
  setContext(SURFACE, get);
}

/** The surface's mode for the pane this is called in, read live: playing and unlocked outside any surface. */
export function getSurfaceMode(): { readonly current: SurfaceMode } {
  const get = getContext<(() => SurfaceMode) | undefined>(SURFACE);
  return {
    get current() {
      return get?.() ?? SURFACE_PLAYING;
    },
  };
}
