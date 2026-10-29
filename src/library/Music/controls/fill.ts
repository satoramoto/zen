import { fractionOf, type Param } from '../param/param';
import type { WidgetVars } from './Widget.model';
export type FillOrigin = 'min' | 'center';
export function defaultOrigin(param: Param): FillOrigin {
  if (param.min >= 0 || param.max <= 0) return 'min';
  return Math.abs(fractionOf(param, 0) - 0.5) <= 0.1 ? 'center' : 'min';
}
export function originFraction(param: Param, origin: FillOrigin): number { return origin === 'center' ? fractionOf(param, 0) : 0; }
export function fillFrom(param: Param, origin: FillOrigin, fraction: number): WidgetVars {
  const from = originFraction(param, origin);
  return { '--wdg-fraction': fraction, '--wdg-fill-start': Math.min(fraction, from), '--wdg-fill-size': Math.abs(fraction - from) };
}
