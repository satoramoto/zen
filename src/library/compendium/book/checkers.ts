// The checkers the sample books register beyond the built-in `exact` and `numeric`: the math
// area's expression checker. This is content wiring: the compendium's primitives never import
// math; a book does.
import { expressionChecker } from '../../math/calculator/checker';
import type { CheckerRegistry } from '../model/exercise';

export const CHECKERS: CheckerRegistry = { expression: expressionChecker };
