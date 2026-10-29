import { defineFixtures } from '../../../fixtures';
import type { MathInspectorProps } from './MathInspector.model';
export const mathInspectorStories = defineFixtures<MathInspectorProps>()({
  SelectedObject: { args: {
    title: 'Selected integer', value: '36', domain: 'ℤ⁺',
    properties: [{ label: 'Factorization', value: '2² × 3²' }, { label: 'Divisor count', value: '9' }, { label: 'Coordinates', value: '(15, 1, 0)' }],
    memberships: [
      { id: 'a', label: 'Multiples of 3', expression: '36 mod 3 = 0', matches: true, hue: 1 },
      { id: 'b', label: 'Squares', expression: '6² = 36', matches: true, hue: 2 },
      { id: 'c', label: 'Prime numbers', expression: '36 = 2 × 18', matches: false, hue: 3 },
    ],
  } },
  LargeExactObject: { args: {
    title: 'Exact object', value: '900719925474099312345678901234567890', domain: 'ℤ',
    properties: [{ label: 'Canonical representation', value: '900719925474099312345678901234567890' }],
    memberships: [{ id: 'even', label: 'Even integers', expression: '900719925474099312345678901234567890 mod 2 = 0', matches: true, hue: 1 }],
  } },
  Empty: { args: { title: 'Selected object', value: '1', domain: 'ℤ', properties: [], memberships: [] } },
});
