import { widestText } from '../param/format';
import type { Param } from '../param/param';
import type { WidgetVars } from './Widget.model';
const cache = new WeakMap<Param, WidgetVars>();
/** Framework-free equivalent of the source reservation, memoized by immutable Param identity. */
export function reserved(param?: Param): WidgetVars {
  if (!param) return {};
  let vars = cache.get(param);
  if (!vars) { vars = { '--wdg-chars': widestText(param) }; cache.set(param, vars); }
  return vars;
}
export { reserved as useReserved };
