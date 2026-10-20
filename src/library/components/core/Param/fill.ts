import { useMemo } from 'react';
import { widestText } from './format';
import type { Param } from './param';
import type { ParamVars } from './fill.model';

// The fill helpers are framework-free in `fill.model.ts`; this file adds the React hook.
export { defaultOrigin, fillFrom, hintAttribute, originFraction, type FillOrigin, type ParamVars } from './fill.model';

/** `--lib-param-chars`: room for the parameter's longest reading, recomputed only when it changes. */
export function useReserved(param?: Param): ParamVars {
  return useMemo((): ParamVars => (param ? { '--lib-param-chars': widestText(param) } : {}), [param]);
}
