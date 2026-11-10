import { defineFixtures } from '../../../fixtures';
import type { ExpressionFieldProps } from './ExpressionField.model';
export const expressionFieldStories = defineFixtures<ExpressionFieldProps>()({
  Predicate: { args: { id: 'predicate-expression', label: 'Layer predicate', value: 'n % 3 == 0', description: 'A predicate returns true or false. Enter commits the expression.' } },
  Invalid: { args: { id: 'invalid-expression', label: 'Layer predicate', value: 'n %', error: 'Expected a value after %. Previous results remain unchanged.' } },
  ReadOnly: { args: { id: 'readonly-expression', label: 'Derived intersection', value: 'A and B', readOnly: true, description: 'Derived from two layers.' } },
  Disabled: { args: { id: 'disabled-expression', label: 'Expression', value: 'is_prime(n)', disabled: true, description: 'Connect a computation engine to evaluate.' } },
});
