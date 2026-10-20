// The store registry: every stateful behaviour a tree can `bind`, by name. A store is framework-free
// (`bindX(node, params)` returning `update`/`destroy`); its entry here adapts it to the tree, where
// params are plain data and a callback param holds a handler's key (`keyed`). Both renderers look a
// `bind` entry up here, so there are no per-component hooks or actions.
import type { Handler } from './Tree.model';
import { bindLongPress, type LongPressParams } from '../components/core/Button/longPress';
import { bindHold, type HoldParams } from '../components/core/Button/hold';
import { bindKnob, type KnobParams } from '../components/music/Knob/knobInput';
import { bindTip, type TipParams } from './tip';
import { bindDismiss, bindFocusReturn, type DismissParams, type FocusReturnParams } from '../yahaha/AppBar/popover';
import { bindLineSlider, type LineSliderParams } from '../components/core/LineSlider/slide';
import { bindDisplayFit, bindDisplayWide, type DisplayFitParams, type DisplayWideParams } from '../yahaha/Display/fit';

/** A bound store: `update` with new params, `destroy` when the element goes. */
export interface StoreBinding<P> {
  update?(params: P): void;
  destroy?(): void;
}

/** A registered store: applied to `node` with `params`; `handler(key)` is the latest callback for a key. */
export type Store<P extends object = any> = (node: HTMLElement, params: P, handler: (key: string) => Handler | undefined) => StoreBinding<P> | void;

/** A registry of stores by name. */
export type Stores = Record<string, Store>;

/** `P` with its callback fields `F` given as handler keys. */
export type Keyed<P, F extends keyof P> = Omit<P, F> & { [K in F]?: string };

/**
 * A plain `bindX(node, params)` store as a tree store: the callback fields `fields` hold handler
 * keys in the tree, and the store reads them as the latest handlers, at the moment it calls them.
 */
export function keyed<P extends object, F extends keyof P & string>(
  bind: (node: HTMLElement, params: P) => StoreBinding<P>,
  fields: readonly F[],
): Store<Keyed<P, F>> {
  return (node, initial, handler) => {
    let params: Keyed<P, F> = initial;
    const callbacks = new Set<string>(fields);
    const live = new Proxy({} as P, {
      get(_, name) {
        const value = (params as Record<string | symbol, unknown>)[name];
        return typeof name === 'string' && callbacks.has(name) ? (typeof value === 'string' ? handler(value) : undefined) : value;
      },
    });
    const binding = bind(node, live);
    return {
      update(next) {
        params = next;
        binding.update?.(live);
      },
      destroy: () => binding.destroy?.(),
    };
  };
}

/** Every store a tree can bind, by name. A new store is one line here. */
export const stores = {
  /** Button's long press (`longPress.ts`). */
  longPress: keyed<LongPressParams, 'onLongPress' | 'onLongRelease'>(bindLongPress, ['onLongPress', 'onLongRelease']),
  /** Button's repeat-while-held (`hold.ts`). */
  hold: keyed<HoldParams, 'onHold'>(bindHold, ['onHold']),
  /** The app's tooltip action (`tip.ts`). */
  tip: keyed<TipParams, 'tipAction'>(bindTip, ['tipAction']),
  /** Knob's drag, keys, wheel, press and tooltip (`knobInput.ts`). */
  knob: keyed<KnobParams, 'tipAction' | 'onpress' | 'onstep'>(bindKnob, ['tipAction', 'onpress', 'onstep']),
  /** MetronomePopover's Esc and press-outside close (`yahaha/AppBar/popover.ts`). */
  dismiss: keyed<DismissParams, 'onClose'>(bindDismiss, ['onClose']),
  /** AppBar's focus back to the metronome's opener when its popover closes (`yahaha/AppBar/popover.ts`). */
  focusReturn: keyed<FocusReturnParams, never>(bindFocusReturn, []),
  /** LineSlider's keys and drag (`slide.ts`). */
  lineSlider: keyed<LineSliderParams, 'onchange' | 'onheld'>(bindLineSlider, ['onchange', 'onheld']),
  /** Display's readouts fitting their row, again when the key changes (`yahaha/Display/fit.ts`). */
  displayFit: keyed<DisplayFitParams, never>(bindDisplayFit, []),
  /** Display's auto form: whether the hero is wide enough for `full` (`yahaha/Display/fit.ts`). */
  displayWide: keyed<DisplayWideParams, 'onWide'>(bindDisplayWide, ['onWide']),
} satisfies Stores;

export type StoreName = keyof typeof stores;
