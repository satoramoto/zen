import { widestText } from './format';
import type { Param } from './param';
import type { ParamVars } from './fill.model';

// The fill helpers are framework-free in `fill.model.ts`; this file adds the reserved width.
export { defaultOrigin, fillFrom, hintAttribute, originFraction, type FillOrigin, type ParamVars } from './fill.model';

/** Each parameter's longest reading, worked out once per parameter object. */
const widest = new WeakMap<Param, number>();

/** `--lib-param-chars`: room for the parameter's longest reading, worked out once per parameter.
 *  Framework-free (a view model calls it); NumberField still calls it by its old name, `useReserved`. */
export function reservedVars(param?: Param): ParamVars {
  if (!param) return {};
  let chars = widest.get(param);
  if (chars === undefined) {
    chars = widestText(param);
    widest.set(param, chars);
  }
  return { '--lib-param-chars': chars };
}

/** `reservedVars` under its old name (no longer a hook: it holds no React state). */
export const useReserved = reservedVars;
