// Display's measuring, framework-free: the readouts' fit (`bindDisplayFit`, on the frame) and the
// auto form's width (`bindDisplayWide`, on the root), registered as the `displayFit` and
// `displayWide` stores (`view/stores.ts`) and bound from `displayView`'s tree. Nothing here is
// state: the fit's results are data attributes the CSS reads; the width is reported through the
// `onWide` handler, which writes the binding's `wideState` (`wide.ts`).
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

export interface DisplayFitParams {
  /** Changes whenever what the fit measures may have changed (`displayView`'s fit key): it fits again. */
  key: string;
}

/** The `displayFit` store: fits `frame` now, once the fonts are ready, whenever it resizes, and
 *  again when `key` changes, until `destroy`. */
export function bindDisplayFit(frame: HTMLElement, params: DisplayFitParams): { update(params: DisplayFitParams): void; destroy(): void } {
  let live = true;
  let key = params.key;
  const fit = () => {
    if (live) fitDisplay(frame);
  };
  fit();
  document.fonts?.ready.then(fit);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
  observer?.observe(frame);
  return {
    update(next) {
      if (next.key === key) return;
      key = next.key;
      fit();
    },
    destroy() {
      live = false;
      observer?.disconnect();
    },
  };
}

export interface DisplayWideParams {
  /** Measure only while this holds (`density="auto"` with nothing else picking the form). */
  on: boolean;
  /** Whether the element is at least `AUTO_FULL_WIDTH` wide: now, and whenever it resizes. */
  onWide?: (wide: boolean) => void;
}

/**
 * The `displayWide` store, for `density="auto"`: while `on`, reports whether `root`'s own box is
 * at least `AUTO_FULL_WIDTH` wide, now and whenever it resizes (where nothing measures, it stays
 * narrow). Turning `on` off stops watching and leaves the last report standing.
 */
export function bindDisplayWide(root: HTMLElement, params: DisplayWideParams): { update(params: DisplayWideParams): void; destroy(): void } {
  let current = params;
  let stop: (() => void) | null = null;
  const start = () => {
    const read = () => current.onWide?.(root.clientWidth >= AUTO_FULL_WIDTH);
    read();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
    observer?.observe(root);
    stop = () => observer?.disconnect();
  };
  if (params.on) start();
  return {
    update(next) {
      current = next;
      if (next.on && !stop) start();
      else if (!next.on && stop) {
        stop();
        stop = null;
      }
    },
    destroy() {
      stop?.();
      stop = null;
    },
  };
}
