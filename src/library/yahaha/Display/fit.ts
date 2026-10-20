// Display's measuring, framework-free: the readouts' fit and the auto form's width. `useFit.ts`
// binds them in React, `fit.svelte.ts` in Svelte. Nothing here is state: the fit's results are data
// attributes the CSS reads; the auto form reports `wide` to the renderer.
import { AUTO_FULL_WIDTH, DISPLAY_FITS } from './Display.model';

/**
 * Steps the three readouts down together until they fit their row (a long section name such as
 * "Ending III" in a narrow column), so the section is never cut and the ranking holds, and drops
 * the genre · metre before the style's name would end in an ellipsis. `frame` is the hero's
 * `.yh-display__frame`; the results land on it (`data-fit`) and on the style line (`data-meta`).
 */
export function fitDisplay(frame: HTMLElement): void {
  const readouts = frame.querySelector<HTMLElement>('.yh-display__readouts');
  const style = frame.querySelector<HTMLElement>('.yh-display__style');
  if (readouts) {
    let chosen: string = DISPLAY_FITS[DISPLAY_FITS.length - 1];
    for (const step of DISPLAY_FITS) {
      frame.dataset.fit = step;
      if (readouts.scrollWidth <= readouts.clientWidth + 1) {
        chosen = step;
        break;
      }
    }
    frame.dataset.fit = chosen;
  }
  if (style) {
    delete style.dataset.meta;
    const name = style.querySelector<HTMLElement>('.yh-accentblock__text');
    if (style.querySelector('.yh-display__meta') && name && name.scrollWidth > name.clientWidth + 1) style.dataset.meta = 'dropped';
  }
}

export interface FitBinding {
  /** Measures again (the content changed). */
  refit(): void;
  destroy(): void;
}

/** Fits `frame` now, once the fonts are ready, and whenever it resizes, until `destroy`. */
export function bindFit(frame: HTMLElement): FitBinding {
  let live = true;
  const fit = () => {
    if (live) fitDisplay(frame);
  };
  fit();
  document.fonts?.ready.then(fit);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
  observer?.observe(frame);
  return {
    refit: fit,
    destroy() {
      live = false;
      observer?.disconnect();
    },
  };
}

/**
 * `density="auto"`: reports whether `root`'s own box is at least `AUTO_FULL_WIDTH` wide, now and
 * whenever it resizes (where nothing measures, it stays narrow). Returns the teardown.
 */
export function observeWide(root: HTMLElement, onWide: (wide: boolean) => void): () => void {
  const read = () => onWide(root.clientWidth >= AUTO_FULL_WIDTH);
  read();
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
  observer?.observe(root);
  return () => observer?.disconnect();
}
