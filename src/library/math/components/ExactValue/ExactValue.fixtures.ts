import { defineFixtures } from '../../../fixtures';
import type { ExactValueProps } from './ExactValue.model';
export const exactValueStories = defineFixtures<ExactValueProps>()({
  Integer: { args: { label: 'Selected integer', value: '36', domain: 'ℤ', kind: 'exact', size: 'numeral' } },
  BeyondMachinePrecision: { args: { label: 'Exact integer', value: '900719925474099312345678901234567890', domain: 'ℤ', kind: 'exact' } },
  Rational: { args: { label: 'Rational value', value: '355/113', domain: 'ℚ', kind: 'exact' } },
  Approximation: { args: { label: 'Numerical approximation', value: '3.141592653589793', domain: 'ℝ', kind: 'approximate', precision: '16 significant digits' } },
});
