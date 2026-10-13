import { createContext, useContext } from 'react';

/** A design window a view is drawn at (a story frame, in px). */
export interface StoryFrame {
  w: number;
  h: number;
}

/**
 * What a story asks of its frame (`parameters.frame`): a fixed design window (`{ w, h }`, drawn
 * at its size and only scaled down when the canvas is smaller), or `'fill'` (the story fills the
 * canvas at its real size, unscaled: a fluid window whose central area takes what is left).
 */
export type StoryFrameParam = StoryFrame | 'fill';

/** Provided by the Storybook story frame (`storybook.tsx`); null in an app. */
export const FrameRoom = createContext<StoryFrame | null>(null);

/**
 * The window a story frame draws at, or null outside one. A view that sizes itself by the
 * browser's window (`innerWidth`, `innerHeight`) reads this in its place, so inside a frame it
 * lays out for the design window (or, in a `fill` frame, the canvas as it is resized), not the
 * browser's. Apps never provide it, so it costs them nothing.
 */
export function useFrameRoom(): StoryFrame | null {
  return useContext(FrameRoom);
}
