// What the surface tells each pane it draws (`live-control-panels`): whether the surface is editing
// and whether the pane's tab is locked. A pane with edit affordances of its own (a control panel's
// grid) follows the surface's: it builds only while `editing && !locked`. Framework-free; React
// reads it with `useSurfaceMode` (surfaceMode.react.ts), Svelte with `getSurfaceMode`
// (surfaceMode.svelte.ts), both provided by the registered `Context` named `surface`.

export interface SurfaceMode {
  /** The surface is in edit mode. */
  editing: boolean;
  /** The pane's tab is locked for the gig. */
  locked: boolean;
}

/** Outside any surface: playing, unlocked. */
export const SURFACE_PLAYING: SurfaceMode = { editing: false, locked: false };

/** Whether a pane should show its own building tools. */
export const building = (mode: SurfaceMode): boolean => mode.editing && !mode.locked;
