// The surface's mode in React: the `surface` context the Workspace provides round each pane.
import { createContext, useContext } from 'react';
import { SURFACE_PLAYING, type SurfaceMode } from './surfaceMode';

export const SurfaceModeContext = createContext<SurfaceMode>(SURFACE_PLAYING);

/** The surface's mode for the pane this is called in: playing and unlocked outside any surface. */
export const useSurfaceMode = (): SurfaceMode => useContext(SurfaceModeContext);
