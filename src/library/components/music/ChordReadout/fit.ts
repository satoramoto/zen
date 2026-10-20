/**
 * The hero's fit, framework-free: the largest hero step at which the chord fits its column (the
 * last step when none does), measured at once, again once the web font has loaded (the fallback is
 * a different width) and whenever the column resizes. `ChordReadout.tsx` binds it in a layout
 * effect; the `chordFit` action (`fit.svelte.ts`) binds it in Svelte.
 */

/** Hero sizes, largest first: the chord takes the first at which it fits its column. */
export const FITS = ['full', '4', '5', '6', '8'] as const;
export type Fit = (typeof FITS)[number];

/** Steps `el` through the hero sizes (its `data-fit`) and leaves it at the first that fits. */
export function measureFit(el: HTMLElement): Fit {
  let chosen: Fit = FITS[FITS.length - 1];
  for (const step of FITS) {
    el.dataset.fit = step;
    if (el.scrollWidth <= el.clientWidth) {
      chosen = step;
      break;
    }
  }
  el.dataset.fit = chosen;
  return chosen;
}

export interface FitParams {
  /** Called with the step after each measure. */
  onFit: (fit: Fit) => void;
}

/** A bound fit: measure again (the chord or its size changed), or unbind. */
export interface FitBinding {
  update(params?: FitParams): void;
  destroy(): void;
}

/** Measures `node` now, once the fonts are ready and on every resize, until destroyed. */
export function bindFit(node: HTMLElement, initial: FitParams): FitBinding {
  let params = initial;
  let live = true;
  const fit = () => {
    if (live) params.onFit(measureFit(node));
  };
  fit();
  document.fonts?.ready.then(fit);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
  observer?.observe(node);
  return {
    update(next) {
      if (next) params = next;
      fit();
    },
    destroy() {
      live = false;
      observer?.disconnect();
    },
  };
}
