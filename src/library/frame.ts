import { createContext, useContext } from 'react';

/** A design window a view is drawn at (a story frame, in px). */
export interface StoryFrame {
  w: number;
  h: number;
}

/** Provided by the Storybook story frame (`storybook.tsx`); null in an app. */
export const FrameRoom = createContext<StoryFrame | null>(null);

/**
 * The window a story frame draws at, or null outside one. A view that sizes itself by the
 * browser's window (`innerWidth`, `innerHeight`) reads this in its place, so inside a frame it
 * lays out for the design window, not the canvas. Apps never provide it, so it costs them nothing.
 */
export function useFrameRoom(): StoryFrame | null {
  return useContext(FrameRoom);
}
