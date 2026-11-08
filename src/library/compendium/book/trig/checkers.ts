// The checkers the trigonometry book registers beyond `exact` and `numeric`: the math area's
// expression checker, so an exact value (√3/2) or an identity in x is checked by its value.
import { expressionChecker } from '../../../math/calculator/checker';
import type { CheckerRegistry } from '../../model/exercise';

export const TRIG_CHECKERS: CheckerRegistry = { expression: expressionChecker };
